import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// Request deduplication and smart caching
export const useQueryCache = () => {
  const queryClient = useQueryClient();

  const getFromCache = useCallback(<T>(key: string[]): T | undefined => {
    return queryClient.getQueryData<T>(key);
  }, [queryClient]);

  const setCache = useCallback(<T>(key: string[], data: T, staleTime?: number) => {
    queryClient.setQueryData(key, data);
    if (staleTime) {
      queryClient.setQueryDefaults(key, { staleTime });
    }
  }, [queryClient]);

  const invalidateCache = useCallback((key: string[]) => {
    queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient]);

  const prefetchQuery = useCallback(async (key: string[], fetcher: () => Promise<any>) => {
    const cached = getFromCache(key);
    if (!cached) {
      await queryClient.prefetchQuery({
        queryKey: key,
        queryFn: fetcher,
        staleTime: 1000 * 60 * 15, // 15 minutes
      });
    }
  }, [queryClient, getFromCache]);

  return {
    getFromCache,
    setCache,
    invalidateCache,
    prefetchQuery,
  };
};

// Singleton request deduplicator
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();