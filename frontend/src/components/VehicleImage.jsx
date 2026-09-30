import { useEffect, useState } from 'react';
import placeholder from '../assets/vehicle-placeholder.svg';

function VehicleImage({ src, alt, className = '', loading = 'lazy', width = 1200, height = 750 }) {
  const [useFallback, setUseFallback] = useState(!src);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setUseFallback(!src);
    setRetryCount(0);
  }, [src]);

  const imageSource = retryCount && src
    ? `${src}${src.includes('?') ? '&' : '?'}ammotors_retry=${retryCount}`
    : src;

  function handleError() {
    if (!src || useFallback) return;
    if (retryCount === 0) {
      setRetryCount(1);
      return;
    }
    setUseFallback(true);
  }

  return (
    <img
      className={className}
      src={useFallback ? placeholder : imageSource}
      alt={useFallback ? 'Image unavailable' : alt}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      onError={handleError}
    />
  );
}

export default VehicleImage;
