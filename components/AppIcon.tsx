import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface AppIconProps {
  src: string;
  alt: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ src, alt, className }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}>
        <ImageOff size={24} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};