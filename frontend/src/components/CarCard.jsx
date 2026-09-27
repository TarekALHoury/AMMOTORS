import { Link } from 'react-router-dom';
import { formatMileage, formatPrice } from '../utils/formatters.js';
import VehicleImage from './VehicleImage.jsx';

function CarCard({ car }) {
  return (
    <Link className="car-card" data-tilt="8" to={`/cars/${car.id}`} aria-label={`View ${car.year} ${car.make} ${car.model}`}>
      <div className="car-card-image">
        <VehicleImage src={car.images?.[0]} alt={`${car.make} ${car.model}`} />
        {car.status && <span className="status-pill">{car.status}</span>}
      </div>
      <div className="car-card-body">
        <p className="car-make">{car.make}</p>
        <h3>{car.model}</h3>
        <p className="car-meta">{car.year} <span aria-hidden="true">|</span> {formatMileage(car.mileage)}</p>
        <p className="car-price">{formatPrice(car.price)}</p>
      </div>
    </Link>
  );
}

export default CarCard;
