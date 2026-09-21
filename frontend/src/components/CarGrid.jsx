import CarCard from './CarCard.jsx';

function CarGrid({ cars }) {
  if (!cars.length) {
    return <div className="empty-state"><h2>No vehicles found</h2><p>Try changing your search or filters.</p></div>;
  }

  return <div className="car-grid">{cars.map((car) => <CarCard car={car} key={car.id} />)}</div>;
}

export function CarGridSkeleton({ count = 4 }) {
  return (
    <div className="car-grid" aria-label="Loading vehicles">
      {Array.from({ length: count }, (_, index) => (
        <div className="car-card skeleton-card" key={index}>
          <div className="skeleton skeleton-image" />
          <div className="car-card-body"><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line medium" /></div>
        </div>
      ))}
    </div>
  );
}

export default CarGrid;

