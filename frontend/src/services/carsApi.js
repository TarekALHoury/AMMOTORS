import { collection, doc, getDoc, getDocs } from '@firebase/firestore';
import { firestore } from './firestore.js';

const CARS_CACHE_KEY = 'ammotors.public-cars.v1';

function readCachedCars() {
  try {
    const cached = JSON.parse(localStorage.getItem(CARS_CACHE_KEY));
    return Array.isArray(cached?.cars) ? cached.cars : null;
  } catch {
    return null;
  }
}

function cacheCars(cars) {
  try {
    localStorage.setItem(CARS_CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), cars }));
  } catch {
    // Browsers may disable or exhaust storage. Live Firestore data still works normally.
  }
}

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
  const imageEntries = (Array.isArray(data.images) ? data.images : [])
    .map((image) => typeof image === 'string'
      ? { url: image, key: null, sizeBytes: null }
      : {
        url: image?.url,
        key: image?.key || null,
        sizeBytes: image?.sizeBytes != null && Number.isFinite(Number(image.sizeBytes)) ? Number(image.sizeBytes) : null,
      })
    .filter((image) => typeof image.url === 'string');

  return {
    id: snapshot.id,
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    condition: data.condition || '',
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
    images: imageEntries.map((image) => image.url),
    imageEntries,
  };
}

function newestFirst(left, right) {
  const leftCreated = left.data().createdAt?.toMillis?.() || 0;
  const rightCreated = right.data().createdAt?.toMillis?.() || 0;
  return rightCreated - leftCreated || left.id.localeCompare(right.id);
}

export async function getCars() {
  try {
    const snapshot = await getDocs(collection(firestore, 'cars'));
    const cars = [...snapshot.docs].sort(newestFirst).map(toPublicCar);
    cacheCars(cars);
    return cars;
  } catch {
    const cachedCars = readCachedCars();
    if (cachedCars) return cachedCars;
    throw new CarsApiError('Unable to load vehicles.', 0);
  }
}

export async function getCarById(id) {
  try {
    const snapshot = await getDoc(doc(firestore, 'cars', id));
    if (!snapshot.exists()) throw new CarsApiError('Car not found.', 404);
    const car = toPublicCar(snapshot);
    const cachedCars = readCachedCars() || [];
    cacheCars([...cachedCars.filter((cachedCar) => cachedCar.id !== car.id), car]);
    return car;
  } catch (error) {
    if (error instanceof CarsApiError) throw error;
    const cachedCar = readCachedCars()?.find((car) => car.id === id);
    if (cachedCar) return cachedCar;
    throw new CarsApiError('Unable to load vehicle.', 0);
  }
}
