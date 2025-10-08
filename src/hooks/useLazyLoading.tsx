import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLElement>;
  isIntersecting: boolean;
  hasIntersected: boolean;
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const { rootMargin = '300px', threshold = 0.01, triggerOnce = true } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isCurrentlyIntersecting = entry.isIntersecting;
    
    setIsIntersecting(isCurrentlyIntersecting);
    
    if (isCurrentlyIntersecting && !hasIntersected) {
      setHasIntersected(true);
      
      if (triggerOnce && observerRef.current && ref.current) {
        observerRef.current.unobserve(ref.current);
      }
    }
  }, [hasIntersected, triggerOnce]);

  useEffect(() => {
    const element = ref.current;
    
    if (!element) return;

    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  return {
    ref,
    isIntersecting,
    hasIntersected
  };
};

// Hook for lazy loading images with blur-to-sharp transition
interface UseLazyImageOptions {
  src: string;
  placeholder?: string;
  rootMargin?: string;
  threshold?: number;
}

interface UseLazyImageReturn {
  ref: React.RefObject<HTMLImageElement>;
  src: string;
  isLoaded: boolean;
  isLoading: boolean;
  error: boolean;
}

export const useLazyImage = (options: UseLazyImageOptions): UseLazyImageReturn => {
  const { src, placeholder, rootMargin = '300px', threshold = 0.01 } = options;
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [shouldLoadImmediately, setShouldLoadImmediately] = useState(false);
  
  const ref = useRef<HTMLImageElement>(null);
  const { isIntersecting, hasIntersected } = useLazyLoading({ 
    rootMargin, 
    threshold, 
    triggerOnce: true 
  });

  // Check if element is in initial viewport on mount
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if element is in viewport immediately
    const rect = element.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );

    if (isInViewport) {
      setShouldLoadImmediately(true);
    }
  }, [src]);

  useEffect(() => {
    if ((hasIntersected || shouldLoadImmediately) && src && !isLoaded && !isLoading) {
      setIsLoading(true);
      setError(false);

      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
      };
      
      img.src = src;
    }
  }, [hasIntersected, shouldLoadImmediately, src, isLoaded, isLoading]);

  return {
    ref: ref as React.RefObject<HTMLImageElement>,
    src: currentSrc,
    isLoaded,
    isLoading,
    error
  };
};