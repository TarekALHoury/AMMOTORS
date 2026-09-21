import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function CarDetailsPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCar() {
      try {
        const response = await fetch(`/api/cars/${encodeURIComponent(id)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not load car.');
        }

        setCar(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCar();
  }, [id]);

  if (loading) {
    return <p className="message">Loading car...</p>;
  }

  if (error) {
    return (
      <main className="container">
        <p className="error">{error}</p>
        <Link to="/">Back to all cars</Link>
      </main>
    );
  }

  return (
    <main className="container details">
      <Link to="/">← Back to all cars</Link>
      <img src={car.images[0]} alt={`${car.make} ${car.model}`} />
      <h1>{car.year} {car.make} {car.model}</h1>
      <p>{car.description}</p>

      <dl>
        <dt>Price</dt><dd>${car.price.toLocaleString()}</dd>
        <dt>Mileage</dt><dd>{car.mileage.toLocaleString()} miles</dd>
        <dt>Engine</dt><dd>{car.engine}</dd>
        <dt>Horsepower</dt><dd>{car.horsepower} hp</dd>
        <dt>Transmission</dt><dd>{car.transmission}</dd>
        <dt>Drivetrain</dt><dd>{car.drivetrain}</dd>
        <dt>Fuel</dt><dd>{car.fuel}</dd>
        <dt>Exterior color</dt><dd>{car.exteriorColor}</dd>
        <dt>Interior color</dt><dd>{car.interiorColor}</dd>
        <dt>Status</dt><dd>{car.status}</dd>
      </dl>
    </main>
  );
}

export default CarDetailsPage;

