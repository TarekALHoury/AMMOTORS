export class CarsApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CarsApiError';
    this.status = status;
  }
}

async function requestCars(endpoint) {
  let response;

  try {
    response = await fetch(endpoint);
  } catch {
    throw new CarsApiError('Unable to connect to the vehicle service.', 0);
  }

  if (!response.ok) {
    let message = 'Unable to load vehicles.';

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the customer-friendly fallback message.
    }

    throw new CarsApiError(message, response.status);
  }

  return response.json();
}

export function getCars() {
  return requestCars('/api/cars');
}

export function getCarById(id) {
  return requestCars(`/api/cars/${encodeURIComponent(id)}`);
}

