class CarNotFoundError extends Error {
  constructor() {
    super('Car not found.');
    this.name = 'CarNotFoundError';
  }
}

function toPublicCar(snapshot) {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    mileage: data.specifications.mileage,
    engine: data.specifications.engine,
    horsepower: data.specifications.horsepower,
    transmission: data.specifications.transmission,
    drivetrain: data.specifications.drivetrain,
    fuel: data.specifications.fuel,
    exteriorColor: data.specifications.exteriorColor,
    interiorColor: data.specifications.interiorColor,
    description: data.description,
    status: data.status,
    images: data.images,
  };
}

function createFirestoreCarsRepository({ firestore, FieldValue }) {
  const collection = firestore.collection('cars');

  async function getAll() {
    const snapshot = await collection.get();
    return snapshot.docs
      .map(toPublicCar)
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  async function getById(id) {
    return toPublicCar(await collection.doc(id).get());
  }

  async function create(car, actorUid) {
    const reference = collection.doc();
    await reference.set({
      ...car,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actorUid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUid,
    });
    return getById(reference.id);
  }

  async function update(id, changes, actorUid) {
    const reference = collection.doc(id);
    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new CarNotFoundError();
      const current = snapshot.data();
      transaction.update(reference, {
        ...changes,
        ...(changes.specifications && {
          specifications: { ...current.specifications, ...changes.specifications },
        }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      });
    });
    return getById(id);
  }

  async function remove(id) {
    const reference = collection.doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) throw new CarNotFoundError();
    await reference.delete();
  }

  return { create, getAll, getById, remove, update };
}

module.exports = { CarNotFoundError, createFirestoreCarsRepository, toPublicCar };
