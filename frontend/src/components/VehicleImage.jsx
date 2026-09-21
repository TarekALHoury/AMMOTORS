import { useEffect, useRef, useState } from 'react';
import placeholder from '../assets/vehicle-placeholder.svg';

function VehicleImage({ src, alt, className = '', loading = 'lazy' }) {
  const [useFallback, setUseFallback] = useState(!src);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setUseFallback(!src);
    if (!src) return undefined;

    timeoutRef.current = window.setTimeout(() => setUseFallback(true), 5000);
    return () => window.clearTimeout(timeoutRef.current);
  }, [src]);

  function handleLoad() {
    if (!useFallback) window.clearTimeout(timeoutRef.current);
  }

  return (
    <img
      className={className}
      src={useFallback ? placeholder : src}
      alt={alt}
      loading={loading}
      onLoad={handleLoad}
      onError={() => setUseFallback(true)}
    />
  );
}

export default VehicleImage;
