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
    const photo = mobileHero.querySelector('.mobile-cinematic-photo');
    const introLayer = mobileHero.querySelector('.mobile-cinematic-intro');
    const featuresLayer = mobileHero.querySelector('.mobile-cinematic-benefits');
    const detailsLayer = mobileHero.querySelector('.mobile-cinematic-details');

    const reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false, addEventListener() {}, removeEventListener() {} };
    const mobileLayout = window.matchMedia
      ? window.matchMedia('(max-width: 767px)')
      : { matches: window.innerWidth < 768 };
    let frameId = 0;
    let layoutFrameId = 0;
    let lastProgress = -1;
    let stableViewportHeight = 0;
    let stableViewportWidth = document.documentElement.clientWidth || window.innerWidth;
    let scrollRange = 1;

    const smoothstep = (start, end, value) => {
      const progress = Math.min(Math.max((value - start) / (end - start), 0), 1);
      return progress * progress * (3 - (2 * progress));
    };
    const setVariable = (element, name, value) => {
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
    };

    const readOrientation = () => window.screen?.orientation?.type
      || ((document.documentElement.clientWidth || window.innerWidth) > stableViewportHeight ? 'landscape' : 'portrait');
    let stableOrientation = readOrientation();

    const measureLargeViewportHeight = () => {
      const probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none;';
      document.body.appendChild(probe);
      const height = probe.getBoundingClientRect().height;
      probe.remove();
      return height;
    };

    const captureStableLayout = () => {
      if (!mobileLayout.matches) return;

      mobileHero.style.removeProperty('--stable-mobile-viewport-height');
      mobileHero.style.removeProperty('--stable-mobile-scroll-height');
      mobileHero.style.removeProperty('--stable-mobile-intro-offset');
      const largeViewportHeight = Math.round(measureLargeViewportHeight());
      stableViewportHeight = Math.max(
        largeViewportHeight,
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0,
        1,
      );
      stableViewportWidth = document.documentElement.clientWidth || window.innerWidth;
      stableOrientation = readOrientation();
      setVariable(mobileHero, '--stable-mobile-viewport-height', `${stableViewportHeight}px`);
      setVariable(mobileHero, '--stable-mobile-scroll-height', `${stableViewportHeight * 3}px`);
      setVariable(mobileHero, '--stable-mobile-intro-offset', `${Math.min(Math.max(stableViewportHeight * 0.12, 78), 112)}px`);
      scrollRange = Math.max(mobileHero.offsetHeight - stableViewportHeight, 1);
      lastProgress = -1;
    };

    const update = () => {
      frameId = 0;
      if (!mobileLayout.matches || reducedMotion.matches) return;

      const bounds = mobileHero.getBoundingClientRect();
      const progress = Math.min(Math.max(-bounds.top / scrollRange, 0), 1);
      if (Math.abs(progress - lastProgress) < 0.001) return;
      lastProgress = progress;
      const intro = 1 - smoothstep(0.17, 0.4, progress);
      const features = 1 - smoothstep(0.18, 0.4, progress);
      const details = smoothstep(0.43, 0.68, progress);
      const zoom = smoothstep(0.12, 0.92, progress);

      setVariable(introLayer, '--mobile-intro', intro.toFixed(4));
      setVariable(photo, '--mobile-car-scale', (1 + (zoom * 0.31)).toFixed(4));
      setVariable(featuresLayer, '--mobile-features', features.toFixed(4));
      setVariable(detailsLayer, '--mobile-details', details.toFixed(4));
      const detailsVisible = details > 0.08 ? 'true' : 'false';
      if (mobileHero.dataset.detailsVisible !== detailsVisible) mobileHero.dataset.detailsVisible = detailsVisible;
    };

    const requestUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    };

    const recaptureLayout = () => {
      layoutFrameId = 0;
      captureStableLayout();
      requestUpdate();
    };

    const requestLayoutRecapture = () => {
      if (!layoutFrameId) layoutFrameId = window.requestAnimationFrame(recaptureLayout);
    };

    const handleResize = () => {
      const currentWidth = document.documentElement.clientWidth || window.innerWidth;
      const widthDelta = Math.abs(currentWidth - stableViewportWidth);
      const meaningfulWidthChange = widthDelta >= Math.max(48, stableViewportWidth * 0.08);
      const orientationChanged = readOrientation() !== stableOrientation;
      if (meaningfulWidthChange || orientationChanged) requestLayoutRecapture();
    };

    const handleOrientationChange = () => requestLayoutRecapture();

    captureStableLayout();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.screen?.orientation?.addEventListener?.('change', handleOrientationChange);
    reducedMotion.addEventListener('change', requestUpdate);
    update();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.screen?.orientation?.removeEventListener?.('change', handleOrientationChange);
      reducedMotion.removeEventListener('change', requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
      if (layoutFrameId) window.cancelAnimationFrame(layoutFrameId);
    };
  }, []);

  return (
    <section className="hero" ref={mobileHeroRef} style={{ '--hero-image': `url(${heroImage})` }}>
      <div className="hero-shade" />
      <div className="page-width hero-content">
        <div className="hero-copy-block">
          <p className="eyebrow">Premium vehicles</p>
          <h1>Find your<br /><span>next drive</span></h1>
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
          <img className="mobile-cinematic-photo" src={mobileHeroImage} alt="" aria-hidden="true" fetchPriority="high" decoding="async" />
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
