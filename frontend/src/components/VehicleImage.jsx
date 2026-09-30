import { useEffect, useState } from 'react';
import placeholder from '../assets/vehicle-placeholder.svg';

function VehicleImage({ src, alt, className = '', loading = 'lazy', width = 1200, height = 750 }) {
  const [useFallback, setUseFallback] = useState(!src);

  useEffect(() => {
    setUseFallback(!src);
  }, [src]);

  return (
    <img
      className={className}
      src={useFallback ? placeholder : src}
      alt={useFallback ? 'Image unavailable' : alt}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      onError={() => setUseFallback(true)}
    />
  );
}

export default VehicleImage;
