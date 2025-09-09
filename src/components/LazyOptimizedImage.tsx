import React, { useState, useRef, useCallback } from 'react';
import { useInView } from '@/hooks/useInView';
import { createOptimizedImageProps } from '@/lib/imageOptimization';

interface LazyOptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: number[];
  aspectRatio?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyOptimizedImage: React.FC<LazyOptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  sizes,
  aspectRatio = '16/9', // 默认宽高比避免CLS
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref: containerRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '100px' // 提前100px开始加载，减少等待时间
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // 只有在视窗内或高优先级时才加载图片
  const shouldLoad = priority || inView;
  
  const optimizedProps = shouldLoad ? 
    createOptimizedImageProps(src, alt, { priority, sizes, aspectRatio }) :
    { src: '', alt: '' };

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden contain-paint ${className}`}
      style={{ 
        aspectRatio,
        minHeight: '200px' // 防止CLS的最小高度
      }}
    >
      {/* 优化的占位符 - 防止CLS */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-muted lazy-placeholder"
          style={{ aspectRatio }}
          aria-hidden="true"
        />
      )}
      
      {/* 错误占位符 */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-sm"
          style={{ aspectRatio }}
        >
          图片加载失败
        </div>
      )}
      
      {/* 实际图片 - 优化CLS */}
      {shouldLoad && !hasError && (
        <img
          ref={imgRef}
          {...optimizedProps}
          width="400"
          height="300"
          style={{ aspectRatio }}
          className={`absolute inset-0 transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } object-cover w-full h-full gpu-accelerated`}
          onLoad={handleLoad}
          onError={handleError}
          // 性能优化属性
          decoding="async"
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
};