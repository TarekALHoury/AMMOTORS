const assert = require('node:assert/strict');
const { test } = require('node:test');
const { CarsDataError, validateCars } = require('../src/carsRepository');

function validCar(overrides = {}) {
  return {
    id: 'car-001',
    make: 'BMW',
    model: 'M4 Competition',
    year: 2022,
    price: 78000,
    mileage: 12000,
    engine: '3.0L Twin-Turbo',
    horsepower: 503,
    transmission: 'Automatic',
    drivetrain: 'RWD',
    fuel: 'Petrol',
    exteriorColor: 'Black',
    interiorColor: 'Black',
    description: 'Clean example.',
    status: 'available',
    images: ['https://example.com/car.jpg'],
    ...overrides,
  };
}

test('validateCars accepts the inventory contract', () => {
  const cars = [validCar()];
  assert.equal(validateCars(cars), cars);
});

test('validateCars rejects a non-array root', () => {
  assert.throws(() => validateCars({}), CarsDataError);
});

test('validateCars rejects missing frontend fields', () => {
  assert.throws(
    () => validateCars([validCar({ make: '' })]),
    /invalid make/,
  );
});

test('validateCars rejects invalid numeric values', () => {
  assert.throws(
    () => validateCars([validCar({ price: -1 })]),
    /invalid price/,
  );
});

test('validateCars rejects invalid image collections', () => {
  assert.throws(
    () => validateCars([validCar({ images: 'car.jpg' })]),
    /invalid images/,
  );
});

test('validateCars rejects duplicate IDs', () => {
  assert.throws(
    () => validateCars([validCar(), validCar()]),
    /Duplicate car id/,
  );
});
