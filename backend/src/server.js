const { createApp } = require('./app');
const { createFirebaseServices } = require('./firebaseAdmin');

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.CORS_ORIGINS) {
  throw new Error('CORS_ORIGINS is required in production.');
}
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : '*';
const firebaseServices = createFirebaseServices({
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
const app = createApp({ allowedOrigins, trustProxy: isProduction ? 1 : false, ...(firebaseServices || {}) });

const server = app.listen(PORT, () => {
  console.log(JSON.stringify({ event: 'server_started', port: Number(PORT) }));
});

server.setTimeout(30_000);
server.keepAliveTimeout = 65_000;

function handleFatalError(event, error) {
  console.error(JSON.stringify({ event, errorName: error?.name, errorMessage: error?.message, stack: error?.stack }));
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on('unhandledRejection', (error) => handleFatalError('unhandled_rejection', error));
process.on('uncaughtException', (error) => handleFatalError('uncaught_exception', error));

