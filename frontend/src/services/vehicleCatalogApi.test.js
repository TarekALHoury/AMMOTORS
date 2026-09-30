import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getInternetModelsForMake, mergeModelNames, normalizeModels } from './vehicleCatalogApi.js';

describe('vehicle catalog API', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('normalizes, de-duplicates, and naturally sorts model names', () => {
    expect(normalizeModels([
      { Model_Name: 'M8' }, { Model_Name: ' 8 Series ' }, { Model_Name: 'M8' }, { Model_Name: '' }, {},
    ])).toEqual(['8 Series', 'M8']);
  });

  test('merges casing variants while preserving genuinely different models', () => {
    expect(mergeModelNames(['E-Pace', 'F-Pace'], ['E-PACE', 'F-TYPE', 'F-Type R']))
      .toEqual(['E-Pace', 'F-Pace', 'F-TYPE', 'F-Type R']);
  });

  test('loads models from the free NHTSA catalog and caches them', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ Results: [{ Model_Name: 'M8' }, { Model_Name: '8 Series' }] }),
    });
    await expect(getInternetModelsForMake('BMW')).resolves.toEqual(['8 Series', 'M8']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/BMW?format=json',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
    await expect(getInternetModelsForMake('BMW')).resolves.toEqual(['8 Series', 'M8']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('rejects failed responses so the form can retain its offline catalog', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 });
    await expect(getInternetModelsForMake('Unavailable Make')).rejects.toThrow('Vehicle catalog request failed (503).');
  });
});
