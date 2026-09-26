import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ uploadBytes: vi.fn(), getDownloadURL: vi.fn(), deleteObject: vi.fn(), listAll: vi.fn(), ref: vi.fn((_storage, path) => ({ path })) }));
vi.mock('@firebase/storage', () => mocks);
vi.mock('./firebaseStorage.js', () => ({ firebaseStorage: {} }));

import { deleteCarImages, uploadCarImages } from './adminImages.js';

describe('admin image storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', { randomUUID: () => 'unique-id' });
    mocks.uploadBytes.mockResolvedValue();
    mocks.getDownloadURL.mockResolvedValue('https://storage.example/car.jpg');
  });

  test('uploads validated files under the owning car prefix', async () => {
    const file = new File(['image'], 'car.jpg', { type: 'image/jpeg' });
    await expect(uploadCarImages('car-1', [file])).resolves.toEqual(['https://storage.example/car.jpg']);
    expect(mocks.ref).toHaveBeenCalledWith({}, 'cars/car-1/unique-id.jpg');
    expect(mocks.uploadBytes).toHaveBeenCalledWith(expect.anything(), file, { contentType: 'image/jpeg', customMetadata: { carId: 'car-1' } });
  });

  test('rejects invalid types before uploading', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    await expect(uploadCarImages('car-1', [file])).rejects.toThrow('Invalid vehicle image.');
    expect(mocks.uploadBytes).not.toHaveBeenCalled();
  });

  test('deletes every image stored under a car prefix', async () => {
    const items = [{ path: 'a' }, { path: 'b' }];
    mocks.listAll.mockResolvedValue({ items });
    await deleteCarImages('car-1');
    expect(mocks.deleteObject).toHaveBeenCalledTimes(2);
  });
});
