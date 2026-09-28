import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CarGallery from '../components/CarGallery.jsx';
import CarSpecs from '../components/CarSpecs.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import { getCarById } from '../services/carsApi.js';
import { formatMileage, formatPrice } from '../utils/formatters.js';
import { usePageMetadata } from '../utils/usePageMetadata.js';

function CarDetailsPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setCar(null);
    setErrorStatus(null);
    getCarById(id)
      .then((nextCar) => { if (!ignore) setCar(nextCar); })
      .catch((error) => { if (!ignore) setErrorStatus(error.status || 500); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [id]);

  usePageMetadata({
    title: car ? `${car.year} ${car.make} ${car.model} | AM MOTORS` : 'Vehicle Details | AM MOTORS',
    description: car
      ? `View photos, price, mileage, and specifications for this ${car.year} ${car.make} ${car.model} from AM MOTORS in Lebanon.`
      : 'View vehicle photos, specifications, mileage, and pricing from AM MOTORS in Lebanon.',
    path: `/cars/${id}`,
    robots: errorStatus === 404 ? 'noindex, follow' : 'index, follow',
  });

  if (loading) {
    return <main className="state-page page-content" role="status" aria-label="Loading vehicle"><div className="loading-ring" aria-hidden="true" /><p>Loading vehicle...</p></main>;
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
          <aside className="vehicle-summary" aria-label="Vehicle summary">
            <span className="status-pill inline-status">{car.status}</span>
            <h1>{carName}</h1>
            <p className="vehicle-meta">{car.year} <span aria-hidden="true">|</span> {formatMileage(car.mileage)}</p>
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
