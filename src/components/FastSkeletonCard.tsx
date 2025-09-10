import { memo } from "react";

export const FastSkeletonCard = memo(() => (
  <div className="bg-card rounded-lg border p-4 animate-pulse">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 bg-muted rounded"></div>
        <div className="h-4 w-8 bg-muted rounded"></div>
      </div>
      <div className="h-5 w-3/4 bg-muted rounded"></div>
      <div className="h-3 w-full bg-muted rounded"></div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded"></div>
        <div className="h-4 w-full bg-muted rounded"></div>
        <div className="h-4 w-2/3 bg-muted rounded"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-12 bg-muted rounded"></div>
        <div className="h-6 w-12 bg-muted rounded"></div>
      </div>
    </div>
  </div>
));

FastSkeletonCard.displayName = 'FastSkeletonCard';