import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ adminApiRequest: vi.fn() }));
vi.mock('./adminApi.js', () => ({ adminApiRequest: mocks.adminApiRequest }));

import { deleteCarImage, getCarImageSizes, uploadCarImages } from './adminImages.js';

describe('admin image storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.adminApiRequest.mockResolvedValue({
      url: 'https://images.example.com/cars/car-1/image.webp', key: 'cars/car-1/image.webp', sizeBytes: 5,
    });
  });

  test('uploads validated files to the authenticated backend endpoint', async () => {
    const file = new File(['image'], 'car.jpg', { type: 'image/jpeg' });
    await expect(uploadCarImages('car-1', [file])).resolves.toEqual([{
      url: 'https://images.example.com/cars/car-1/image.webp', key: 'cars/car-1/image.webp',
      sizeBytes: 5,
    }]);
    expect(mocks.adminApiRequest).toHaveBeenCalledWith('/api/upload-car-image', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
  });

  test('rejects invalid types before they leave the browser', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    await expect(uploadCarImages('car-1', [file])).rejects.toThrow('Invalid vehicle image');
    expect(mocks.adminApiRequest).not.toHaveBeenCalled();
  });

  test('removes one image through the protected API', async () => {
    await deleteCarImage('car-1', 'cars/car-1/image.webp');
    expect(mocks.adminApiRequest).toHaveBeenCalledWith('/api/delete-car-image', expect.objectContaining({ method: 'DELETE' }));
  });

  test('retrieves existing R2 image sizes through the protected API', async () => {
    const images = [{ carId: 'car-1', key: 'cars/car-1/image.webp' }];
    mocks.adminApiRequest.mockResolvedValue({ images: [{ key: images[0].key, sizeBytes: 5242880 }] });
    await expect(getCarImageSizes(images)).resolves.toEqual([{ key: images[0].key, sizeBytes: 5242880 }]);
    expect(mocks.adminApiRequest).toHaveBeenCalledWith('/api/car-image-sizes', {
      method: 'POST', body: JSON.stringify({ images }),
    });
  });
});
