import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker, { bucketUsage, fitsStorageLimit } from './index.js';

test('counts every R2 object across list pages', async () => {
  const calls = [];
  const bucket = {
    async list(options) {
      calls.push(options);
      return options.cursor
        ? { objects: [{ size: 3 }], truncated: false }
        : { objects: [{ size: 5 }, { size: 7 }], truncated: true, cursor: 'next' };
    },
  };
  assert.deepEqual(await bucketUsage(bucket), {
    usedBytes: 15,
    objectCount: 3,
    limitBytes: 3 * 1024 ** 3,
  });
  assert.deepEqual(calls, [{ cursor: undefined, limit: 1000 }, { cursor: 'next', limit: 1000 }]);
});

test('permits an upload at the limit and rejects one byte over', () => {
  const limit = 3 * 1024 ** 3;
  assert.equal(fitsStorageLimit(limit - 10, 10), true);
  assert.equal(fitsStorageLimit(limit - 10, 11), false);
});

test('permits the authenticated storage request preflight and rejects anonymous reads', async () => {
  const env = { ALLOWED_ORIGIN: 'https://ammotors-lb.web.app' };
  const url = 'https://image-api.example/api/storage-usage';
  const headers = { Origin: env.ALLOWED_ORIGIN };
  const preflight = await worker.fetch(new Request(url, { method: 'OPTIONS', headers }), env);
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /GET/);

  const anonymous = await worker.fetch(new Request(url, { headers }), env);
  assert.equal(anonymous.status, 401);
});
