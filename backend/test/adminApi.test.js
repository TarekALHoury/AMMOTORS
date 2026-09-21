const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { createApp } = require('../src/app');
const { CarNotFoundError } = require('../src/firestoreCarsRepository');

const validCarInput = {
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
};

function publicCar(id, car) {
  return {
    id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
    mileage: car.specifications.mileage,
    engine: car.specifications.engine,
    horsepower: car.specifications.horsepower,
    transmission: car.specifications.transmission,
    drivetrain: car.specifications.drivetrain,
    fuel: car.specifications.fuel,
    exteriorColor: car.specifications.exteriorColor,
    interiorColor: car.specifications.interiorColor,
    description: car.description,
    status: car.status,
    images: car.images,
  };
}

let baseUrl;
let server;
let cars;
let deletedImageIds;

const repository = {
  async create(car) {
    cars.set('generated-id', car);
    return publicCar('generated-id', car);
  },
  async getAll() {
    return [...cars].map(([id, car]) => publicCar(id, car));
  },
  async getById(id) {
    return cars.has(id) ? publicCar(id, cars.get(id)) : null;
  },
  async update(id, changes) {
    if (!cars.has(id)) throw new CarNotFoundError();
    const current = cars.get(id);
    const updated = {
      ...current,
      ...changes,
      specifications: { ...current.specifications, ...changes.specifications },
    };
    cars.set(id, updated);
    return publicCar(id, updated);
  },
  async remove(id) {
    if (!cars.has(id)) throw new CarNotFoundError();
    cars.delete(id);
  },
};

const adminAuth = {
  async verifyIdToken(token) {
    if (token === 'admin-token') return { uid: 'admin-1', admin: true };
    if (token === 'user-token') return { uid: 'user-1' };
    throw new Error('invalid token');
  },
};

before(async () => {
  server = createApp({
    adminAuth,
    carsRepository: repository,
    imageStorage: { deleteCarImages: async (id) => deletedImageIds.push(id) },
    logger: { error() {} },
  }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

beforeEach(() => {
  cars = new Map();
  deletedImageIds = [];
});

async function adminRequest(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: 'Bearer admin-token',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

test('admin routes require a bearer token', async () => {
  const response = await fetch(`${baseUrl}/api/admin/cars`, { method: 'POST' });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Authentication required.' });
});

test('admin routes reject invalid tokens', async () => {
  const response = await adminRequest('/api/admin/cars', {
    method: 'POST', headers: { Authorization: 'Bearer invalid' }, body: '{}',
  });
  assert.equal(response.status, 401);
});

test('admin routes reject authenticated non-admin users', async () => {
  const response = await adminRequest('/api/admin/cars', {
    method: 'POST', headers: { Authorization: 'Bearer user-token' }, body: '{}',
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: 'Admin access required.' });
});

test('an admin can create a car and public reads retain the existing contract', async () => {
  const createResponse = await adminRequest('/api/admin/cars', {
    method: 'POST', body: JSON.stringify(validCarInput),
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(created.id, 'generated-id');
  assert.equal(created.engine, validCarInput.specifications.engine);

  const publicResponse = await fetch(`${baseUrl}/api/cars/generated-id`);
  assert.equal(publicResponse.status, 200);
  assert.deepEqual(await publicResponse.json(), created);
});

test('an admin can update car fields and nested specifications', async () => {
  cars.set('car-1', structuredClone(validCarInput));
  const response = await adminRequest('/api/admin/cars/car-1', {
    method: 'PATCH',
    body: JSON.stringify({ price: 79000, specifications: { mileage: 13000 } }),
  });
  const updated = await response.json();
  assert.equal(response.status, 200);
  assert.equal(updated.price, 79000);
  assert.equal(updated.mileage, 13000);
  assert.equal(updated.engine, validCarInput.specifications.engine);
});

test('an admin can replace a car with PUT', async () => {
  cars.set('car-1', structuredClone(validCarInput));
  const replacement = { ...validCarInput, make: 'Audi', model: 'RS 5' };
  const response = await adminRequest('/api/admin/cars/car-1', {
    method: 'PUT', body: JSON.stringify(replacement),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).make, 'Audi');
});

test('an admin can delete a car and its Storage prefix', async () => {
  cars.set('car-1', structuredClone(validCarInput));
  const response = await adminRequest('/api/admin/cars/car-1', { method: 'DELETE' });
  assert.equal(response.status, 204);
  assert.equal(cars.has('car-1'), false);
  assert.deepEqual(deletedImageIds, ['car-1']);
});

test('admin validation errors are structured and do not write data', async () => {
  const response = await adminRequest('/api/admin/cars', {
    method: 'POST', body: JSON.stringify({ ...validCarInput, price: -1 }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.message, 'Invalid car data.');
  assert.ok(body.errors.price);
  assert.equal(cars.size, 0);
});

test('updates and deletes return the existing car 404 shape', async () => {
  const updateResponse = await adminRequest('/api/admin/cars/missing', {
    method: 'PATCH', body: JSON.stringify({ status: 'sold' }),
  });
  const deleteResponse = await adminRequest('/api/admin/cars/missing', { method: 'DELETE' });
  assert.equal(updateResponse.status, 404);
  assert.deepEqual(await updateResponse.json(), { message: 'Car not found.' });
  assert.equal(deleteResponse.status, 404);
  assert.deepEqual(deletedImageIds, []);
});
