const { createApp } = require('./app');

const PORT = process.env.PORT || 5000;
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : '*';
const app = createApp({ allowedOrigins });

app.listen(PORT, () => {
  console.log(`AMMOTORS API running at http://localhost:${PORT}`);
});

