const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createApp } = require('../src/app');

let server;
let baseUrl;
before(async () => {
  server = createApp({ rateLimits: { public: 2 } }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));

test('public inventory rate limit returns standard retry metadata', async () => {
  const first = await fetch(`${baseUrl}/api/cars`);
  const second = await fetch(`${baseUrl}/api/cars`);
  const blocked = await fetch(`${baseUrl}/api/cars`);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('ratelimit-limit'), '2');
  assert.ok(Number(blocked.headers.get('retry-after')) >= 1);
  assert.deepEqual(await blocked.json(), { message: 'Too many requests. Please try again later.' });
});

test('trusted proxy requests are limited by the forwarded client IP', async (context) => {
  const proxyServer = createApp({ trustProxy: 1, rateLimits: { public: 1 } }).listen(0);
  await new Promise((resolve) => proxyServer.once('listening', resolve));
  context.after(() => new Promise((resolve) => proxyServer.close(resolve)));
  const proxyBaseUrl = `http://127.0.0.1:${proxyServer.address().port}`;

  const firstClient = await fetch(`${proxyBaseUrl}/api/cars`, { headers: { 'X-Forwarded-For': '198.51.100.1' } });
  const secondClient = await fetch(`${proxyBaseUrl}/api/cars`, { headers: { 'X-Forwarded-For': '198.51.100.2' } });
  const firstClientAgain = await fetch(`${proxyBaseUrl}/api/cars`, { headers: { 'X-Forwarded-For': '198.51.100.1' } });

  assert.equal(firstClient.status, 200);
  assert.equal(secondClient.status, 200);
  assert.equal(firstClientAgain.status, 429);
});
