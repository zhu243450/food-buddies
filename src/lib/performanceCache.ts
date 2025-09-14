// 极简高性能缓存系统
class FastCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100; // 限制缓存大小

  set(key: string, data: any, ttlMinutes = 15): void {
    // 清理过期缓存
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60000
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const fastCache = new FastCache();

// 性能优化的防抖函数 - 更轻量级
export const fastDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 批量DOM操作优化
export const batchDOMUpdates = (updates: Array<() => void>): void => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};