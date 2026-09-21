const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 5000;
const carsFile = path.join(__dirname, '..', 'data', 'cars.json');

app.use(cors());
app.use(express.json());

async function getCars() {
  const data = await fs.readFile(carsFile, 'utf8');
  return JSON.parse(data);
}

app.get('/api/cars', async (_request, response) => {
  try {
    const cars = await getCars();
    response.json(cars);
  } catch (error) {
    console.error('Could not read cars data:', error);
    response.status(500).json({ message: 'Could not load cars.' });
  }
});

app.get('/api/cars/:id', async (request, response) => {
  try {
    const cars = await getCars();
    const car = cars.find((item) => item.id === request.params.id);

    if (!car) {
      return response.status(404).json({ message: 'Car not found.' });
    }

    return response.json(car);
  } catch (error) {
    console.error('Could not read cars data:', error);
    return response.status(500).json({ message: 'Could not load car.' });
  }
});

app.listen(PORT, () => {
  console.log(`AMMOTORS API running at http://localhost:${PORT}`);
});

