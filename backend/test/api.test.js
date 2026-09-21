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
