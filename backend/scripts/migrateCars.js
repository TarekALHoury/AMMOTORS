const fs = require('fs/promises');
const path = require('path');
const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { normalizeCarInput } = require('../src/carInput');

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required.');
  }

  const options = { credential: applicationDefault(), projectId };
  if (storageBucket) options.storageBucket = storageBucket;
  const app = initializeApp(options);
  const firestore = getFirestore(app);
  const source = JSON.parse(await fs.readFile(
    path.join(__dirname, '..', 'data', 'cars.json'), 'utf8',
  ));
  const batch = firestore.batch();

  for (const car of source) {
    const normalized = normalizeCarInput({
      make: car.make, model: car.model, year: car.year, price: car.price,
      description: car.description || '', status: car.status, images: car.images,
      specifications: {
        mileage: car.mileage, engine: car.engine, horsepower: car.horsepower,
        transmission: car.transmission, drivetrain: car.drivetrain, fuel: car.fuel,
        exteriorColor: car.exteriorColor, interiorColor: car.interiorColor,
      },
    });
    const reference = firestore.collection('cars').doc(car.id);
    const existing = await reference.get();
    if (existing.exists && !process.argv.includes('--force')) {
      throw new Error(`Car ${car.id} exists. Re-run with --force to overwrite.`);
    }
    batch.set(reference, {
      ...normalized,
      createdAt: FieldValue.serverTimestamp(), createdBy: 'migration',
      updatedAt: FieldValue.serverTimestamp(), updatedBy: 'migration',
    });
  }

  await batch.commit();
  console.log(`Migrated ${source.length} cars to Firebase project ${projectId}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
