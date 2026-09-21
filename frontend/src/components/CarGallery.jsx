import { useEffect, useState } from 'react';
import VehicleImage from './VehicleImage.jsx';

function CarGallery({ images = [], name }) {
  const safeImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setActiveIndex(0), [images]);

  if (!safeImages.length) return <div className="gallery-placeholder">Image coming soon</div>;

  function move(direction) {
    setActiveIndex((current) => (current + direction + safeImages.length) % safeImages.length);
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <VehicleImage src={safeImages[activeIndex]} alt={`${name} view ${activeIndex + 1}`} loading="eager" />
        {safeImages.length > 1 && <><button type="button" className="gallery-control previous" onClick={() => move(-1)} aria-label="Previous image">‹</button><button type="button" className="gallery-control next" onClick={() => move(1)} aria-label="Next image">›</button></>}
      </div>
      {safeImages.length > 1 && <div className="thumbnails">{safeImages.map((image, index) => <button type="button" className={index === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(index)} key={`${image}-${index}`}><VehicleImage src={image} alt={`${name} thumbnail ${index + 1}`} /></button>)}</div>}
    </div>
  );
}

export default CarGallery;
