import { Link } from 'react-router-dom';
import heroImage from '../assets/gmc-hero-final.png';
import { dealership } from '../config/dealership.js';
import Benefits from './Benefits.jsx';
import Icon from './Icon.jsx';

function Hero() {
  return (
    <section className="hero" style={{ '--hero-image': `url(${heroImage})` }}>
      <div className="hero-shade" />
      <div className="page-width hero-content">
        <div className="hero-copy-block">
          <p className="eyebrow">Premium vehicles</p>
          <h1>Find your<br /><span>next drive.</span></h1>
          <p className="hero-copy">Explore our latest selection of quality vehicles.</p>
          <div className="hero-actions">
            <Link className="button hero-primary" to="/cars">View Available Cars <Icon name="arrow" size={18} /></Link>
            <a className="button button-outline hero-contact" href={`https://wa.me/${dealership.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={27} />Contact Us</a>
          </div>
        </div>

        <aside className="hero-vehicle" aria-label="Featured vehicle">
          <p>GMC</p>
          <h2>Yukon<br />Denali</h2>
          <span>Power.<br />Presence.<br />Prestige.</span>
        </aside>

        <Benefits embedded />
      </div>
    </section>
  );
}

export default Hero;
