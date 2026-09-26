import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/gmc-hero-final.jpg';
import mobileHeroImage from '../assets/gmc-hero-mobile.jpg';
import scrollImage from '../assets/icons/scroll.png';
import { dealership } from '../config/dealership.js';
import Benefits from './Benefits.jsx';
import Icon from './Icon.jsx';

function Hero() {
  const mobileHeroRef = useRef(null);

  useEffect(() => {
    const mobileHero = mobileHeroRef.current;
    if (!mobileHero) return undefined;

    const reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false, addEventListener() {}, removeEventListener() {} };
    let frameId = 0;
    let lastProgress = -1;
    let lastViewportHeight = 0;

    const smoothstep = (start, end, value) => {
      const progress = Math.min(Math.max((value - start) / (end - start), 0), 1);
      return progress * progress * (3 - (2 * progress));
    };

    const update = () => {
      frameId = 0;
      if (window.innerWidth >= 768 || reducedMotion.matches) return;

      const bounds = mobileHero.getBoundingClientRect();
      const scrollRange = Math.max(bounds.height - window.innerHeight, 1);
      const progress = Math.min(Math.max(-bounds.top / scrollRange, 0), 1);
      if (Math.abs(progress - lastProgress) < 0.001 && lastViewportHeight === window.innerHeight) return;
      lastProgress = progress;
      lastViewportHeight = window.innerHeight;
      const intro = 1 - smoothstep(0.17, 0.4, progress);
      const features = 1 - smoothstep(0.18, 0.4, progress);
      const details = smoothstep(0.43, 0.68, progress);
      const zoom = smoothstep(0.12, 0.92, progress);

      mobileHero.style.setProperty('--mobile-intro', intro.toFixed(4));
      mobileHero.style.setProperty('--mobile-intro-y', `${((1 - intro) * -22).toFixed(2)}px`);
      mobileHero.style.setProperty('--mobile-car-scale', (1 + (zoom * 0.31)).toFixed(4));
      mobileHero.style.setProperty('--mobile-car-shift', `${(-window.innerHeight * zoom * 0.025).toFixed(2)}px`);
      mobileHero.style.setProperty('--mobile-features', features.toFixed(4));
      mobileHero.style.setProperty('--mobile-features-y', `${((1 - features) * 18).toFixed(2)}px`);
      mobileHero.style.setProperty('--mobile-details', details.toFixed(4));
      mobileHero.style.setProperty('--mobile-details-y', `${((1 - details) * 26).toFixed(2)}px`);
      mobileHero.style.setProperty('--mobile-actions-x', `${((1 - details) * -28).toFixed(2)}px`);
      mobileHero.style.setProperty('--mobile-vehicle-x', `${((1 - details) * 28).toFixed(2)}px`);
      mobileHero.dataset.detailsVisible = details > 0.08 ? 'true' : 'false';
    };

    const requestUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    reducedMotion.addEventListener('change', requestUpdate);
    update();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      reducedMotion.removeEventListener('change', requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section className="hero" ref={mobileHeroRef} style={{ '--hero-image': `url(${heroImage})`, '--mobile-hero-image': `url(${mobileHeroImage})` }}>
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

      <div className="mobile-cinematic-hero">
        <div className="mobile-cinematic-frame">
          <div className="mobile-cinematic-photo" aria-hidden="true" />
          <div className="mobile-cinematic-shade" aria-hidden="true" />

          <div className="mobile-cinematic-intro">
            <p className="eyebrow">Premium vehicles</p>
            <h1>Find your<br /><span>next drive</span></h1>
            <p className="hero-copy">Explore our latest selection<br />of quality vehicles.</p>
          </div>
          <div className="mobile-cinematic-details">
            <div className="mobile-cinematic-actions">
              <Link className="button hero-primary" to="/cars">View Available Cars <Icon name="arrow" size={16} /></Link>
              <a className="button button-outline hero-contact" href={`https://wa.me/${dealership.whatsapp}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={20} />Contact Us</a>
            </div>
            <aside className="hero-vehicle" aria-label="Featured vehicle">
              <p>GMC</p>
              <h2>Yukon<br />Denali</h2>
              <span>Power.<br />Presence.<br />Prestige.</span>
            </aside>
          </div>

          <div className="mobile-cinematic-benefits">
            <Benefits embedded />
            <span className="mobile-scroll-cue" aria-hidden="true"><img src={scrollImage} alt="" /><small>Scroll down</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
