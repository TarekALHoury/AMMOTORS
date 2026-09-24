const assert = require('node:assert/strict');
const { test } = require('node:test');
const { InventoryQueryError, parseInventoryQuery, queryInventory } = require('../src/inventoryQuery');

const cars = [
  { id: 'a', make: 'BMW', model: 'M4', year: 2024, price: 80000, mileage: 12000, engine: 'Twin Turbo', transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol', description: 'Coupe', status: 'available' },
  { id: 'b', make: 'Audi', model: 'Q5', year: 2023, price: 60000, mileage: 22000, engine: 'Turbo', transmission: 'Automatic', drivetrain: 'AWD', fuel: 'Petrol', description: 'SUV', status: 'reserved' },
  { id: 'c', make: 'BMW', model: 'X5', year: 2022, price: 70000, mileage: 32000, engine: 'Turbo', transmission: 'Automatic', drivetrain: 'AWD', fuel: 'Hybrid', description: 'SUV', status: 'sold' },
];

test('inventory query combines search, filters, and allowlisted sorting', () => {
  const query = parseInventoryQuery({ search: 'suv turbo', make: 'bmw', maxMileage: '40000', sort: 'price-high' });
  assert.deepEqual(queryInventory(cars, query).items.map((car) => car.id), ['c']);
});

test('inventory query provides opaque cursor pagination', () => {
  const first = queryInventory(cars, parseInventoryQuery({ limit: '2', sort: 'newest' }));
  const second = queryInventory(cars, parseInventoryQuery({ limit: '2', sort: 'newest', cursor: first.page.nextCursor }));
  assert.deepEqual(first.items.map((car) => car.id), ['a', 'b']);
  assert.equal(first.page.hasMore, true);
  assert.deepEqual(second.items.map((car) => car.id), ['c']);
  assert.equal(second.page.nextCursor, null);
});

test('inventory query rejects unsupported or unsafe parameters', () => {
  assert.throws(() => parseInventoryQuery({ sort: 'drop-table', limit: '500', secret: 'x' }), InventoryQueryError);
  assert.throws(() => parseInventoryQuery({ cursor: 'not-a-cursor' }), InventoryQueryError);
  assert.throws(() => parseInventoryQuery({ minPrice: '100', maxPrice: '10' }), InventoryQueryError);
});
