const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { createFirestoreCarsRepository } = require('./firestoreCarsRepository');

function createFirebaseServices({ projectId, storageBucket }) {
  if (!projectId || !storageBucket) return null;

  const options = { credential: applicationDefault(), projectId, storageBucket };
  const firebaseApp = getApps()[0] || initializeApp(options);
  const firestore = getFirestore(firebaseApp);
  const bucket = getStorage(firebaseApp).bucket();

  return {
    adminAuth: getAuth(firebaseApp),
    carsRepository: createFirestoreCarsRepository({ firestore, FieldValue }),
    imageStorage: {
      async deleteCarImages(carId) {
        await bucket.deleteFiles({ prefix: `cars/${carId}/` });
      },
    },
  };
}

module.exports = { createFirebaseServices };
