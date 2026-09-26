import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from '@firebase/firestore';
import { firebaseAuth } from './firebaseAuth.js';
import { firestore } from './firestore.js';
import { deleteCarImages, uploadCarImages } from './adminImages.js';

function requireAdminUid() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('Administrator authentication expired. Please sign in again.');
  return uid;
}

function toCarDocument(car) {
  return {
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
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
    images: car.images,
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
    const images = [...car.images, ...uploadedImages];
    if (uploadedImages.length) await updateDoc(reference, { images, updatedAt: serverTimestamp(), updatedBy: uid });
    return { ...car, images, id: reference.id };
  } catch (error) {
    await deleteDoc(reference).catch(() => {});
    throw error;
  }
}

export async function updateAdminCar(id, car, files = []) {
  const uid = requireAdminUid();
  const uploadedImages = await uploadCarImages(id, files);
  const updated = { ...car, images: [...car.images, ...uploadedImages] };
  await updateDoc(doc(firestore, 'cars', id), { ...toCarDocument(updated), updatedAt: serverTimestamp(), updatedBy: uid });
  return { ...updated, id };
}

export async function deleteAdminCar(id) {
  requireAdminUid();
  await deleteCarImages(id);
  await deleteDoc(doc(firestore, 'cars', id));
}

export { toCarDocument };
