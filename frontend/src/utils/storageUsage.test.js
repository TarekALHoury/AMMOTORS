import { describe, expect, test } from 'vitest';
import { CLOUDFLARE_STORAGE_LIMIT_BYTES, STORAGE_WARNING_BYTES, formatBytes, formatRemainingBytes, inventoryImageUsage, vehicleImageUsage } from './storageUsage.js';

describe('image storage usage', () => {
  test('aggregates known R2 bytes without inventing sizes for legacy URLs', () => {
    const car = {
      images: ['https://img/one', 'https://img/two', 'https://img/legacy'],
      imageEntries: [{ url: 'https://img/one', sizeBytes: 1_000_000 }, { url: 'https://img/two', size: 500_000 }],
    };
    expect(vehicleImageUsage(car)).toEqual({ knownBytes: 1_500_000, unknownImages: 1 });
    expect(inventoryImageUsage([car, { images: [], imageEntries: [] }])).toEqual({ knownBytes: 1_500_000, unknownImages: 1 });
  });

  test('formats usage and defines the requested three-gigabyte limit', () => {
    expect(CLOUDFLARE_STORAGE_LIMIT_BYTES).toBe(3 * 1024 ** 3);
    expect(STORAGE_WARNING_BYTES).toBe(2.5 * 1024 ** 3);
    expect(formatBytes(4.8 * 1024 ** 2)).toBe('4.8 MB');
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.00 GB');
    expect(formatRemainingBytes(3 * 1024 ** 3 - 5.6 * 1024 ** 2)).toBe('2.995 GB');
  });

  test('includes measured R2 sizes when image metadata does not contain them', () => {
    const car = {
      images: ['https://img/measured', 'https://img/unknown'],
      imageEntries: [
        { url: 'https://img/measured', key: 'cars/one/measured.webp', sizeBytes: null },
        { url: 'https://img/unknown', key: 'cars/one/unknown.webp', sizeBytes: null },
      ],
    };
    expect(vehicleImageUsage(car, { 'cars/one/measured.webp': 1024 })).toEqual({
      knownBytes: 1024,
      unknownImages: 1,
    });
  });
});
