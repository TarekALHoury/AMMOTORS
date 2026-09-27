import Icon from './Icon.jsx';
import calendarIcon from '../assets/icons/calendar.svg';
import exteriorIcon from '../assets/icons/car-exterior.svg';
import interiorIcon from '../assets/icons/car-interior.svg';
import drivetrainIcon from '../assets/icons/drivetrain.png';
import engineIcon from '../assets/icons/engine.svg';
import fuelIcon from '../assets/icons/fuel.svg';
import gearshiftIcon from '../assets/icons/gearshifter.png';
import roadIcon from '../assets/icons/road.svg';
import speedIcon from '../assets/icons/speed.svg';
import tagIcon from '../assets/icons/tag.svg';

const iconAssets = {
  calendar: calendarIcon,
  exterior: exteriorIcon,
  interior: interiorIcon,
  drivetrain: drivetrainIcon,
  engine: engineIcon,
  fuel: fuelIcon,
  gearshift: gearshiftIcon,
  road: roadIcon,
  speed: speedIcon,
  tag: tagIcon,
};

function CarSpecs({ car }) {
  const specs = [
    ['tag', 'Model', car.model],
    ['calendar', 'Year', car.year],
    ['road', 'Mileage', car.mileage ? `${car.mileage.toLocaleString()} km` : null],
    ['engine', 'Engine', car.engine],
    ['speed', 'Horsepower', car.horsepower ? `${car.horsepower} hp` : null],
    ['gearshift', 'Transmission', car.transmission],
    ['drivetrain', 'Drivetrain', car.drivetrain],
    ['fuel', 'Fuel type', car.fuel],
    ['exterior', 'Exterior color', car.exteriorColor],
    ['interior', 'Interior color', car.interiorColor],
  ].filter(([, , value]) => value !== undefined && value !== null && value !== '');

  return <div className="spec-grid">{specs.map(([icon, label, value]) => <div className="spec" key={label}><img className="spec-icon" src={iconAssets[icon]} alt="" aria-hidden="true" data-icon={icon} /><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>;
}

export default CarSpecs;
