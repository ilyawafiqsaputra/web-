import React, { useState } from 'react';
import { getInitials } from '../utils/formatters';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackType?: 'book' | 'avatar' | 'logo';
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'book',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    if (fallbackType === 'avatar') {
      const initials = getInitials(fallbackLabel || alt || 'AN');
      return (
        <div
          className={`flex items-center justify-center bg-primary-container text-on-primary font-bold select-none ${className}`}
          aria-label={alt}
        >
          <span className="text-xs tracking-wide">{initials}</span>
        </div>
      );
    }

    if (fallbackType === 'logo') {
      return (
        <div
          className={`flex items-center justify-center bg-primary text-on-primary rounded-lg font-bold select-none ${className}`}
          aria-label={alt}
        >
          <span className="material-symbols-outlined text-lg">local_library</span>
        </div>
      );
    }

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-highest text-primary p-1 text-center select-none ${className}`}
        aria-label={alt}
      >
        <span className="material-symbols-outlined text-base opacity-80">menu_book</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
