import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from '@firebase/firestore';
import { firebaseAuth } from './firebaseAuth.js';
import { firestore } from './firestore.js';

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

export async function createAdminCar(car) {
  const uid = requireAdminUid();
  const reference = await addDoc(collection(firestore, 'cars'), {
    ...toCarDocument(car), createdAt: serverTimestamp(), createdBy: uid,
    updatedAt: serverTimestamp(), updatedBy: uid,
  });
  return { ...car, id: reference.id };
}

export async function updateAdminCar(id, car) {
  const uid = requireAdminUid();
  await updateDoc(doc(firestore, 'cars', id), {
    ...toCarDocument(car), updatedAt: serverTimestamp(), updatedBy: uid,
  });
  return { ...car, id };
}

export async function deleteAdminCar(id) {
  requireAdminUid();
  await deleteDoc(doc(firestore, 'cars', id));
}

export { toCarDocument };
