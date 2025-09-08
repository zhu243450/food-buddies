import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  aspectRatio?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  aspectRatio 
}) => {
  return (
    <div 
      className={`bg-muted animate-pulse rounded-md ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || aspectRatio ? undefined : '1rem',
        aspectRatio: aspectRatio || 'auto'
      }}
    />
  );
};

export const RestaurantCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton height="200px" />
      <Skeleton width="60%" height="24px" />
      <Skeleton width="40%" height="20px" />
      <div className="flex justify-between items-center">
        <Skeleton width="30%" height="16px" />
        <Skeleton width="20%" height="16px" />
      </div>
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="text-center mb-12 space-y-4">
      <Skeleton height="48px" className="mx-auto w-96" />
      <Skeleton height="24px" className="mx-auto w-64" />
      <Skeleton height="40px" className="mx-auto w-48" />
      <div className="flex justify-center gap-4">
        <Skeleton width="120px" height="40px" />
        <Skeleton width="120px" height="40px" />
      </div>
    </div>
  );
};

export const TabsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex space-x-1 bg-muted p-1 rounded-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="40px" className="flex-1" />
        ))}
      </div>
      <Skeleton height="400px" />
    </div>
  );
};