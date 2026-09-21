const express = require('express');
const cors = require('cors');
const path = require('path');
const { createCarsRepository } = require('./carsRepository');

const defaultCarsFile = path.join(__dirname, '..', 'data', 'cars.json');

function createApp({
  carsFile = defaultCarsFile,
  carsRepository = createCarsRepository({ carsFile }),
  allowedOrigins = '*',
  logger = console,
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({
    origin(origin, callback) {
      const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
      const isAllowed = !origin || origins.includes('*') || origins.includes(origin);
      callback(null, isAllowed);
    },
  }));
  app.use((_request, response, next) => {
    response.set({
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });
    next();
  });
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/cars', async (_request, response, next) => {
    try {
      const cars = await carsRepository.getAll();
      response.json(cars);
    } catch (error) {
      error.publicMessage = 'Could not load cars.';
      next(error);
    }
  });

  app.get('/api/cars/:id', async (request, response, next) => {
    try {
      const car = await carsRepository.getById(request.params.id);

      if (!car) {
        return response.status(404).json({ message: 'Car not found.' });
      }

      return response.json(car);
    } catch (error) {
      error.publicMessage = 'Could not load car.';
      return next(error);
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ message: 'API route not found.' });
  });

  app.use((error, request, response, _next) => {
    logger.error(`Request failed: ${request.method} ${request.originalUrl}`, error);
    response.status(500).json({
      message: error.publicMessage || 'Internal server error.',
    });
  });

  return app;
}

module.exports = { createApp };
