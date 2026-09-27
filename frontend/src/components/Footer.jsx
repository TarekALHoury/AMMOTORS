import { Link } from 'react-router-dom';
import { dealership } from '../config/dealership.js';
import BrandLogo from './BrandLogo.jsx';
import Icon from './Icon.jsx';

function Footer({ theme = 'dark' }) {
  return (
    <footer className="footer">
      <div className="page-width footer-main">
        <div><Link className="brand footer-brand" to="/"><BrandLogo theme={theme} /></Link><p>Quality vehicles. Direct service.</p></div>
        <nav aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/cars">Available Cars</Link><Link to="/#about">About</Link><Link to="/#contact">Contact</Link></nav>
        <div className="footer-social"><a href={dealership.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" />Instagram</a><a href={dealership.tiktok} target="_blank" rel="noreferrer"><Icon name="tiktok" className="tiktok-icon" />TikTok</a><a href={`https://wa.me/${dealership.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" />WhatsApp</a><a href={dealership.location} target="_blank" rel="noreferrer"><Icon name="location" />Location</a></div>
      </div>
      <div className="page-width footer-bottom">© {new Date().getFullYear()} AM MOTORS. All rights reserved.</div>
    </footer>
  );
}

export default Footer;
