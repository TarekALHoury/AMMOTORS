import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import VehicleImage from './VehicleImage.jsx';

function CarGallery({ images = [], name }) {
  const safeImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setIsLightboxOpen(false);
  }, [images]);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => (current - 1 + safeImages.length) % safeImages.length);
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => (current + 1) % safeImages.length);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, safeImages.length]);

  if (!safeImages.length) return <div className="gallery-placeholder">Image coming soon</div>;

  function move(direction) {
    setActiveIndex((current) => (current + direction + safeImages.length) % safeImages.length);
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <button
          type="button"
          className="gallery-expand-trigger"
          onClick={() => setIsLightboxOpen(true)}
          aria-label={`Enlarge ${name} image ${activeIndex + 1}`}
        >
          <VehicleImage src={safeImages[activeIndex]} alt={`${name} view ${activeIndex + 1}`} loading="eager" />
          <span className="gallery-expand-hint" aria-hidden="true"><Expand size={17} /> View larger</span>
        </button>
        {safeImages.length > 1 && (
          <>
            <button type="button" className="gallery-control previous" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft /></button>
            <button type="button" className="gallery-control next" onClick={() => move(1)} aria-label="Next image"><ChevronRight /></button>
          </>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="thumbnails" aria-label={`${name} image previews`}>
          {safeImages.map((image, index) => (
            <button
              type="button"
              className={index === activeIndex ? 'active' : ''}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${name} image ${index + 1}`}
              aria-pressed={index === activeIndex}
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
            <div className="gallery-lightbox-image">
              <VehicleImage src={safeImages[activeIndex]} alt={`${name} enlarged view ${activeIndex + 1}`} loading="eager" />
              {safeImages.length > 1 && (
                <>
                  <button type="button" className="gallery-lightbox-control previous" onClick={() => move(-1)} aria-label="Previous enlarged image"><ChevronLeft /></button>
                  <button type="button" className="gallery-lightbox-control next" onClick={() => move(1)} aria-label="Next enlarged image"><ChevronRight /></button>
                </>
              )}
            </div>
            <p className="gallery-lightbox-count">{activeIndex + 1} / {safeImages.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarGallery;
