import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMasonryLayout } from '../hooks/useMasonryLayout';
import { useLazyLoading } from '../hooks/useLazyLoading';
import { GalleryImage } from '../hooks/useInfiniteImages';
import { ImageTile } from './ImageTile';
import { LoadingGrid } from './LoadingPlaceholder';

interface MasonryGridProps {
  images: GalleryImage[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onImageClick?: (image: GalleryImage) => void;
  onViewIncrement?: (imageId: string) => void;
  className?: string;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  images,
  loading = false,
  hasMore = false,
  onLoadMore,
  onImageClick,
  onViewIncrement,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Responsive breakpoints for column count
  const getColumnConfig = useCallback((width: number) => {
    if (width < 640) return { columns: 2, minWidth: 150, gap: 8 };
    if (width < 768) return { columns: 3, minWidth: 180, gap: 12 };
    if (width < 1024) return { columns: 4, minWidth: 200, gap: 16 };
    if (width < 1280) return { columns: 5, minWidth: 220, gap: 16 };
    return { columns: 6, minWidth: 240, gap: 20 };
  }, []);

  const columnConfig = getColumnConfig(containerWidth);

  // Masonry layout calculation
  const { items, containerHeight, columnCount, columnWidth } = useMasonryLayout(images, {
    containerWidth,
    columnGap: columnConfig.gap,
    minColumnWidth: columnConfig.minWidth,
    maxColumns: columnConfig.columns
  });

  // Infinite scroll trigger
  const { ref: loadMoreRef, hasIntersected } = useLazyLoading({
    rootMargin: '200px',
    threshold: 0.1,
    triggerOnce: false
  });

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger load more when intersection is detected
  useEffect(() => {
    if (hasIntersected && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasIntersected, hasMore, loading, onLoadMore]);

  // Virtual scrolling optimization for large lists
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: items.length });
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const buffer = viewportHeight; // Buffer for smooth scrolling
      
      const start = Math.max(0, 
        items.findIndex(item => item.top + item.height >= scrollTop - buffer)
      );
      
      const end = Math.min(items.length,
        items.findIndex(item => item.top > scrollTop + viewportHeight + buffer) + 1
      );
      
      setVisibleRange({ start, end: end === 0 ? items.length : end });
    };

    // Only enable virtual scrolling for large lists
    if (items.length > 100) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setVisibleRange({ start: 0, end: items.length });
    }
  }, [items]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Masonry container */}
      <div 
        className="relative"
        style={{ height: containerHeight }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: item.column * (columnWidth + columnConfig.gap),
              top: item.top,
              width: columnWidth,
              height: item.height
            }}
          >
            <ImageTile
              image={item}
              width={columnWidth}
              height={item.height}
              onClick={onImageClick}
              onViewIncrement={onViewIncrement}
            />
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8">
          <LoadingGrid 
            count={12} 
            columnCount={columnCount}
            className="gap-4"
          />
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !loading && (
        <div 
          ref={loadMoreRef as React.RefObject<HTMLDivElement>}
          className="h-20 flex items-center justify-center mt-8"
        >
          <div className="text-gray-400 text-sm">Loading more images...</div>
        </div>
      )}

      {/* End of content */}
      {!hasMore && images.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">
            You've reached the end of the gallery
          </div>
          <div className="text-gray-300 text-xs mt-1">
            {images.length} images total
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && images.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-300 rounded" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      )}
    </div>
  );
};