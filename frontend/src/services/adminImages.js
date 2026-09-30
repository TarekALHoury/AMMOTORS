import { adminApiRequest } from './adminApi.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxImageBytes = 10 * 1024 * 1024;

function validateImageFile(file) {
  if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > maxImageBytes) {
    throw new Error('Invalid vehicle image. Use JPEG, PNG, or WebP files up to 10 MB.');
  }
}

export async function uploadCarImages(carId, files = []) {
  const uploadedUrls = [];
  for (const file of files) {
    validateImageFile(file);
    const formData = new FormData();
    formData.append('carId', carId);
    formData.append('image', file, file.name);
    const image = await adminApiRequest('/api/upload-car-image', { method: 'POST', body: formData });
    uploadedUrls.push(image);
  }
  return uploadedUrls;
}

export function deleteCarImage(carId, key) {
  return adminApiRequest('/api/delete-car-image', {
    method: 'DELETE', body: JSON.stringify({ carId, key }),
  });
}

export function deleteCarImages(carId) {
  return adminApiRequest('/api/delete-car-images', {
    method: 'DELETE', body: JSON.stringify({ carId }),
  });
}
