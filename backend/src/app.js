const express = require('express');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const path = require('path');
const { createCarsRepository } = require('./carsRepository');
const { createRequireAdmin } = require('./adminAuth');
const { CarValidationError, normalizeCarInput } = require('./carInput');
const { CarNotFoundError } = require('./firestoreCarsRepository');
const { InventoryQueryError, parseInventoryQuery, queryInventory } = require('./inventoryQuery');

const defaultCarsFile = path.join(__dirname, '..', 'data', 'cars.json');

function validateCarId(request, response, next) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(request.params.id || '')) {
    response.set('Cache-Control', 'no-store');
    return response.status(400).json({ message: 'Invalid car ID.' });
  }
  return next();
}

function createApp({
  carsFile = defaultCarsFile,
  carsRepository = createCarsRepository({ carsFile }),
  adminAuth = null,
  imageStorage = null,
  allowedOrigins = '*',
  logger = console,
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({
    exposedHeaders: ['X-Request-Id'],
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
  app.use((request, response, next) => {
    request.requestId = randomUUID();
    response.set('X-Request-Id', request.requestId);
    if (request.path.startsWith('/api/admin')) response.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  const requireAdmin = createRequireAdmin(adminAuth);

  app.get('/api/health', (_request, response) => {
    response.set('Cache-Control', 'no-store');
    response.json({ status: 'ok' });
  });

  app.get('/api/cars', async (_request, response, next) => {
    try {
      const cars = await carsRepository.getAll();
      response.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      response.json(cars);
    } catch (error) {
      error.publicMessage = 'Could not load cars.';
      next(error);
    }
  });

  app.get('/api/v1/cars', async (request, response, next) => {
    try {
      const query = parseInventoryQuery(request.query);
      const cars = await carsRepository.getAll();
      response.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
      return response.json(queryInventory(cars, query));
    } catch (error) {
      error.publicMessage = 'Could not load cars.';
      return next(error);
    }
  });

  app.get('/api/cars/:id', validateCarId, async (request, response, next) => {
    try {
      const car = await carsRepository.getById(request.params.id);

      if (!car) {
        response.set('Cache-Control', 'no-store');
        return response.status(404).json({ message: 'Car not found.' });
      }

      response.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return response.json(car);
    } catch (error) {
      error.publicMessage = 'Could not load car.';
      return next(error);
    }
  });

  app.post('/api/admin/cars', requireAdmin, async (request, response, next) => {
    try {
      const car = normalizeCarInput(request.body);
      const created = await carsRepository.create(car, request.adminUser.uid);
      return response.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  });

  app.put('/api/admin/cars/:id', validateCarId, requireAdmin, async (request, response, next) => {
    try {
      const car = normalizeCarInput(request.body);
      const updated = await carsRepository.update(request.params.id, car, request.adminUser.uid);
      return response.json(updated);
    } catch (error) {
      return next(error);
    }
  });

  app.patch('/api/admin/cars/:id', validateCarId, requireAdmin, async (request, response, next) => {
    try {
      const changes = normalizeCarInput(request.body, { partial: true });
      const updated = await carsRepository.update(
        request.params.id,
        changes,
        request.adminUser.uid,
      );
      return response.json(updated);
    } catch (error) {
      return next(error);
    }
  });

  app.delete('/api/admin/cars/:id', validateCarId, requireAdmin, async (request, response, next) => {
    try {
      const car = await carsRepository.getById(request.params.id);
      if (!car) throw new CarNotFoundError();
      if (imageStorage) await imageStorage.deleteCarImages(request.params.id);
      await carsRepository.remove(request.params.id);
      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  app.use('/api', (_request, response) => {
    response.set('Cache-Control', 'no-store');
    response.status(404).json({ message: 'API route not found.' });
  });

  app.use((error, request, response, _next) => {
    response.set('Cache-Control', 'no-store');
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ message: 'Request body is too large.' });
    }
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ message: 'Invalid JSON body.' });
    }
    if (error instanceof CarValidationError) {
      return response.status(400).json({ message: error.message, errors: error.errors });
    }
    if (error instanceof InventoryQueryError) {
      return response.status(400).json({ message: error.message, errors: error.errors });
    }
    if (error instanceof CarNotFoundError) {
      return response.status(404).json({ message: 'Car not found.' });
    }
    logger.error(`Request failed: ${request.method} ${request.originalUrl}`, error);
    return response.status(500).json({
      message: error.publicMessage || 'Internal server error.',
    });
  });

  return app;
}

module.exports = { createApp };
