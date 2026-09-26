import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ addDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(), collection: vi.fn(), doc: vi.fn(), serverTimestamp: vi.fn(() => 'timestamp') }));
vi.mock('@firebase/firestore', () => mocks);
vi.mock('./firebaseAuth.js', () => ({ firebaseAuth: { currentUser: { uid: 'admin-1' } } }));
vi.mock('./firestore.js', () => ({ firestore: {} }));

import { createAdminCar, deleteAdminCar, toCarDocument, updateAdminCar } from './adminCars.js';

const car = { make: 'BMW', model: 'M4', year: 2024, price: 80000, description: 'Clean', status: 'available', mileage: 12000, engine: '3.0L', horsepower: 503, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'Black', interiorColor: 'Black', images: [] };

describe('admin car persistence', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.addDoc.mockResolvedValue({ id: 'new-id' }); });

  test('maps the public form shape to the Firestore document contract', () => {
    expect(toCarDocument(car).specifications.mileage).toBe(12000);
    expect(toCarDocument(car)).not.toHaveProperty('id');
  });

  test('creates cars with immutable creator metadata', async () => {
    await expect(createAdminCar(car)).resolves.toMatchObject({ id: 'new-id', make: 'BMW' });
    expect(mocks.addDoc).toHaveBeenCalledOnce();
    expect(mocks.addDoc.mock.calls[0][1]).toMatchObject({ createdBy: 'admin-1', updatedBy: 'admin-1' });
  });

  test('updates and deletes the requested Firestore car', async () => {
    await updateAdminCar('car-1', car);
    await deleteAdminCar('car-1');
    expect(mocks.updateDoc).toHaveBeenCalledOnce();
    expect(mocks.deleteDoc).toHaveBeenCalledOnce();
  });
});
