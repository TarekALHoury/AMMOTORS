import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCars() {
      try {
        const response = await fetch('/api/cars');

        if (!response.ok) {
          throw new Error('Could not load cars.');
        }

        setCars(await response.json());
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>AMMOTORS</h1>
        <p>Find your next car.</p>
      </header>

      {loading && <p>Loading cars...</p>}
      {error && <p className="error">{error} Make sure the backend is running.</p>}

      <section className="car-grid" aria-label="Available cars">
        {cars.map((car) => (
          <article className="car-card" key={car.id}>
            <img src={car.images[0]} alt={`${car.make} ${car.model}`} />
            <div className="car-card-content">
              <h2>{car.make} {car.model}</h2>
              <p>Year: {car.year}</p>
              <p>Price: ${car.price.toLocaleString()}</p>
              <p>Mileage: {car.mileage.toLocaleString()} miles</p>
              <Link className="button" to={`/cars/${car.id}`}>View Car</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default HomePage;

