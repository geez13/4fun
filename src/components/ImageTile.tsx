import React, { useState, useCallback } from 'react';
import { useLazyImage } from '../hooks/useLazyLoading';
import { GalleryImage } from '../hooks/useInfiniteImages';

interface ImageTileProps {
  image: GalleryImage;
  width: number;
  height: number;
  onClick?: (image: GalleryImage) => void;
  onViewIncrement?: (imageId: string) => void;
  className?: string;
}

export const ImageTile: React.FC<ImageTileProps> = ({
  image,
  width,
  height,
  onClick,
  onViewIncrement,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  // Use lazy loading with blur-to-sharp transition
  const { ref, src, isLoaded, isLoading, error } = useLazyImage({
    src: image.optimized_url || image.thumbnail_url || image.image_url,
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+',
    rootMargin: '500px',
    threshold: 0.01
  });

  const handleClick = useCallback(() => {
    if (!hasViewed && onViewIncrement) {
      onViewIncrement(image.id);
      setHasViewed(true);
    }
    
    if (onClick) {
      onClick(image);
    }
  }, [image, onClick, onViewIncrement, hasViewed]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div
      className={`
        relative group cursor-pointer overflow-hidden rounded-lg
        transform transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl
        ${className}
      `}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Image */}
      <img
        ref={ref}
        src={src}
        alt={image.prompt || 'Generated image'}
        className={`
          w-full h-full object-cover transition-all duration-500
          ${isLoaded ? 'opacity-100 blur-0' : 'opacity-70 blur-sm'}
          ${error ? 'opacity-50' : ''}
        `}
        loading="lazy"
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-black animate-pulse" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-600" />
            <div className="text-xs">Failed to load</div>
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
        transition-opacity duration-300
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Image info */}
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium truncate">
              {image.prompt}
            </span>
            <span className="text-white/80 text-xs">
              {formatDate(image.created_at)}
            </span>
          </div>
          
          {/* Style info */}
          <div className="text-white/60 text-xs mt-1 capitalize">
            {image.style} style
          </div>
        </div>
      </div>
    </div>
  );
};