// 性能优化工具集

// 防抖函数 - 优化搜索和输入性能
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 节流函数 - 优化滚动和调整大小事件
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// 内存缓存 - 带TTL的缓存系统
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// 自动清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => memoryCache.cleanup(), 5 * 60 * 1000); // 每5分钟清理一次
}

// 批量操作优化 - 减少DOM操作次数
export const batchOperations = (operations: Array<() => void>): void => {
  // 使用 requestAnimationFrame 批量执行操作
  requestAnimationFrame(() => {
    operations.forEach(op => op());
  });
};

// 资源预加载 - 提前加载关键资源
export const preloadResource = (href: string, as: string): void => {
  if (typeof window === 'undefined') return;
  
  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'script') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
};

// 懒加载工具 - 使用IntersectionObserver
export const createLazyLoader = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  if (!window.IntersectionObserver) {
    // Fallback for browsers without IntersectionObserver
    return { observe: callback, disconnect: () => {} };
  }
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    options
  );
};

// 虚拟滚动优化 - 只渲染可见项目
export const calculateVisibleItems = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return { startIndex, endIndex };
};

// 性能监控
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.then(() => {
      const end = performance.now();
      console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    });
  } else {
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  }
};

// Web Workers工具 - 将重计算移到后台线程
export const createWebWorker = (workerFunction: () => void): Worker | null => {
  if (typeof Worker === 'undefined') return null;
  
  const workerScript = `
    self.onmessage = function(e) {
      const result = (${workerFunction.toString()}).call(null, e.data);
      self.postMessage(result);
    };
  `;
  
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};