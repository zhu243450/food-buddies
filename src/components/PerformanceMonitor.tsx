import { useEffect } from 'react';

// 生产环境性能监控
export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    if (import.meta.env.PROD && 'performance' in window) {
      // 监控关键性能指标
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // 类型安全的性能入口处理
          const value = (entry as any).value || (entry as any).duration || 0;
          
          // 只在开发环境或有debug标志时记录
          if (import.meta.env.DEV || window.location.search.includes('debug=perf')) {
            console.log(`[Performance] ${entry.name}: ${value.toFixed(2)}ms`);
          }
          
          // 在生产环境可以发送到分析服务
          if (entry.name === 'FCP' && value && value > 2500) {
            // FCP超过2.5秒，可以发送警报
          }
        });
      });

      // 监控核心指标
      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      } catch (e) {
        // 降级处理，某些浏览器可能不支持所有指标
      }

      return () => observer.disconnect();
    }
  }, []);

  return null;
};