import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  componentMountTime: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const mountTime = useRef<number>();
  const renderStartTime = useRef<number>();

  useEffect(() => {
    if (!mountTime.current) {
      mountTime.current = performance.now();
    }
    
    const componentMountTime = performance.now() - mountTime.current;
    
    // Only log if development and reasonable time
    if (process.env.NODE_ENV === 'development' && componentMountTime < 10000) {
      console.log(`[Performance] ${componentName} mounted in ${componentMountTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  const markRenderStart = () => {
    renderStartTime.current = performance.now();
  };

  const markRenderEnd = () => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.log(`[Performance] ${componentName} render: ${renderTime.toFixed(2)}ms`);
      }
    }
  };

  return { markRenderStart, markRenderEnd };
};