import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, Heart, Eye, User, Calendar } from 'lucide-react';
import { GalleryImage } from '../hooks/useInfiniteImages';

interface ImageModalProps {
  image: GalleryImage | null;
  images: GalleryImage[];
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onViewIncrement?: (imageId: string) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  image,
  images,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onViewIncrement
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Find current image index
  const currentIndex = image ? images.findIndex(img => img.id === image.id) : -1;
  const hasNext = currentIndex < images.length - 1;
  const hasPrevious = currentIndex > 0;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) {
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (hasNext && onNext) {
            onNext();
          }
          break;
        case 'i':
        case 'I':
          setShowDetails(!showDetails);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrevious, onNext, onPrevious, onClose, showDetails]);

  // Reset loading state when image changes
  useEffect(() => {
    if (image) {
      setIsLoading(true);
      setImageError(false);
    }
  }, [image?.id]);

  // Increment view count when modal opens
  useEffect(() => {
    if (isOpen && image && onViewIncrement) {
      onViewIncrement(image.id);
    }
  }, [isOpen, image?.id, onViewIncrement]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!image) return;

    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vsign-image-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  }, [image]);

  const handleShare = useCallback(async () => {
    if (!image) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'V-Sign Generated Image',
          text: image.prompt || 'Check out this amazing AI-generated image!',
          url: window.location.href
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }, [image]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-white">
              <div className="text-sm font-medium">
                {currentIndex + 1} of {images.length}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Toggle details"
            >
              <Eye className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Share image"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Download image"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-4 pt-20 pb-20">
        <div className="relative max-w-7xl max-h-full">
          {/* Image */}
          <img
            src={image.image_url}
            alt={image.prompt || 'Generated image'}
            className={`
              max-w-full max-h-full object-contain transition-opacity duration-300
              ${isLoading ? 'opacity-0' : 'opacity-100'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-xl mb-2">⚠️</div>
                <div>Failed to load image</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details panel */}
      {showDetails && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent">
          <div className="p-6 text-white max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Image Details</h3>
                
                {image.prompt && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-300 mb-1">Prompt</div>
                    <p className="text-sm leading-relaxed">{image.prompt}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-300 mb-1">Style</div>
                    <div className="capitalize">{image.style}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-300 mb-1">Aspect Ratio</div>
                    <div>{image.aspect_ratio?.toFixed(2) || '1.00'}</div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Statistics</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-lg font-semibold">{formatCount(0)}</span>
                    </div>
                    <div className="text-xs text-gray-300">Views</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="text-lg font-semibold">{formatCount(0)}</span>
                    </div>
                    <div className="text-xs text-gray-300">Likes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Share2 className="w-4 h-4 mr-1" />
                      <span className="text-lg font-semibold">{formatCount(0)}</span>
                    </div>
                    <div className="text-xs text-gray-300">Shares</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-300" />
                    <span className="text-gray-300">Creator:</span>
                    <span className="ml-2 font-mono">
                      {image.owner_pubkey.slice(0, 8)}...{image.owner_pubkey.slice(-8)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-300" />
                    <span className="text-gray-300">Created:</span>
                    <span className="ml-2">{formatDate(image.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 text-center">
              Press ESC to close • Use arrow keys to navigate • Press I to toggle details
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
};