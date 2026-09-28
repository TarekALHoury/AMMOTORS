const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const CACHE_PREFIX = 'ammotors.vpic-models.v1.';
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const memoryCache = new Map();

function normalizeModels(results) {
  return [...new Set((results || [])
    .map((item) => String(item?.Model_Name || '').trim())
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function readCache(make) {
  const key = make.toLowerCase();
  if (memoryCache.has(key)) return memoryCache.get(key);
  try {
    const cached = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${key}`));
    if (cached?.savedAt > Date.now() - CACHE_MAX_AGE && Array.isArray(cached.models)) {
      memoryCache.set(key, cached.models);
      return cached.models;
    }
  } catch {
    // A blocked or corrupt browser cache should never prevent manual entry.
  }
  return null;
}

function writeCache(make, models) {
  const key = make.toLowerCase();
  memoryCache.set(key, models);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ savedAt: Date.now(), models }));
  } catch {
    // Storage can be unavailable in private mode; the in-memory cache still works.
  }
}

export async function getInternetModelsForMake(make, { signal } = {}) {
  const normalizedMake = String(make || '').trim();
  if (!normalizedMake) return [];
  const cached = readCache(normalizedMake);
  if (cached) return cached;

  const response = await fetch(`${VPIC_BASE_URL}/GetModelsForMake/${encodeURIComponent(normalizedMake)}?format=json`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`Vehicle catalog request failed (${response.status}).`);
  const payload = await response.json();
  const models = normalizeModels(payload?.Results);
  writeCache(normalizedMake, models);
  return models;
}

export { normalizeModels };
