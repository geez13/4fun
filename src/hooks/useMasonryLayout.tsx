import { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryImage } from './useInfiniteImages';

interface MasonryItem extends GalleryImage {
  height: number;
  column: number;
  top: number;
}

interface UseMasonryLayoutOptions {
  containerWidth: number;
  columnGap: number;
  minColumnWidth: number;
  maxColumns: number;
}

interface UseMasonryLayoutReturn {
  items: MasonryItem[];
  containerHeight: number;
  columnCount: number;
  columnWidth: number;
}

export const useMasonryLayout = (
  images: GalleryImage[],
  options: UseMasonryLayoutOptions
): UseMasonryLayoutReturn => {
  const { containerWidth, columnGap, minColumnWidth, maxColumns } = options;
  
  const [items, setItems] = useState<MasonryItem[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const [columnCount, setColumnCount] = useState(1);
  const [columnWidth, setColumnWidth] = useState(minColumnWidth);
  
  const columnHeightsRef = useRef<number[]>([]);

  const calculateLayout = useCallback(() => {
    if (!containerWidth || images.length === 0) {
      setItems([]);
      setContainerHeight(0);
      return;
    }

    // Calculate optimal column count
    const availableWidth = containerWidth;
    const maxPossibleColumns = Math.floor((availableWidth + columnGap) / (minColumnWidth + columnGap));
    const optimalColumns = Math.min(maxPossibleColumns, maxColumns);
    const finalColumnCount = Math.max(1, optimalColumns);
    
    // Calculate column width
    const totalGapWidth = (finalColumnCount - 1) * columnGap;
    const finalColumnWidth = (availableWidth - totalGapWidth) / finalColumnCount;
    
    setColumnCount(finalColumnCount);
    setColumnWidth(finalColumnWidth);

    // Initialize column heights
    columnHeightsRef.current = new Array(finalColumnCount).fill(0);

    const layoutItems: MasonryItem[] = [];

    images.forEach((image) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeightsRef.current.indexOf(
        Math.min(...columnHeightsRef.current)
      );

      // Calculate image height based on aspect ratio
      const imageHeight = finalColumnWidth / (image.aspect_ratio || 1);
      
      // Create layout item
      const item: MasonryItem = {
        ...image,
        height: imageHeight,
        column: shortestColumnIndex,
        top: columnHeightsRef.current[shortestColumnIndex]
      };

      layoutItems.push(item);

      // Update column height
      columnHeightsRef.current[shortestColumnIndex] += imageHeight + columnGap;
    });

    setItems(layoutItems);
    setContainerHeight(Math.max(...columnHeightsRef.current) - columnGap);
  }, [images, containerWidth, columnGap, minColumnWidth, maxColumns]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  return {
    items,
    containerHeight,
    columnCount,
    columnWidth
  };
};