import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from '@firebase/firestore';
import { firebaseAuth } from './firebaseAuth.js';
import { firestore } from './firestore.js';
import { deleteCarImage, deleteCarImages, uploadCarImages } from './adminImages.js';

function requireAdminUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('Administrator authentication expired. Please sign in again.');
  return uid;
}

function toCarDocument(car) {
  const imageEntries = Array.isArray(car.imageEntries) ? car.imageEntries : [];
  return {
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
    ...(car.condition ? { condition: car.condition } : {}),
    description: car.description,
    status: car.status,
    specifications: {
      mileage: car.mileage,
      engine: car.engine,
      horsepower: car.horsepower,
      transmission: car.transmission,
      drivetrain: car.drivetrain,
      fuel: car.fuel,
      exteriorColor: car.exteriorColor,
      interiorColor: car.interiorColor,
    },
    images: car.images.map((url) => {
      const image = imageEntries.find((entry) => entry.url === url);
      return image?.key ? {
        url,
        key: image.key,
        ...(Number.isFinite(Number(image.sizeBytes ?? image.size)) ? { sizeBytes: Number(image.sizeBytes ?? image.size) } : {}),
      } : url;
    }),
  };
}

export async function createAdminCar(car, files = []) {
  const uid = requireAdminUid();
  const reference = await addDoc(collection(firestore, 'cars'), {
    ...toCarDocument(car), createdAt: serverTimestamp(), createdBy: uid,
    updatedAt: serverTimestamp(), updatedBy: uid,
  });
  try {
    const uploadedImages = await uploadCarImages(reference.id, files);
    const imageEntries = [...(car.imageEntries || []), ...uploadedImages];
    const images = [...car.images, ...uploadedImages.map((image) => image.url)];
    if (uploadedImages.length) {
      await updateDoc(reference, { images: toCarDocument({ ...car, images, imageEntries }).images, updatedAt: serverTimestamp(), updatedBy: uid });
    }
    return { ...car, images, imageEntries, id: reference.id };
  } catch (error) {
    await deleteCarImages(reference.id).catch(() => {});
    await deleteDoc(reference).catch(() => {});
    throw error;
  }
}

export async function updateAdminCar(id, car, files = [], previousImageEntries = []) {
  const uid = requireAdminUid();
  const removedImages = previousImageEntries.filter((image) => !car.images.includes(image.url));
  for (const image of removedImages) {
    if (image.key) await deleteCarImage(id, image.key);
  }
  const uploadedImages = await uploadCarImages(id, files);
  const imageEntries = [
    ...previousImageEntries.filter((image) => car.images.includes(image.url)),
    ...uploadedImages,
  ];
  const updated = { ...car, images: [...car.images, ...uploadedImages.map((image) => image.url)], imageEntries };
  await updateDoc(doc(firestore, 'cars', id), {
    ...toCarDocument(updated), updatedAt: serverTimestamp(), updatedBy: uid,
  });
  return { ...updated, id };
}

export async function deleteAdminCar(id) {
  requireAdminUid();
  await deleteCarImages(id);
  await deleteDoc(doc(firestore, 'cars', id));
}

export { toCarDocument };
