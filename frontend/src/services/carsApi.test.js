import { beforeEach, describe, expect, test, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({ getDoc: vi.fn(), getDocs: vi.fn() }));

vi.mock('@firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
}));
vi.mock('./firebase.js', () => ({ firestore: {} }));

import { getCarById, getCars } from './carsApi.js';

const carData = {
  make: 'BMW', model: 'M4', year: 2024, price: 80000, description: 'Cached car', status: 'available', images: [],
  specifications: { mileage: 12000, engine: '3.0L', horsepower: 503, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'Black', interiorColor: 'Black' },
};

function snapshot(id = 'car-1', data = carData) {
  return { id, data: () => data };
}

describe('offline car data cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('caches successful inventory reads and uses them when Firestore is offline', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [snapshot()] });
    expect(await getCars()).toHaveLength(1);

    firestoreMocks.getDocs.mockRejectedValueOnce(new Error('offline'));
    expect(await getCars()).toEqual([expect.objectContaining({ id: 'car-1', make: 'BMW' })]);
  });

  test('uses a cached vehicle for offline detail refreshes', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({ docs: [snapshot()] });
    await getCars();
    firestoreMocks.getDoc.mockRejectedValueOnce(new Error('offline'));

    expect(await getCarById('car-1')).toEqual(expect.objectContaining({ model: 'M4' }));
  });

  test('still reports an error when offline data has never been cached', async () => {
    firestoreMocks.getDocs.mockRejectedValueOnce(new Error('offline'));
    await expect(getCars()).rejects.toMatchObject({ status: 0 });
  });
});
