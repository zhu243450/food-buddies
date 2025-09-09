import { useEffect } from 'react';
import { preloadResource } from '@/lib/performanceOptimizer';

interface PreloadResource {
  href: string;
  as: string;
  priority?: 'high' | 'low';
}

export const useResourcePreloader = (resources: PreloadResource[]) => {
  useEffect(() => {
    // 按优先级排序
    const sortedResources = resources.sort((a, b) => 
      (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1)
    );

    // 预加载高优先级资源
    const highPriorityResources = sortedResources.filter(r => r.priority === 'high');
    highPriorityResources.forEach(resource => {
      preloadResource(resource.href, resource.as);
    });

    // 延迟预加载低优先级资源
    const timer = setTimeout(() => {
      const lowPriorityResources = sortedResources.filter(r => r.priority !== 'high');
      lowPriorityResources.forEach(resource => {
        preloadResource(resource.href, resource.as);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [resources]);
};