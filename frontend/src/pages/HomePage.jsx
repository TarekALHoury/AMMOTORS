import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import CarGrid, { CarGridSkeleton } from '../components/CarGrid.jsx';
import About from '../components/About.jsx';
import Contact from '../components/Contact.jsx';
import Icon from '../components/Icon.jsx';
import { getCars } from '../services/carsApi.js';

function HomePage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCars().then(setCars).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <Hero />

      <section className="section latest-section" id="latest-cars">
        <div className="page-width">
          <div className="section-heading-row">
            <div><p className="eyebrow">Our inventory</p><h2>Latest Cars</h2><p>Explore our latest available vehicles.</p></div>
            <Link className="text-link" to="/cars">View All Cars <Icon name="arrow" size={18} /></Link>
          </div>
          {loading && <CarGridSkeleton count={4} />}
          {error && <div className="error-state"><h3>Unable to load vehicles.</h3><p>Please try again.</p></div>}
          {!loading && !error && <CarGrid cars={cars.slice(0, 4)} />}
        </div>
      </section>

      <About />
      <Contact />
    </main>
  );
}

export default HomePage;
