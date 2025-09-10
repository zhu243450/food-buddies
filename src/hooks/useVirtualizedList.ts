import { useMemo } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  containerHeight: number;
  itemHeight: number;
  scrollTop: number;
}

export function useVirtualizedList<T>({ 
  items, 
  containerHeight, 
  itemHeight, 
  scrollTop 
}: VirtualizedListProps<T>) {
  return useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;
    const totalHeight = items.length * itemHeight;
    
    return {
      visibleItems,
      offsetY,
      totalHeight,
      startIndex,
      endIndex
    };
  }, [items, containerHeight, itemHeight, scrollTop]);
}