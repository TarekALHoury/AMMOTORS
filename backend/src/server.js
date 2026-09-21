const { createApp } = require('./app');
const { createFirebaseServices } = require('./firebaseAdmin');

const PORT = process.env.PORT || 5000;
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : '*';
const firebaseServices = createFirebaseServices({
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const app = createApp({ allowedOrigins, ...(firebaseServices || {}) });

app.listen(PORT, () => {
  console.log(`AMMOTORS API running at http://localhost:${PORT}`);
});

