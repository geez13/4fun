import React from 'react';

interface LoadingPlaceholderProps {
  width?: number;
  height?: number;
  aspectRatio?: number;
  className?: string;
  animate?: boolean;
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({
  width,
  height,
  aspectRatio = 1,
  className = '',
  animate = true
}) => {
  const calculatedHeight = height || (width ? width / aspectRatio : 200);
  
  return (
    <div
      className={`
        bg-black 
        rounded-lg overflow-hidden relative
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        width: width || '100%',
        height: calculatedHeight,
        aspectRatio: aspectRatio
      }}
    >
      {/* Shimmer effect */}
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      
      {/* Content placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-600" />
      </div>
    </div>
  );
};

// Grid of loading placeholders for masonry layout
interface LoadingGridProps {
  count?: number;
  columnCount?: number;
  className?: string;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({
  count = 12,
  columnCount = 3,
  className = ''
}) => {
  const placeholders = Array.from({ length: count }, (_, index) => {
    // Vary aspect ratios for more realistic loading state
    const aspectRatios = [0.75, 1, 1.25, 1.5, 0.8, 1.2];
    const aspectRatio = aspectRatios[index % aspectRatios.length];
    
    return (
      <LoadingPlaceholder
        key={index}
        aspectRatio={aspectRatio}
        className="w-full"
      />
    );
  });

  return (
    <div 
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`
      }}
    >
      {placeholders}
    </div>
  );
};

// Single image loading state with metadata placeholders
export const ImageLoadingCard: React.FC<{ aspectRatio?: number }> = ({ 
  aspectRatio = 1 
}) => {
  return (
    <div className="w-full">
      <LoadingPlaceholder aspectRatio={aspectRatio} className="mb-2" />
      
      {/* Metadata placeholders */}
      <div className="space-y-2 p-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="flex space-x-2">
          <div className="h-2 bg-gray-200 rounded animate-pulse w-8" />
          <div className="h-2 bg-gray-200 rounded animate-pulse w-8" />
          <div className="h-2 bg-gray-200 rounded animate-pulse w-8" />
        </div>
      </div>
    </div>
  );
};