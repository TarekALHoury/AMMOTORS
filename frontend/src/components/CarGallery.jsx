import { useEffect, useRef, useState } from 'react';
import { Expand, X } from 'lucide-react';
import VehicleImage from './VehicleImage.jsx';

function CarGallery({ images = [], name }) {
  const safeImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('next');
  const touchStartX = useRef(null);
  const suppressOpen = useRef(false);
  const thumbnailsRef = useRef(null);
  const thumbnailRefs = useRef([]);

  useEffect(() => {
    setActiveIndex(0);
    setIsLightboxOpen(false);
    setAnimationDirection('next');
  }, [images]);

  useEffect(() => {
    const strip = thumbnailsRef.current;
    const thumbnail = thumbnailRefs.current[activeIndex];
    if (!strip || !thumbnail || typeof strip.scrollTo !== 'function') return;

    strip.scrollTo({
      left: thumbnail.offsetLeft - ((strip.clientWidth - thumbnail.clientWidth) / 2),
      behavior: 'smooth',
    });
  }, [activeIndex]);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, safeImages.length]);

  if (!safeImages.length) return <div className="gallery-placeholder">Image coming soon</div>;

  function move(direction) {
    setAnimationDirection(direction > 0 ? 'next' : 'previous');
    setActiveIndex((current) => (current + direction + safeImages.length) % safeImages.length);
  }

  function selectImage(index) {
    if (index === activeIndex) return;
    setAnimationDirection(index > activeIndex ? 'next' : 'previous');
    setActiveIndex(index);
  }

  function startSwipe(event) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function finishSwipe(event, preventOpen = false) {
    if (touchStartX.current === null || safeImages.length < 2) return;
    const distance = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current);
    touchStartX.current = null;

    if (Math.abs(distance) < 45) return;
    if (preventOpen) suppressOpen.current = true;
    move(distance > 0 ? 1 : -1);
  }

  function openLightbox() {
    if (suppressOpen.current) {
      suppressOpen.current = false;
      return;
    }
    setIsLightboxOpen(true);
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <button
          type="button"
          className="gallery-expand-trigger"
          onClick={openLightbox}
          onTouchStart={startSwipe}
          onTouchEnd={(event) => finishSwipe(event, true)}
          aria-label={`Enlarge ${name} image ${activeIndex + 1}`}
        >
          <VehicleImage
            key={`main-${safeImages[activeIndex]}`}
            className={`gallery-active-image gallery-slide-${animationDirection}`}
            src={safeImages[activeIndex]}
            alt={`${name} view ${activeIndex + 1}`}
            loading="eager"
          />
          <span className="gallery-expand-hint" aria-hidden="true"><Expand size={17} /> View larger</span>
        </button>
      </div>

      {safeImages.length > 1 && (
        <div className="thumbnails" ref={thumbnailsRef} aria-label={`${name} image previews`}>
          {safeImages.map((image, index) => (
            <button
              type="button"
              className={index === activeIndex ? 'active' : ''}
              onClick={() => selectImage(index)}
              aria-label={`Show ${name} image ${index + 1}`}
              aria-pressed={index === activeIndex}
              ref={(element) => { thumbnailRefs.current[index] = element; }}
              key={`${image}-${index}`}
            >
              <VehicleImage src={image} alt="" />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${name} enlarged image`} onClick={() => setIsLightboxOpen(false)}>
          <div className="gallery-lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="gallery-lightbox-close" onClick={() => setIsLightboxOpen(false)} aria-label="Close enlarged image"><X /></button>
            <div className="gallery-lightbox-image" onTouchStart={startSwipe} onTouchEnd={finishSwipe}>
              <VehicleImage
                key={`lightbox-${safeImages[activeIndex]}`}
                className={`gallery-active-image gallery-slide-${animationDirection}`}
                src={safeImages[activeIndex]}
                alt={`${name} enlarged view ${activeIndex + 1}`}
                loading="eager"
              />
            </div>
            <p className="gallery-lightbox-count">{activeIndex + 1} / {safeImages.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarGallery;
