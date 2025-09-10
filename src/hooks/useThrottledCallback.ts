import { useCallback, useRef } from 'react';

export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastExecuted = useRef<number>(0);

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastExecuted.current > delay) {
        lastExecuted.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}