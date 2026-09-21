import { useEffect, useMemo, useState } from 'react';
import CarFilters from '../components/CarFilters.jsx';
import CarGrid, { CarGridSkeleton } from '../components/CarGrid.jsx';
import { getCars } from '../services/carsApi.js';

const initialFilters = { search: '', make: '', model: '', price: '' };

function CarsPage() {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCars().then(setCars).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const filteredCars = useMemo(() => cars.filter((car) => {
    const searchText = `${car.make} ${car.model} ${car.year}`.toLowerCase();
    const [minimum = 0, maximum = Infinity] = filters.price ? filters.price.split('-').map(Number) : [];
    return (!filters.search || searchText.includes(filters.search.toLowerCase().trim()))
      && (!filters.make || car.make === filters.make)
      && (!filters.model || car.model === filters.model)
      && (!filters.price || (car.price >= minimum && car.price < maximum));
  }), [cars, filters]);

  return (
    <main className="page-content inventory-page">
      <section className="page-heading page-width">
        <p className="eyebrow">Current inventory</p>
        <h1>Available Cars</h1>
        <p>Browse our current selection of available vehicles.</p>
      </section>
      <section className="page-width inventory-content">
        <CarFilters filters={filters} setFilters={setFilters} cars={cars} />
        {!loading && !error && <p className="result-count">{filteredCars.length} {filteredCars.length === 1 ? 'vehicle' : 'vehicles'} available</p>}
        {loading && <CarGridSkeleton count={4} />}
        {error && <div className="error-state"><h2>Unable to load vehicles.</h2><p>Please try again.</p><button className="button button-outline" type="button" onClick={() => window.location.reload()}>Try again</button></div>}
        {!loading && !error && <CarGrid cars={filteredCars} />}
      </section>
    </main>
  );
}

export default CarsPage;

