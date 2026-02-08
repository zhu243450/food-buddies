import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, Clock, Users2, CalendarDays, MapPin, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface FilterState {
  searchQuery: string;
  mode: string | null;
  timeRange: string | null;
  category: string | null;
}

interface DinnerSearchFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
}

const modeOptions = [
  { value: 'instant', icon: Zap, labelKey: 'dinner.instant', emoji: '⚡' },
  { value: 'scheduled', icon: Clock, labelKey: 'dinner.scheduled', emoji: '📅' },
  { value: 'group', icon: Users2, labelKey: 'dinner.group', emoji: '👥' },
];

const timeOptions = [
  { value: 'today', labelKey: 'filter.today', emoji: '📆' },
  { value: 'tomorrow', labelKey: 'filter.tomorrow', emoji: '🗓️' },
  { value: 'weekend', labelKey: 'filter.weekend', emoji: '🎉' },
  { value: 'thisWeek', labelKey: 'filter.thisWeek', emoji: '📋' },
];

const categoryOptions = [
  { value: 'business', labelKey: 'dinnerCategory.business', emoji: '🤝' },
  { value: 'friends', labelKey: 'dinnerCategory.friends', emoji: '🎉' },
  { value: 'meetup', labelKey: 'dinnerCategory.meetup', emoji: '🆕' },
  { value: 'celebration', labelKey: 'dinnerCategory.celebration', emoji: '🎂' },
  { value: 'foodie', labelKey: 'dinnerCategory.foodie', emoji: '🍜' },
  { value: 'family', labelKey: 'dinnerCategory.family', emoji: '🏠' },
  { value: 'themed', labelKey: 'dinnerCategory.themed', emoji: '🎮' },
];

export const DinnerSearchFilter = memo<DinnerSearchFilterProps>(({ filters, onFiltersChange, resultCount }) => {
  const { t } = useTranslation();

  const activeFilterCount = [filters.mode, filters.timeRange, filters.searchQuery, filters.category].filter(Boolean).length;

  const toggleMode = (mode: string) => {
    onFiltersChange({ ...filters, mode: filters.mode === mode ? null : mode });
  };

  const toggleTime = (time: string) => {
    onFiltersChange({ ...filters, timeRange: filters.timeRange === time ? null : time });
  };

  const toggleCategory = (category: string) => {
    onFiltersChange({ ...filters, category: filters.category === category ? null : category });
  };

  const clearAll = () => {
    onFiltersChange({ searchQuery: '', mode: null, timeRange: null, category: null });
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('discover.searchPlaceholder', '搜索饭局标题、地点...')}
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="pl-10 h-11 rounded-xl bg-card border-border/60 focus:border-primary"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter chips - scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* Mode filters */}
        {modeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleMode(opt.value)}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filters.mode === opt.value
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {opt.emoji} {t(opt.labelKey)}
          </button>
        ))}

        <div className="w-px h-6 bg-border/50 flex-shrink-0 self-center" />

        {/* Time filters */}
        {timeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleTime(opt.value)}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filters.timeRange === opt.value
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {opt.emoji} {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Category filter chips - scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categoryOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleCategory(opt.value)}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filters.category === opt.value
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {opt.emoji} {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Active filter summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t('dinner.filtersApplied', { count: activeFilterCount, found: resultCount })}
          </span>
          <button onClick={clearAll} className="text-primary hover:underline font-medium">
            {t('common.clear')}
          </button>
        </div>
      )}
    </div>
  );
});

DinnerSearchFilter.displayName = 'DinnerSearchFilter';
