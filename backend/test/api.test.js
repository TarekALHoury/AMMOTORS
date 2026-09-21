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
