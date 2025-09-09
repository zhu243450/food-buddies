import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { calculateVisibleItems } from '@/lib/performanceOptimizer';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export const VirtualList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = ''
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex } = useMemo(
    () => calculateVisibleItems(scrollTop, containerHeight, itemHeight, items.length, overscan),
    [scrollTop, containerHeight, itemHeight, items.length, overscan]
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';