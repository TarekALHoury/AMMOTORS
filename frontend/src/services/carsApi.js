import { collection, doc, getDoc, getDocs } from '@firebase/firestore';
import { firestore } from './firebase.js';

export class CarsApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CarsApiError';
    this.status = status;
  }
}

function toPublicCar(snapshot) {
  const data = snapshot.data();
  const specifications = data.specifications || {};

  return {
    id: snapshot.id,
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    mileage: specifications.mileage,
    engine: specifications.engine,
    horsepower: specifications.horsepower,
    transmission: specifications.transmission,
    drivetrain: specifications.drivetrain,
    fuel: specifications.fuel,
    exteriorColor: specifications.exteriorColor,
    interiorColor: specifications.interiorColor,
    description: data.description,
    status: data.status,
    images: data.images || [],
  };
}

export async function getCars() {
  try {
    const snapshot = await getDocs(collection(firestore, 'cars'));
    return snapshot.docs.map(toPublicCar).sort((left, right) => left.id.localeCompare(right.id));
  } catch {
    throw new CarsApiError('Unable to load vehicles.', 0);
  }
}

export async function getCarById(id) {
  try {
    const snapshot = await getDoc(doc(firestore, 'cars', id));
    if (!snapshot.exists()) throw new CarsApiError('Car not found.', 404);
    return toPublicCar(snapshot);
  } catch (error) {
    if (error instanceof CarsApiError) throw error;
    throw new CarsApiError('Unable to load vehicle.', 0);
  }
}
