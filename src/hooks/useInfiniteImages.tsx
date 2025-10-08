import { useState, useEffect, useCallback, useRef } from 'react';

export interface GalleryImage {
  id: string;
  image_url: string;
  thumbnail_url: string;
  optimized_url: string;
  aspect_ratio: number;
  created_at: string;
  prompt: string;
  style: string;
  owner_pubkey: string;
  wallet_address: string | null;
}

interface UseInfiniteImagesOptions {
  searchQuery?: string;
}

interface UseInfiniteImagesReturn {
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export const useInfiniteImages = (options: UseInfiniteImagesOptions = {}): UseInfiniteImagesReturn => {
  const { searchQuery } = options;
  
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const loadingRef = useRef(false);

  const fetchImages = useCallback(async (pageNum: number, reset = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const endpoint = searchQuery ? '/api/gallery/search' : '/api/gallery/images';
      const url = `${baseUrl}${endpoint}?${params}`;
      
      console.log('Fetching images from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch images`);
      }

      const result = await response.json();
      console.log('API result:', result);

      if (result.success) {
        const newImages = result.data || [];
        
        setImages(prev => reset ? newImages : [...prev, ...newImages]);
        setHasMore(result.pagination?.hasMore || false);
      } else {
        throw new Error(result.error || 'Failed to fetch images');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred while fetching images');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [searchQuery]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchImages(nextPage);
    }
  }, [loading, hasMore, page, fetchImages]);

  const refresh = useCallback(() => {
    setPage(1);
    setImages([]);
    setHasMore(true);
    fetchImages(1, true);
  }, [fetchImages]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [searchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      loadingRef.current = false;
    };
  }, []);

  return {
    images,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};