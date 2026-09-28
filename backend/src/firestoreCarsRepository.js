class CarNotFoundError extends Error {
  constructor() {
    super('Car not found.');
    this.name = 'CarNotFoundError';
  }
}

function toPublicCar(snapshot) {
  if (!snapshot.exists) return null;
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
    await collection.doc(id).delete();
  }

  return { create, getAll, getById, remove, update };
}

module.exports = { CarNotFoundError, createFirestoreCarsRepository, toPublicCar };
