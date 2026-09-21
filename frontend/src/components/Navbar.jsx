import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '../assets/am-motors-logo.png';
import { dealership } from '../config/dealership.js';
import Icon from './Icon.jsx';

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const homeClass = location.pathname === '/' && !location.hash ? 'nav-link active' : 'nav-link';

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link className="brand" to="/" aria-label="AM MOTORS home">
          <img src={logo} alt="AM MOTORS" />
        </Link>

        <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle navigation">
          <Icon name={open ? 'close' : 'menu'} size={24} />
        </button>

        <nav className={`nav-menu ${open ? 'open' : ''}`} aria-label="Main navigation">
          <Link className={homeClass} to="/">Home</Link>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/cars">Available Cars</NavLink>
          <Link className={`nav-link ${location.hash === '#about' ? 'active' : ''}`} to="/#about">About</Link>
          <Link className={`nav-link ${location.hash === '#contact' ? 'active' : ''}`} to="/#contact">Contact</Link>
          <div className="nav-actions">
            <a className="icon-button" href={dealership.instagram} target="_blank" rel="noreferrer" aria-label="AM MOTORS on Instagram"><Icon name="instagram" size={19} /></a>
            <a className="button button-small" href={`https://wa.me/${dealership.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17} /> Contact</a>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

