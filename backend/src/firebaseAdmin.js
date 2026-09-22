const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { createFirestoreCarsRepository } = require('./firestoreCarsRepository');

function createFirebaseServices({ projectId, storageBucket }) {
  if (!projectId) return null;

  const options = { credential: applicationDefault(), projectId };
  if (storageBucket) options.storageBucket = storageBucket;
  const firebaseApp = getApps()[0] || initializeApp(options);
  const firestore = getFirestore(firebaseApp);

  return {
    adminAuth: getAuth(firebaseApp),
    carsRepository: createFirestoreCarsRepository({ firestore, FieldValue }),
    ...(storageBucket && {
      imageStorage: {
        async deleteCarImages(carId) {
          await getStorage(firebaseApp).bucket().deleteFiles({ prefix: `cars/${carId}/` });
        },
      },
    }),
  };
}

module.exports = { createFirebaseServices };
