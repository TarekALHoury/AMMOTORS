import { useEffect, useRef, useState } from 'react';
import placeholder from '../assets/vehicle-placeholder.svg';

function VehicleImage({ src, alt, className = '', loading = 'lazy', width = 1200, height = 750 }) {
  const [useFallback, setUseFallback] = useState(!src);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setUseFallback(!src);
    if (!src) return undefined;

    timeoutRef.current = window.setTimeout(() => setUseFallback(true), 15000);
    return () => window.clearTimeout(timeoutRef.current);
  }, [src]);

  function handleLoad() {
    if (!useFallback) window.clearTimeout(timeoutRef.current);
  }

  return (
    <img
      className={className}
      src={useFallback ? placeholder : src}
      alt={useFallback ? 'Image unavailable' : alt}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={() => setUseFallback(true)}
    />
  );
}

export default VehicleImage;
