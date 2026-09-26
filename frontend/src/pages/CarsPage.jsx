import { useEffect, useMemo, useState } from 'react';
import CarFilters from '../components/CarFilters.jsx';
import CarGrid, { CarGridSkeleton } from '../components/CarGrid.jsx';
import Icon from '../components/Icon.jsx';
import { getCars } from '../services/carsApi.js';

const initialFilters = { search: '', make: '', model: '', price: '' };
const CARS_PER_PAGE = 6;

function CarsPage() {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

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
  const totalPages = Math.ceil(filteredCars.length / CARS_PER_PAGE);
  const visibleCars = filteredCars.slice((page - 1) * CARS_PER_PAGE, page * CARS_PER_PAGE);
  const showPagination = !loading && !error && totalPages > 0;

  const updateFilters = (nextFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const goToPage = (nextPage) => {
    setPage(nextPage);
    document.getElementById('inventory-results')?.scrollIntoView?.({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth',
    });
  };

  return (
    <main className="page-content inventory-page">
      <section className="page-heading page-width">
        <p className="eyebrow">Current inventory</p>
        <h1>Available Cars</h1>
        <p>Browse our current selection of available vehicles.</p>
      </section>
      <section className="page-width inventory-content">
        <CarFilters filters={filters} setFilters={updateFilters} cars={cars} />
        {!loading && !error && (
          <div className="inventory-results-summary" id="inventory-results">
            <p className="result-count">{filteredCars.length} {filteredCars.length === 1 ? 'vehicle' : 'vehicles'} available</p>
            {showPagination && <span className="latest-page-count">Page {page} of {totalPages}</span>}
          </div>
        )}
        {loading && <CarGridSkeleton count={CARS_PER_PAGE} />}
        {error && <div className="error-state"><h2>Unable to load vehicles.</h2><p>Please try again.</p><button className="button button-outline" type="button" onClick={() => window.location.reload()}>Try again</button></div>}
        {!loading && !error && <CarGrid cars={visibleCars} />}
        {showPagination && (
          <nav className="inventory-pagination" aria-label="Available cars pages">
            <button type="button" className="pagination-arrow pagination-previous" aria-label="Previous page" disabled={page === 1} onClick={() => goToPage(page - 1)}><Icon name="arrow" size={19} /></button>
            <span aria-live="polite">Page {page} of {totalPages}</span>
            <button type="button" className="pagination-arrow" aria-label="Next page" disabled={page === totalPages} onClick={() => goToPage(page + 1)}><Icon name="arrow" size={19} /></button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default CarsPage;
