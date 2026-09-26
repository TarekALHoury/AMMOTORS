import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { dealership } from '../config/dealership.js';
import BrandLogo from './BrandLogo.jsx';
import Icon from './Icon.jsx';

function Navbar({ theme = 'dark', onToggleTheme = () => {} }) {
  const [open, setOpen] = useState(false);
  const [homeSection, setHomeSection] = useState('home');
  const [indicator, setIndicator] = useState(null);
  const menuRef = useRef(null);
  const linkRefs = useRef({});
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    if (location.pathname !== '/') return undefined;

    let frameId = 0;
    const updateSection = () => {
      frameId = 0;
      const navHeight = document.querySelector('.navbar')?.getBoundingClientRect().height || 76;
      const threshold = navHeight + Math.min(window.innerHeight * 0.28, 180);
      let current = 'home';
      for (const [key, selector] of [
        ['cars', '#latest-cars'],
        ['about', '#about'],
        ['contact', '#contact'],
      ]) {
        if (document.querySelector(selector)?.getBoundingClientRect().top <= threshold) current = key;
      }
      setHomeSection(current);
    };
    const requestUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateSection);
    };

    updateSection();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname]);

  const active = location.pathname === '/'
    ? homeSection
    : location.pathname.startsWith('/cars') ? 'cars' : null;

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const menu = menuRef.current;
      const link = linkRefs.current[active];
      setIndicator(menu && link ? { left: link.offsetLeft, width: link.offsetWidth } : null);
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [active]);

  const navProps = (key) => ({
    className: `nav-link ${active === key ? 'active' : ''}`,
    'aria-current': active === key ? (location.pathname === '/' ? 'location' : 'page') : undefined,
    ref: (element) => { linkRefs.current[key] = element; },
  });

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link className="brand" to="/" aria-label="AM MOTORS home">
          <BrandLogo theme={location.pathname === '/' ? 'dark' : theme} />
        </Link>

        <div className="nav-right">
          <nav className={`nav-menu ${open ? 'open' : ''}`} aria-label="Main navigation" ref={menuRef}>
            <Link {...navProps('home')} to="/">Home</Link>
            <Link {...navProps('cars')} to="/cars">Available Cars</Link>
            <Link {...navProps('about')} to="/#about">About</Link>
            <Link {...navProps('contact')} to="/#contact">Contact</Link>
            <span className="nav-active-indicator" aria-hidden="true" style={indicator ? { width: indicator.width, transform: `translateX(${indicator.left}px)` } : undefined} />
            <div className="nav-actions">
              <a className="icon-button" href={dealership.instagram} target="_blank" rel="noreferrer" aria-label="AM MOTORS on Instagram"><Icon name="instagram" size={19} /></a>
              <a className="icon-button" href={dealership.tiktok} target="_blank" rel="noreferrer" aria-label="AM MOTORS on TikTok"><Icon name="tiktok" size={19} className="tiktok-icon" /></a>
              <a className="button button-small" href={`https://wa.me/${dealership.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17} /> Contact</a>
            </div>
          </nav>
          <div className="nav-controls">
            <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-pressed={theme === 'light'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={21} />
            </button>
            <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle navigation">
              <Icon name={open ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
