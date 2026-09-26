import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, test, vi } from 'vitest';

function loadWorker({ fetchResponse, openCache }) {
  const listeners = {};
  const context = {
    URL,
    fetch: vi.fn().mockResolvedValue(fetchResponse),
    caches: { match: vi.fn().mockResolvedValue(null), open: openCache, keys: vi.fn().mockResolvedValue([]), delete: vi.fn() },
    self: {
      location: { origin: 'https://ammotors.example' },
      addEventListener: (name, listener) => { listeners[name] = listener; },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    },
  };
  runInNewContext(readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8'), context);
  return listeners;
}

describe('service worker response caching', () => {
  test.each([
    ['navigation', { mode: 'navigate', url: 'https://ammotors.example/cars' }],
    ['asset', { mode: 'cors', url: 'https://ammotors.example/assets/app.js' }],
  ])('clones %s responses before asynchronous cache access', async (_name, request) => {
    let resolveCache;
    const openCache = vi.fn(() => new Promise((resolve) => { resolveCache = resolve; }));
    const response = new Response('content', { status: 200 });
    const originalClone = response.clone.bind(response);
    response.clone = vi.fn(originalClone);
    const listeners = loadWorker({ fetchResponse: response, openCache });
    let responsePromise;
    listeners.fetch({ request: { method: 'GET', ...request }, respondWith: (promise) => { responsePromise = promise; } });

    const delivered = await responsePromise;
    expect(response.clone).toHaveBeenCalledOnce();
    await expect(delivered.text()).resolves.toBe('content');
    resolveCache({ put: vi.fn().mockResolvedValue() });
  });
});
