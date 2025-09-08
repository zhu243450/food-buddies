// Image optimization utilities for better performance scores

export const generateImageSrcSet = (src: string, sizes: number[] = [400, 800, 1200]) => {
  if (!src) return '';
  
  // For external images, we can't generate different sizes, so return original
  if (src.startsWith('http')) {
    return src;
  }
  
  // Generate srcset for different screen densities
  return sizes.map(size => `${src}?w=${size} ${size}w`).join(', ');
};

export const generateImageSizes = (breakpoints: { [key: string]: string } = {
  '(max-width: 640px)': '100vw',
  '(max-width: 1024px)': '50vw',
  default: '33vw'
}) => {
  const entries = Object.entries(breakpoints);
  const mediaQueries = entries.slice(0, -1).map(([query, size]) => `${query} ${size}`);
  const defaultSize = breakpoints.default || '100vw';
  
  return [...mediaQueries, defaultSize].join(', ');
};

export const createOptimizedImageProps = (src: string, alt: string, options?: {
  priority?: boolean;
  sizes?: number[];
  breakpoints?: { [key: string]: string };
}) => {
  const { priority = false, sizes = [400, 800, 1200], breakpoints } = options || {};
  
  return {
    src,
    alt,
    loading: priority ? 'eager' as const : 'lazy' as const,
    decoding: 'async' as const,
    srcSet: generateImageSrcSet(src, sizes),
    sizes: generateImageSizes(breakpoints),
    style: { contentVisibility: 'auto' }
  };
};