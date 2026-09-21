import { dealership } from '../config/dealership.js';
import { formatPrice } from '../utils/formatters.js';
import Icon from './Icon.jsx';

function WhatsAppButton({ car, children = 'Inquire on WhatsApp', className = '' }) {
  const message = car
    ? `Hello ${dealership.name},\n\nI'm interested in the ${car.year} ${car.make} ${car.model} listed on your website for ${formatPrice(car.price)}.\n\nCould you please provide me with more information?\n\nThank you.`
    : `Hello ${dealership.name},\n\nI'd like to learn more about your available vehicles.`;
  const href = `https://wa.me/${dealership.whatsapp}?text=${encodeURIComponent(message)}`;

  return <a className={`button whatsapp-button ${className}`} href={href} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={21} />{children}</a>;
}

export default WhatsAppButton;
