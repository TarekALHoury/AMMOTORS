const fs = require('fs/promises');

class CarsDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CarsDataError';
  }
}

const requiredStringFields = [
  'id',
  'make',
  'model',
  'engine',
  'transmission',
  'drivetrain',
  'fuel',
  'exteriorColor',
  'interiorColor',
  'status',
];

const requiredNumberFields = ['year', 'price', 'mileage', 'horsepower'];

function validateCars(cars) {
  if (!Array.isArray(cars)) {
    throw new CarsDataError('Cars data must be an array.');
  }

  const ids = new Set();

  cars.forEach((car, index) => {
    if (!car || typeof car !== 'object' || Array.isArray(car)) {
      throw new CarsDataError(`Car at index ${index} must be an object.`);
    }

    for (const field of requiredStringFields) {
      if (typeof car[field] !== 'string' || car[field].trim() === '') {
        throw new CarsDataError(`Car at index ${index} has an invalid ${field}.`);
      }
    }

    for (const field of requiredNumberFields) {
      if (!Number.isFinite(car[field]) || car[field] < 0) {
        throw new CarsDataError(`Car at index ${index} has an invalid ${field}.`);
      }
    }

    if (!Array.isArray(car.images) || car.images.some((image) => typeof image !== 'string')) {
      throw new CarsDataError(`Car at index ${index} has invalid images.`);
    }

    if (car.description != null && typeof car.description !== 'string') {
      throw new CarsDataError(`Car at index ${index} has an invalid description.`);
    }

    if (ids.has(car.id)) {
      throw new CarsDataError(`Duplicate car id: ${car.id}.`);
    }

    ids.add(car.id);
  });

  return cars;
}

function createCarsRepository({ carsFile }) {
  if (!carsFile) {
    throw new TypeError('carsFile is required.');
  }

  async function getAll() {
    const data = await fs.readFile(carsFile, 'utf8');
    return validateCars(JSON.parse(data));
  }

  async function getById(id) {
    const cars = await getAll();
    return cars.find((car) => car.id === id) || null;
  }

  return { getAll, getById };
}

module.exports = { CarsDataError, createCarsRepository, validateCars };
