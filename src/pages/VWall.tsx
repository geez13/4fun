import React, { useState, useCallback } from 'react';
import { ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WalletConnector } from '@/components/WalletConnector';
import { MasonryGrid } from '@/components/MasonryGrid';
import { useInfiniteImages, GalleryImage } from '@/hooks/useInfiniteImages';
import { ImageModal } from '@/components/ImageModal';
import vsignLogoUrl from '@/assets/vsignlogo.svg';

// Custom hook for VWall images that uses the VWall API endpoint
const useVWallImages = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchImages = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = `${baseUrl}/api/vwall/images?page=${pageNum}&limit=20`;
      
      console.log('🔍 VWall: Fetching images from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch images`);
      }

      const result = await response.json();
      console.log('📊 VWall: API response:', result);

      if (result.success) {
        const newImages = result.data || [];
        console.log('🖼️ VWall: Received images:', newImages.length, 'images');
        console.log('🔗 VWall: First image URL:', newImages[0]?.image_url);
        
        setImages(prev => reset ? newImages : [...prev, ...newImages]);
        setHasMore(result.pagination?.hasMore || false);
      } else {
        throw new Error(result.error || 'Failed to fetch images');
      }
    } catch (err: any) {
      console.error('❌ VWall: Fetch error:', err);
      setError(err.message || 'An error occurred while fetching images');
    } finally {
      setLoading(false);
    }
  }, [loading]);

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
  React.useEffect(() => {
    refresh();
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

export const VWall: React.FC = () => {
  const navigate = useNavigate();
  const { images, loading, error, hasMore, loadMore, refresh } = useVWallImages();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const handleBack = () => {
    navigate('/');
  };

  const handleImageClick = useCallback((image: GalleryImage) => {
    setSelectedImage(image);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const openImageInNewTab = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <img 
                src={vsignLogoUrl} 
                alt="V-Sign" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-white">V Wall Gallery</h1>
            </div>
            
            <WalletConnector />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Community Gallery</h1>
          </div>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Discover amazing AI-enhanced images and user creations from our community
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Masonry Grid */}
        {!error && (
          <div className="relative">
            <MasonryGrid
              images={images}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onImageClick={handleImageClick}
              className="masonry-container"
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && images.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No images yet</h3>
            <p className="text-purple-200 mb-6">Be the first to create and share amazing images!</p>
            <button
              onClick={() => navigate('/editor')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Start Creating
            </button>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          images={images}
          isOpen={!!selectedImage}
          onClose={handleCloseModal}
        />
      )}

      {/* Custom styles for masonry layout with no gaps and square proportions */}
      <style>{`
        .masonry-container :global(.masonry-item) {
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 0;
        }
        
        .masonry-container :global(.masonry-item img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .masonry-container :global(.masonry-item:hover img) {
          transform: scale(1.05);
        }
        
        .masonry-container :global(.masonry-grid) {
          gap: 0;
        }
        
        @media (max-width: 640px) {
          .masonry-container :global(.masonry-grid) {
            gap: 1px;
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
          .masonry-container :global(.masonry-grid) {
            gap: 2px;
          }
        }
        
        @media (min-width: 769px) {
          .masonry-container :global(.masonry-grid) {
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};