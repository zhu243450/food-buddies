import { useEffect } from 'react';

// 生产环境性能监控
export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    if (import.meta.env.PROD && 'performance' in window) {
      let observer: PerformanceObserver | null = null;
      
      try {
        observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const value = (entry as any).value || (entry as any).duration || 0;
            
            if (import.meta.env.DEV || window.location.search.includes('debug=perf')) {
              console.log(`[Performance] ${entry.name}: ${value.toFixed(2)}ms`);
            }
            
            if (entry.name === 'FCP' && value && value > 2500) {
              // FCP超过2.5秒，可以发送警报
            }
          });
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      } catch (e) {
        // 降级处理，某些浏览器可能不支持所有指标
        console.warn('PerformanceObserver not supported:', e);
      }

      return () => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      };
    }
  }, []);

  return null;
};