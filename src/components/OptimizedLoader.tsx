import { memo } from 'react';

// 高性能统一加载组件
export const OptimizedLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="loading-spinner" />
  </div>
));

OptimizedLoader.displayName = 'OptimizedLoader';

// 页面级加载组件
export const PageLoader = memo(() => (
  <div className="flex items-center justify-center py-8">
    <div className="loading-spinner" />
  </div>
));

PageLoader.displayName = 'PageLoader';

// 卡片骨架屏
export const CardSkeleton = memo(() => (
  <div className="dinner-card-stable skeleton">
    <div className="p-4 space-y-3">
      <div className="h-4 skeleton rounded w-3/4" />
      <div className="h-3 skeleton rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-3 skeleton rounded w-2/3" />
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';