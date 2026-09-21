import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CarGallery from '../components/CarGallery.jsx';
import CarSpecs from '../components/CarSpecs.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import { getCarById } from '../services/carsApi.js';
import { formatMileage, formatPrice } from '../utils/formatters.js';

function CarDetailsPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorStatus(null);
    getCarById(id).then(setCar).catch((error) => setErrorStatus(error.status || 500)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <main className="state-page page-content"><div className="loading-ring" /><p>Loading vehicle...</p></main>;
  }

  if (errorStatus) {
    const notFound = errorStatus === 404;
    return <main className="state-page page-content"><p className="eyebrow">{notFound ? '404' : 'Something went wrong'}</p><h1>{notFound ? 'Vehicle Not Found' : 'Unable to load vehicle'}</h1><p>{notFound ? 'This vehicle may no longer be available.' : 'Please try again.'}</p><Link className="button button-primary" to="/cars">View Available Cars</Link></main>;
  }

  const carName = `${car.make} ${car.model}`;

  return (
    <main className="page-content details-page">
      <div className="page-width">
        <Link className="back-link" to="/cars">← Back to available cars</Link>
        <div className="details-layout">
          <CarGallery images={car.images} name={carName} />
          <aside className="vehicle-summary">
            <span className="status-pill inline-status">{car.status}</span>
            <p className="vehicle-year">{car.year}</p>
            <h1>{carName}</h1>
            <p className="vehicle-meta">{car.year} <span>•</span> {formatMileage(car.mileage)}</p>
            <p className="detail-price">{formatPrice(car.price)}</p>
            <WhatsAppButton car={car} className="full-width" />
            <p className="response-note">Contact us directly for availability and more details.</p>
          </aside>
        </div>

        <section className="details-section"><p className="eyebrow">Vehicle overview</p><h2>Specifications</h2><CarSpecs car={car} /></section>
        {car.description && <section className="details-section description-section"><p className="eyebrow">About this vehicle</p><h2>Description</h2><p>{car.description}</p></section>}
      </div>
    </main>
  );
}

export default CarDetailsPage;
