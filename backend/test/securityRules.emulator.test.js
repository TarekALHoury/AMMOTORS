const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } = require('firebase/firestore');
const { deleteObject, getBytes, ref, uploadBytes } = require('firebase/storage');
const { FieldValue, Firestore } = require('@google-cloud/firestore');
const { createFirestoreCarsRepository } = require('../src/firestoreCarsRepository');

const emulatorAvailable = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_STORAGE_EMULATOR_HOST,
);
let environment;

function carData(overrides = {}) {
  return {
    make: 'BMW', model: 'M4 Competition', year: 2024, price: 80000,
    description: 'Clean vehicle.', status: 'available', images: [],
    specifications: {
      mileage: 12000, engine: '3.0L Twin-Turbo', horsepower: 503,
      transmission: 'Automatic', drivetrain: 'RWD', fuel: 'Petrol',
      exteriorColor: 'Black', interiorColor: 'Black',
    },
    createdAt: serverTimestamp(), createdBy: 'admin-1',
    updatedAt: serverTimestamp(), updatedBy: 'admin-1',
    ...overrides,
  };
}

before(async () => {
  if (!emulatorAvailable) return;
  environment = await initializeTestEnvironment({
    projectId: 'demo-ammotors',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8') },
    storage: { rules: fs.readFileSync(path.join(__dirname, '..', 'storage.rules'), 'utf8') },
  });
});

after(async () => {
  if (environment) await environment.cleanup();
});

const emulatorTest = (name, fn) => test(name, { skip: !emulatorAvailable }, fn);

emulatorTest('Firestore permits public car reads', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'cars/car-1'), carData());
  });
  const publicDb = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(publicDb, 'cars/car-1')));
});

emulatorTest('Firestore rejects unauthenticated and non-admin writes', async () => {
  const publicDb = environment.unauthenticatedContext().firestore();
  const userDb = environment.authenticatedContext('user-1').firestore();
  await assertFails(setDoc(doc(publicDb, 'cars/public-write'), carData()));
  await assertFails(setDoc(doc(userDb, 'cars/user-write'), carData()));
});

emulatorTest('Firestore permits valid admin writes and rejects invalid data', async () => {
  const adminDb = environment.authenticatedContext('admin-1', { admin: true }).firestore();
  await assertSucceeds(setDoc(doc(adminDb, 'cars/admin-write'), carData()));
  await assertFails(setDoc(doc(adminDb, 'cars/invalid-write'), carData({ status: 'hidden' })));
});

emulatorTest('Firestore permits admin update/delete and protects creator metadata', async () => {
  const adminDb = environment.authenticatedContext('admin-1', { admin: true }).firestore();
  const reference = doc(adminDb, 'cars/admin-crud');
  await assertSucceeds(setDoc(reference, carData()));
  await assertSucceeds(updateDoc(reference, {
    status: 'sold', updatedAt: serverTimestamp(), updatedBy: 'admin-1',
  }));
  await assertFails(updateDoc(reference, {
    createdBy: 'another-user', updatedAt: serverTimestamp(), updatedBy: 'admin-1',
  }));
  await assertSucceeds(deleteDoc(reference));
});

emulatorTest('Storage permits only admin image writes under the car prefix', async () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
  const metadata = { contentType: 'image/jpeg' };
  const publicStorage = environment.unauthenticatedContext().storage();
  const userStorage = environment.authenticatedContext('user-1').storage();
  const adminStorage = environment.authenticatedContext('admin-1', { admin: true }).storage();

  await assertFails(uploadBytes(ref(publicStorage, 'cars/car-1/public.jpg'), bytes, metadata));
  await assertFails(uploadBytes(ref(userStorage, 'cars/car-1/user.jpg'), bytes, metadata));
  await assertSucceeds(uploadBytes(ref(adminStorage, 'cars/car-1/admin.jpg'), bytes, metadata));
  await assertSucceeds(getBytes(ref(publicStorage, 'cars/car-1/admin.jpg')));
  await assertFails(uploadBytes(
    ref(adminStorage, 'cars/car-1/not-image.txt'), bytes, { contentType: 'text/plain' },
  ));
  await assertFails(deleteObject(ref(userStorage, 'cars/car-1/admin.jpg')));
  await assertSucceeds(deleteObject(ref(adminStorage, 'cars/car-1/admin.jpg')));
});

emulatorTest('Firestore repository performs CRUD and preserves the public contract', async () => {
  const firestore = new Firestore({ projectId: 'demo-ammotors' });
  const repository = createFirestoreCarsRepository({
    firestore,
    FieldValue,
  });
  const input = {
    make: 'Audi', model: 'RS 5', year: 2024, price: 90000,
    description: 'Repository test.', status: 'available', images: [],
    specifications: {
      mileage: 100, engine: '2.9L Twin-Turbo', horsepower: 444,
      transmission: 'Automatic', drivetrain: 'AWD', fuel: 'Petrol',
      exteriorColor: 'Blue', interiorColor: 'Black',
    },
  };

  try {
    const created = await repository.create(input, 'admin-1');
    assert.equal(created.make, 'Audi');
    assert.equal(created.engine, '2.9L Twin-Turbo');
    assert.ok((await repository.getAll()).some((car) => car.id === created.id));

    const updated = await repository.update(
      created.id,
      { status: 'sold', specifications: { mileage: 200 } },
      'admin-1',
    );
    assert.equal(updated.status, 'sold');
    assert.equal(updated.mileage, 200);
    assert.equal(updated.engine, '2.9L Twin-Turbo');

    await repository.remove(created.id);
    assert.equal(await repository.getById(created.id), null);
  } finally {
    await firestore.terminate();
  }
});
