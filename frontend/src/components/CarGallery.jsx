import { useEffect, useRef, useState } from 'react';
import { Expand, X } from 'lucide-react';
import VehicleImage from './VehicleImage.jsx';

function CarGallery({ images = [], name }) {
  const safeImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef(null);
  const suppressOpen = useRef(false);
  const thumbnailsRef = useRef(null);
  const thumbnailRefs = useRef([]);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    setActiveIndex(0);
    setIsLightboxOpen(false);
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
    const strip = thumbnailsRef.current;
    if (!strip) return undefined;

    function handleWheel(event) {
      if (strip.scrollWidth <= strip.clientWidth) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      strip.scrollLeft += event.deltaY;
    }

    strip.addEventListener('wheel', handleWheel, { passive: false });
    return () => strip.removeEventListener('wheel', handleWheel);
  }, [safeImages.length]);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])') || [])]
          .filter((element) => !element.disabled);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [isLightboxOpen, safeImages.length]);

  if (!safeImages.length) return <div className="gallery-placeholder">Image coming soon</div>;

  function move(direction) {
    setActiveIndex((current) => Math.min(Math.max(current + direction, 0), safeImages.length - 1));
  }

  function selectImage(index) {
    if (index === activeIndex) return;
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
    returnFocusRef.current = document.activeElement;
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
          onTouchCancel={() => { touchStartX.current = null; }}
          aria-label={`Enlarge ${name} image ${activeIndex + 1}`}
        >
          <span className="gallery-image-track" style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}>
            {safeImages.map((image, index) => (
              <span className="gallery-image-slide" aria-hidden={index !== activeIndex} key={`${image}-${index}`}>
                <VehicleImage src={image} alt={`${name} view ${index + 1}`} loading={index === activeIndex ? 'eager' : 'lazy'} />
              </span>
            ))}
          </span>
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
        <div ref={dialogRef} className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${name} enlarged image`} onClick={() => setIsLightboxOpen(false)}>
          <div className="gallery-lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button ref={closeButtonRef} type="button" className="gallery-lightbox-close" onClick={() => setIsLightboxOpen(false)} aria-label="Close enlarged image"><X /></button>
            <div className="gallery-lightbox-image" onTouchStart={startSwipe} onTouchEnd={finishSwipe} onTouchCancel={() => { touchStartX.current = null; }}>
              <div className="gallery-image-track" style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}>
                {safeImages.map((image, index) => (
                  <div className="gallery-image-slide" aria-hidden={index !== activeIndex} key={`${image}-${index}`}>
                    <VehicleImage src={image} alt={`${name} enlarged view ${index + 1}`} loading={index === activeIndex ? 'eager' : 'lazy'} />
                  </div>
                ))}
              </div>
            </div>
            <p className="gallery-lightbox-count">{activeIndex + 1} / {safeImages.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarGallery;
