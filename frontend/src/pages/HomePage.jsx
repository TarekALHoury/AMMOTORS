import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import CarGrid, { CarGridSkeleton } from '../components/CarGrid.jsx';
import About from '../components/About.jsx';
import Contact from '../components/Contact.jsx';
import Icon from '../components/Icon.jsx';
import { getCars } from '../services/carsApi.js';

const CARS_PER_PAGE = 6;

function HomePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCars().then(setCars).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(cars.length / CARS_PER_PAGE);
  const visibleCars = cars.slice((page - 1) * CARS_PER_PAGE, page * CARS_PER_PAGE);
  const showPagination = !loading && !error && totalPages > 0;

  const goToPage = (nextPage) => {
    setPage(nextPage);
    document.getElementById('latest-cars')?.scrollIntoView?.({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth',
    });
  };

  return (
    <main>
      <Hero />

      <section className="section latest-section" id="latest-cars">
        <div className="page-width">
          <div className="section-heading-row">
            <div><p className="eyebrow">Our inventory</p><h2>Latest Cars</h2><p>Explore our latest available vehicles.</p></div>
            <div className="latest-heading-actions">
              <Link className="text-link" to="/cars">View All Cars <Icon name="arrow" size={18} /></Link>
              {showPagination && <span className="latest-page-count">Page {page} of {totalPages}</span>}
            </div>
          </div>
          {loading && <CarGridSkeleton count={CARS_PER_PAGE} />}
          {error && <div className="error-state"><h3>Unable to load vehicles.</h3><p>Please try again.</p></div>}
          {!loading && !error && <CarGrid cars={visibleCars} />}
          {showPagination && (
            <nav className="inventory-pagination" aria-label="Latest cars pages">
              <button type="button" className="pagination-arrow pagination-previous" aria-label="Previous page" disabled={page === 1} onClick={() => goToPage(page - 1)}><Icon name="arrow" size={19} /></button>
              <span aria-live="polite">Page {page} of {totalPages}</span>
              <button type="button" className="pagination-arrow" aria-label="Next page" disabled={page === totalPages} onClick={() => goToPage(page + 1)}><Icon name="arrow" size={19} /></button>
            </nav>
          )}
        </div>
      </section>

      <About />
      <Contact />
    </main>
  );
}

export default HomePage;
