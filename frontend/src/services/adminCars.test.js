import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ addDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(), collection: vi.fn(), doc: vi.fn(), serverTimestamp: vi.fn(() => 'timestamp'), uploadCarImages: vi.fn(), deleteCarImage: vi.fn(), deleteCarImages: vi.fn() }));
vi.mock('@firebase/firestore', () => mocks);
vi.mock('./firebaseAuth.js', () => ({ firebaseAuth: { currentUser: { uid: 'admin-1' } } }));
vi.mock('./firestore.js', () => ({ firestore: {} }));
vi.mock('./adminImages.js', () => ({ uploadCarImages: mocks.uploadCarImages, deleteCarImage: mocks.deleteCarImage, deleteCarImages: mocks.deleteCarImages }));

import { createAdminCar, deleteAdminCar, toCarDocument, updateAdminCar } from './adminCars.js';

const car = { make: 'BMW', model: 'M4', year: 2024, price: 80000, description: 'Clean', status: 'available', mileage: 12000, engine: '3.0L', horsepower: 503, transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', exteriorColor: 'Black', interiorColor: 'Black', images: [] };

describe('admin car persistence', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.addDoc.mockResolvedValue({ id: 'new-id' }); mocks.uploadCarImages.mockResolvedValue([]); mocks.deleteCarImages.mockResolvedValue(); });

  test('maps the public form shape to the Firestore document contract', () => {
    expect(toCarDocument(car).specifications.mileage).toBe(12000);
    expect(toCarDocument(car)).not.toHaveProperty('id');
  });

  test('creates cars in Firestore before uploading images to the Worker', async () => {
    await expect(createAdminCar(car)).resolves.toMatchObject({ id: 'new-id', make: 'BMW' });
    expect(mocks.addDoc).toHaveBeenCalledOnce();
    expect(mocks.addDoc.mock.calls[0][1]).toMatchObject({ createdBy: 'admin-1', updatedBy: 'admin-1' });
  });

  test('stores Worker image URL and R2 key in Firestore', async () => {
    const file = new File(['image'], 'car.jpg', { type: 'image/jpeg' });
    mocks.uploadCarImages.mockResolvedValue([{ url: 'https://images.example/car.webp', key: 'cars/new-id/car.webp' }]);
    await createAdminCar(car, [file]);
    expect(mocks.updateDoc.mock.calls[0][1].images).toEqual([{ url: 'https://images.example/car.webp', key: 'cars/new-id/car.webp' }]);
  });

  test('removes the matching R2 key before replacing Firestore car data', async () => {
    const previous = [{ url: 'https://images.example/old.webp', key: 'cars/car-1/old.webp' }];
    await updateAdminCar('car-1', car, [], previous);
    expect(mocks.deleteCarImage).toHaveBeenCalledWith('car-1', previous[0].key);
    expect(mocks.updateDoc).toHaveBeenCalledOnce();
  });

  test('deletes a vehicle R2 prefix before its Firestore document', async () => {
    await deleteAdminCar('car-1');
    expect(mocks.deleteCarImages).toHaveBeenCalledWith('car-1');
    expect(mocks.deleteDoc).toHaveBeenCalledOnce();
  });
});
