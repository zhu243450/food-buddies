// 高性能图片优化工具 - 针对PageSpeed优化

// WebP支持检测
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
})();

// 生成高性能的srcset
export const generateImageSrcSet = (src: string, sizes: number[] = [320, 480, 640, 800, 1200, 1600]) => {
  if (!src) return '';
  
  // 外部图片直接返回
  if (src.startsWith('http')) {
    return src;
  }
  
  // 生成多种尺寸的srcset，包含WebP格式
  const webpSizes = supportsWebP ? sizes.map(size => `${src}?w=${size}&f=webp ${size}w`).join(', ') : '';
  const fallbackSizes = sizes.map(size => `${src}?w=${size}&q=85 ${size}w`).join(', ');
  
  return webpSizes || fallbackSizes;
};

// 优化的尺寸生成，更精确的断点
export const generateImageSizes = (breakpoints: { [key: string]: string } = {
  '(max-width: 320px)': '100vw',
  '(max-width: 480px)': '100vw', 
  '(max-width: 640px)': '100vw',
  '(max-width: 768px)': '100vw',
  '(max-width: 1024px)': '50vw',
  '(max-width: 1280px)': '33vw',
  default: '25vw'
}) => {
  const entries = Object.entries(breakpoints);
  const mediaQueries = entries.slice(0, -1).map(([query, size]) => `${query} ${size}`);
  const defaultSize = breakpoints.default || '100vw';
  
  return [...mediaQueries, defaultSize].join(', ');
};

// 高性能图片属性生成
export const createOptimizedImageProps = (src: string, alt: string, options?: {
  priority?: boolean;
  sizes?: number[];
  breakpoints?: { [key: string]: string };
  aspectRatio?: string;
}) => {
  const { 
    priority = false, 
    sizes = [320, 480, 640, 800, 1200], 
    breakpoints,
    aspectRatio 
  } = options || {};
  
  return {
    src: supportsWebP && !src.startsWith('http') ? `${src}?f=webp&q=85` : src,
    alt,
    loading: priority ? 'eager' as const : 'lazy' as const,
    decoding: 'async' as const,
    srcSet: generateImageSrcSet(src, sizes),
    sizes: generateImageSizes(breakpoints),
    style: { 
      contentVisibility: 'auto',
      aspectRatio: aspectRatio || 'auto',
      objectFit: 'cover' as const
    },
    // 添加性能提示
    fetchPriority: priority ? 'high' as const : 'auto' as const
  };
};

// 图片预加载函数 - 对关键图片进行预加载
export const preloadImage = (src: string, priority: boolean = false) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = supportsWebP && !src.startsWith('http') ? `${src}?f=webp&q=85` : src;
  
  if (priority) {
    link.setAttribute('fetchpriority', 'high');
  }
  
  document.head.appendChild(link);
};

// 虚拟滚动优化的图片组件属性
export const createVirtualImageProps = (src: string, alt: string, isVisible: boolean) => {
  if (!isVisible) {
    // 未在视窗内时使用占位符
    return {
      src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
      alt: '',
      loading: 'lazy' as const,
      style: { backgroundColor: 'hsl(var(--muted))' }
    };
  }
  
  return createOptimizedImageProps(src, alt, { priority: false });
};