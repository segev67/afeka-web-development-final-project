'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSeed?: string;
  country?: string;
  city?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  country,
  city,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    // Only fallback once to avoid infinite loops
    if (!hasError && !imgSrc.includes('picsum.photos')) {
      // Generate deterministic seed from location
      const locationStr = `${country}-${city}`;
      const seed = Math.abs(
        locationStr.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
      );

      console.log('AI image failed to load, using fallback');
      setImgSrc(`https://picsum.photos/seed/${seed}/1200/600`);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
}
