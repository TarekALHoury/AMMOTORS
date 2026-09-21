const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');

const defaultCarsFile = path.join(__dirname, '..', 'data', 'cars.json');

function createApp({ carsFile = defaultCarsFile, logger = console } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  async function getCars() {
    const data = await fs.readFile(carsFile, 'utf8');
    const cars = JSON.parse(data);

    if (!Array.isArray(cars)) {
      throw new TypeError('Cars data must be an array.');
    }

    return cars;
  }

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/cars', async (_request, response, next) => {
    try {
      const cars = await getCars();
      response.json(cars);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/cars/:id', async (request, response, next) => {
    try {
      const cars = await getCars();
      const car = cars.find((item) => item.id === request.params.id);

      if (!car) {
        return response.status(404).json({ message: 'Car not found.' });
      }

      return response.json(car);
    } catch (error) {
      return next(error);
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ message: 'API route not found.' });
  });

  app.use((error, request, response, _next) => {
    logger.error(`Request failed: ${request.method} ${request.originalUrl}`, error);
    response.status(500).json({ message: 'Could not load vehicle data.' });
  });

  return app;
}

module.exports = { createApp };
