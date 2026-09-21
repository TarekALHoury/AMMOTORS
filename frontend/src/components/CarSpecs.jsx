import Icon from './Icon.jsx';

function CarSpecs({ car }) {
  const specs = [
    ['engine', 'Engine', car.engine],
    ['gauge', 'Horsepower', car.horsepower ? `${car.horsepower} hp` : null],
    ['car', 'Transmission', car.transmission],
    ['car', 'Drivetrain', car.drivetrain],
    ['fuel', 'Fuel type', car.fuel],
    ['palette', 'Exterior color', car.exteriorColor],
    ['palette', 'Interior color', car.interiorColor],
    ['check', 'Condition', car.condition],
  ].filter(([, , value]) => value !== undefined && value !== null && value !== '');

  return <div className="spec-grid">{specs.map(([icon, label, value]) => <div className="spec" key={label}><Icon name={icon} size={21} /><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>;
}

export default CarSpecs;

