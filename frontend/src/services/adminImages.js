import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from '@firebase/storage';
import { firebaseStorage } from './firebaseStorage.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadCarImages(carId, files = []) {
  const uploaded = [];
  try {
    for (const file of files) {
      if (!allowedTypes.has(file.type) || file.size <= 0 || file.size >= 10 * 1024 * 1024) {
        throw new Error('Invalid vehicle image.');
      }
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const path = `cars/${carId}/${crypto.randomUUID()}.${extension}`;
      const object = ref(firebaseStorage, path);
      await uploadBytes(object, file, { contentType: file.type, customMetadata: { carId } });
      uploaded.push(object);
    }
    return Promise.all(uploaded.map(getDownloadURL));
  } catch (error) {
    await Promise.allSettled(uploaded.map(deleteObject));
    throw error;
  }
}

export async function deleteCarImages(carId) {
  const result = await listAll(ref(firebaseStorage, `cars/${carId}`));
  await Promise.all(result.items.map(deleteObject));
}
