import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  componentMountTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const componentMountTime = Date.now() - mountTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        componentMountTime: `${componentMountTime}ms`,
        renderTime: `${Date.now() - renderStartTime.current}ms`
      });
    }

    // Report to analytics in production (if needed)
    if (process.env.NODE_ENV === 'production' && componentMountTime > 1000) {
      // Report slow component mounts
      console.warn(`[Performance Warning] ${componentName} took ${componentMountTime}ms to mount`);
    }
  }, [componentName]);

  const markRenderStart = () => {
    renderStartTime.current = Date.now();
  };

  const markRenderEnd = () => {
    const renderTime = Date.now() - renderStartTime.current;
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.log(`[Performance] ${componentName} render: ${renderTime}ms`);
    }
  };

  return { markRenderStart, markRenderEnd };
};