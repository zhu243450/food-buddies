import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const OptimizedFoodGuideSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Hero Section Skeleton */}
      <section className="mb-12">
        <div className="h-12 bg-muted rounded-lg w-2/3 mb-4" />
        <div className="h-6 bg-muted rounded w-full mb-2" />
        <div className="h-6 bg-muted rounded w-3/4 mb-6" />
        
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex flex-wrap gap-3">
          <div className="h-10 bg-primary/20 rounded-lg w-32" />
          <div className="h-10 bg-muted rounded-lg w-28" />
        </div>
      </section>

      {/* Featured Restaurants Skeleton */}
      <section className="mb-12">
        <div className="h-8 bg-muted rounded w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
                <div className="flex flex-wrap gap-1">
                  <div className="h-6 bg-muted rounded w-12" />
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-14" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cuisine Guides Skeleton */}
      <section className="mb-12">
        <div className="h-8 bg-muted rounded w-1/3 mb-6" />
        
        {/* Tab headers */}
        <div className="flex gap-2 mb-6">
          <div className="h-10 bg-muted rounded w-20" />
          <div className="h-10 bg-muted rounded w-24" />
          <div className="h-10 bg-muted rounded w-18" />
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
          
          {/* Characteristics */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-muted rounded w-16" />
            <div className="h-6 bg-muted rounded w-20" />
            <div className="h-6 bg-muted rounded w-14" />
          </div>
          
          {/* Restaurants grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-3">
                  <div className="h-16 w-16 bg-muted rounded" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-1" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dining Tips Skeleton */}
      <section className="mb-12">
        <div className="h-8 bg-muted rounded w-1/4 mb-6" />
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-1">
                    <div className="h-4 w-4 bg-primary/30 rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-full mb-1" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};