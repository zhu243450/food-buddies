import React, { memo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChefHat, MapPin, Users, Utensils } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

// 懒加载RegionSelector
const RegionSelector = React.lazy(() => import('@/components/RegionSelector').then(m => ({ default: m.RegionSelector })));

interface Division {
  id: string;
  name: string;
  level: 'province' | 'city' | 'county' | 'town';
}

interface RegionHeroProps {
  currentRegionName: string;
  regionDescription: string;
  regionPath: Division[];
  selectedDivisionId?: string;
  user: User | null;
  onRegionChange: (divisionId: string | null, divisionPath: Division[]) => void;
}

export const RegionHero = memo<RegionHeroProps>(({ 
  currentRegionName, 
  regionDescription, 
  regionPath, 
  selectedDivisionId, 
  user, 
  onRegionChange 
}) => {
  const { t } = useTranslation();

  return (
    <section className="text-center mb-12">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        <ChefHat className="inline-block h-10 w-10 mr-3 text-primary" />
        {currentRegionName} {t('foodGuide.title')}
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
        {regionDescription}
      </p>
      
      {/* Region Path Breadcrumb */}
      {regionPath.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {regionPath.map((division, index) => (
              <React.Fragment key={division.id}>
                <span>{division.name}</span>
                {index < regionPath.length - 1 && (
                  <span className="text-xs">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      
      {/* Region Selector with optimized lazy loading */}
      <div className="mb-8">
        <Suspense fallback={
          <div className="h-10 bg-muted animate-pulse rounded-md w-64 mx-auto" />
        }>
          <RegionSelector
            selectedDivisionId={selectedDivisionId}
            onSelectionChange={onRegionChange}
            placeholder={t('foodGuide.selectRegion')}
          />
        </Suspense>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {user ? (
          <>
            <Link to="/my-dinners">
              <Button size="lg" className="gap-2">
                <Users className="h-5 w-5" />
                {t('foodGuide.myDinners')}
              </Button>
            </Link>
            <Link to="/create-dinner">
              <Button variant="outline" size="lg" className="gap-2">
                <Utensils className="h-5 w-5" />
                {t('foodGuide.createDinner')}
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/auth">
              <Button size="lg">{t('foodGuide.registerNow')}</Button>
            </Link>
            <Link to="/discover">
              <Button variant="outline" size="lg">{t('foodGuide.browseDinners')}</Button>
            </Link>
          </>
        )}
      </div>
    </section>
  );
});

RegionHero.displayName = 'RegionHero';