const assert = require('node:assert/strict');
const { test } = require('node:test');
const { CarValidationError, normalizeCarInput } = require('../src/carInput');

function validInput(overrides = {}) {
  return {
    make: 'BMW',
    model: 'M4 Competition',
    year: 2024,
    price: 80000,
    description: 'Clean vehicle.',
    status: 'available',
    specifications: {
      mileage: 12000,
      engine: '3.0L Twin-Turbo',
      horsepower: 503,
      transmission: 'Automatic',
      drivetrain: 'RWD',
      fuel: 'Petrol',
      exteriorColor: 'Black',
      interiorColor: 'Black',
    },
    images: ['https://firebasestorage.googleapis.com/v0/b/example/o/car.jpg'],
    ...overrides,
  };
}

test('normalizeCarInput accepts and sanitizes a complete car', () => {
  const result = normalizeCarInput(validInput({
    make: ' <b>BMW</b> ',
    description: '<script>alert(1)</script> Clean vehicle.',
  }));

  assert.equal(result.make, 'BMW');
  assert.equal(result.description, 'alert(1) Clean vehicle.');
  assert.equal(result.specifications.horsepower, 503);
});

test('normalizeCarInput rejects unknown fields to prevent mass assignment', () => {
  assert.throws(
    () => normalizeCarInput(validInput({ createdBy: 'attacker' })),
    (error) => error instanceof CarValidationError && /Unknown fields/.test(error.errors.body),
  );
});

test('normalizeCarInput rejects invalid status, year, price, and image URLs', () => {
  assert.throws(
    () => normalizeCarInput(validInput({
      status: 'hidden', year: 1800, price: -1, images: ['javascript:alert(1)'],
    })),
    (error) => {
      assert.ok(error.errors.status);
      assert.ok(error.errors.year);
      assert.ok(error.errors.price);
      assert.ok(error.errors.images);
      return true;
    },
  );
});

test('normalizeCarInput preserves valid R2 image size metadata', () => {
  const result = normalizeCarInput(validInput({
    images: [{ url: 'https://images.example.com/cars/car-1/front.webp', key: 'cars/car-1/front.webp', sizeBytes: 5242880 }],
  }));
  assert.deepEqual(result.images, [{ url: 'https://images.example.com/cars/car-1/front.webp', key: 'cars/car-1/front.webp', sizeBytes: 5242880 }]);
});

test('partial updates accept selected nested specification fields', () => {
  assert.deepEqual(
    normalizeCarInput({ specifications: { mileage: 15000 } }, { partial: true }),
    { specifications: { mileage: 15000 } },
  );
});

test('partial updates reject empty bodies', () => {
  assert.throws(
    () => normalizeCarInput({}, { partial: true }),
    CarValidationError,
  );
});

test('complete cars require all public specification fields', () => {
  assert.throws(
    () => normalizeCarInput(validInput({ specifications: { mileage: 100 } })),
    CarValidationError,
  );
});

module.exports = { validInput };
