const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createApp } = require('../src/app');

let baseUrl;
let server;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('GET /api/health reports that the API is available', async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('API responses include defensive security headers', async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('public inventory responses advertise short resilient caching', async () => {
  const listResponse = await fetch(`${baseUrl}/api/cars`);
  const detailResponse = await fetch(`${baseUrl}/api/cars/car-001`);

  assert.equal(listResponse.headers.get('cache-control'), 'public, max-age=60, stale-while-revalidate=300');
  assert.equal(detailResponse.headers.get('cache-control'), 'public, max-age=60, stale-while-revalidate=300');
  assert.notEqual(listResponse.headers.get('x-request-id'), detailResponse.headers.get('x-request-id'));
});

test('default CORS behavior preserves access for the frontend', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });

  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  );
});

test('GET /api/cars preserves the frontend array contract', async () => {
  const response = await fetch(`${baseUrl}/api/cars`);
  const cars = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(cars));
  assert.ok(cars.length > 0);
  assert.equal(typeof cars[0].id, 'string');
  assert.equal(typeof cars[0].images, 'object');
});

test('GET /api/cars/:id returns a matching car', async () => {
  const response = await fetch(`${baseUrl}/api/cars/car-001`);
  const car = await response.json();

  assert.equal(response.status, 200);
  assert.equal(car.id, 'car-001');
});

test('GET /api/cars/:id returns the existing 404 error shape', async () => {
  const response = await fetch(`${baseUrl}/api/cars/not-a-real-car`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'Car not found.' });
});

test('unknown API routes return JSON', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'API route not found.' });
});

test('admin routes fail closed when Firebase is not configured', async () => {
  const response = await fetch(`${baseUrl}/api/admin/cars`, { method: 'POST' });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { message: 'Admin service is not configured.' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('malformed JSON receives a safe client error', async () => {
  const response = await fetch(`${baseUrl}/api/admin/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'Invalid JSON body.' });
});

test('oversized JSON is rejected before authentication or processing', async () => {
  const response = await fetch(`${baseUrl}/api/admin/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'x'.repeat(101 * 1024) }),
  });
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { message: 'Request body is too large.' });
});

test('CORS allowlisting only exposes configured origins', async (context) => {
  const restrictedServer = createApp({
    allowedOrigins: ['https://ammotors.example'],
  }).listen(0);
  await new Promise((resolve) => restrictedServer.once('listening', resolve));
  context.after(() => new Promise((resolve, reject) => {
    restrictedServer.close((error) => (error ? reject(error) : resolve()));
  }));
  const restrictedBaseUrl = `http://127.0.0.1:${restrictedServer.address().port}`;

  const allowedResponse = await fetch(`${restrictedBaseUrl}/api/health`, {
    headers: { Origin: 'https://ammotors.example' },
  });
  const blockedResponse = await fetch(`${restrictedBaseUrl}/api/health`, {
    headers: { Origin: 'https://untrusted.example' },
  });

  assert.equal(
    allowedResponse.headers.get('access-control-allow-origin'),
    'https://ammotors.example',
  );
  assert.equal(blockedResponse.headers.get('access-control-allow-origin'), null);
});

test('inventory failures preserve safe route-specific error contracts', async (context) => {
  const dataError = new Error('sensitive filesystem details');
  const failingRepository = {
    getAll: async () => { throw dataError; },
    getById: async () => { throw dataError; },
  };
  const loggedErrors = [];
  const failureServer = createApp({
    carsRepository: failingRepository,
    logger: { error: (...args) => loggedErrors.push(args) },
  }).listen(0);
  await new Promise((resolve) => failureServer.once('listening', resolve));
  context.after(() => new Promise((resolve, reject) => {
    failureServer.close((error) => (error ? reject(error) : resolve()));
  }));
  const failureBaseUrl = `http://127.0.0.1:${failureServer.address().port}`;

  const listResponse = await fetch(`${failureBaseUrl}/api/cars`);
  const detailResponse = await fetch(`${failureBaseUrl}/api/cars/car-001`);

  assert.equal(listResponse.status, 500);
  assert.deepEqual(await listResponse.json(), { message: 'Could not load cars.' });
  assert.equal(detailResponse.status, 500);
  assert.deepEqual(await detailResponse.json(), { message: 'Could not load car.' });
  assert.equal(loggedErrors.length, 2);
});
