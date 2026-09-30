const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { createFirestoreCarsRepository } = require('./firestoreCarsRepository');

function createFirebaseServices({ projectId }) {
  if (!projectId) return null;

  const firebaseApp = getApps()[0] || initializeApp({ credential: applicationDefault(), projectId });
  const firestore = getFirestore(firebaseApp);

  return {
    adminAuth: getAuth(firebaseApp),
    carsRepository: createFirestoreCarsRepository({ firestore, FieldValue }),
    readinessCheck: async () => firestore.collection('cars').limit(1).get(),
  };
}

module.exports = { createFirebaseServices };
