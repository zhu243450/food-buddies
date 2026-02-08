import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, MapPin, Users, Zap, Clock, Users2, Lock, Sparkles } from "lucide-react";
import { useTranslation } from 'react-i18next';
import type { Dinner } from '@/types/database';
import type { MatchReason } from '@/hooks/useRecommendation';

// Food preference to emoji mapping
const foodEmojiMap: Record<string, string> = {
  '川菜': '🌶️', '火锅': '🫕', '粤菜': '🥢', '日料': '🍣',
  '韩餐': '🥘', '西餐': '🍝', '素食': '🥗', '烧烤': '🍖',
  '海鲜': '🦐', '面食': '🍜', '甜品': '🍰', '小吃': '🥟',
  'Sichuan': '🌶️', 'Hotpot': '🫕', 'Cantonese': '🥢', 'Japanese': '🍣',
  'Korean': '🥘', 'Western': '🍝', 'Vegetarian': '🥗', 'BBQ': '🍖',
  'Seafood': '🦐', 'Noodles': '🍜', 'Dessert': '🍰', 'Snacks': '🥟',
};

const getFoodEmoji = (pref: string) => foodEmojiMap[pref] || '🍽️';

interface CreatorProfile {
  nickname: string;
  avatar_url: string | null;
}

interface EnhancedDinnerCardProps {
  dinner: Dinner;
  participantCount: number;
  isJoined: boolean;
  isCreator: boolean;
  isFull: boolean;
  hasExpired: boolean;
  creatorProfile?: CreatorProfile | null;
  matchScore?: number;
  matchReasons?: MatchReason[];
  onJoin: (dinnerId: string) => void;
  onLeave: (dinnerId: string) => void;
  onClick: () => void;
  userId?: string;
}

const getTimeLabel = (dinnerTime: string, t: any): { label: string; isUrgent: boolean } => {
  const now = new Date();
  const time = new Date(dinnerTime);
  const diffMs = time.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) return { label: t('dinner.expiredBadge'), isUrgent: false };
  if (diffHours < 1) return { label: `${Math.round(diffHours * 60)}min`, isUrgent: true };
  if (diffHours < 3) return { label: `${Math.round(diffHours)}h`, isUrgent: true };
  
  const isToday = time.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = time.toDateString() === tomorrow.toDateString();
  
  if (isToday) return { label: t('filter.today', '今天') + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUrgent: false };
  if (isTomorrow) return { label: t('filter.tomorrow', '明天') + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUrgent: false };
  
  return { label: time.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), isUrgent: false };
};

const getModeConfig = (mode: string | undefined) => {
  switch (mode) {
    case 'instant': return { icon: Zap, label: '⚡', colorClass: 'bg-accent/15 text-accent border-accent/30' };
    case 'group': return { icon: Users2, label: '👥', colorClass: 'bg-secondary/15 text-secondary border-secondary/30' };
    case 'scheduled': return { icon: Clock, label: '📅', colorClass: 'bg-primary/15 text-primary border-primary/30' };
    default: return { icon: Clock, label: '🍽️', colorClass: 'bg-muted text-muted-foreground border-border' };
  }
};

const categoryConfig: Record<string, { emoji: string; labelKey: string }> = {
  business: { emoji: '🤝', labelKey: 'dinnerCategory.business' },
  friends: { emoji: '🎉', labelKey: 'dinnerCategory.friends' },
  meetup: { emoji: '🆕', labelKey: 'dinnerCategory.meetup' },
  celebration: { emoji: '🎂', labelKey: 'dinnerCategory.celebration' },
  foodie: { emoji: '🍜', labelKey: 'dinnerCategory.foodie' },
  family: { emoji: '🏠', labelKey: 'dinnerCategory.family' },
  themed: { emoji: '🎮', labelKey: 'dinnerCategory.themed' },
};

const getMatchScoreConfig = (score: number | undefined) => {
  if (score === undefined || score <= 0) return null;
  if (score >= 70) return { emoji: '🔥', colorClass: 'bg-destructive/10 text-destructive border-destructive/30', label: 'excellent' };
  if (score >= 40) return { emoji: '✨', colorClass: 'bg-accent/10 text-accent border-accent/30', label: 'good' };
  return { emoji: '💡', colorClass: 'bg-muted text-muted-foreground border-border', label: 'fair' };
};

export const EnhancedDinnerCard = memo<EnhancedDinnerCardProps>(({
  dinner, participantCount, isJoined, isCreator, isFull, hasExpired,
  creatorProfile, matchScore, matchReasons, onJoin, onLeave, onClick, userId
}) => {
  const { t } = useTranslation();
  const timeInfo = getTimeLabel(dinner.dinner_time, t);
  const modeConfig = getModeConfig(dinner.dinner_mode);
  const fillPercent = Math.min((participantCount / dinner.max_participants) * 100, 100);
  const primaryFood = dinner.food_preferences?.[0];
  const scoreConfig = getMatchScoreConfig(matchScore);
  const dinnerCategory = (dinner as any).dinner_category;
  const catConfig = dinnerCategory ? categoryConfig[dinnerCategory] : null;

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onJoin(dinner.id);
  };
  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onLeave(dinner.id);
  };

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/60 hover:border-primary/40"
      onClick={onClick}
    >
      {/* Top accent bar - enhanced for high match */}
      <div className={`h-1 w-full ${scoreConfig && matchScore && matchScore >= 70 ? 'bg-gradient-to-r from-destructive via-accent to-primary' : 'bg-gradient-primary'}`} />

      {/* Match score badge */}
      {scoreConfig && matchScore && matchScore > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${scoreConfig.colorClass}`}>
            <Sparkles className="w-3 h-3" />
            {t('recommend.match', '匹配')} {matchScore}%
          </div>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Row 1: Mode + Time + Status badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${modeConfig.colorClass}`}>
            {modeConfig.label} {t(`dinner.${dinner.dinner_mode || 'scheduled'}`)}
            </Badge>
            {catConfig && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/50 text-foreground border-border/60">
                {catConfig.emoji} {t(catConfig.labelKey)}
              </Badge>
            )}
            {timeInfo.isUrgent && (
              <Badge className="text-xs px-2 py-0.5 bg-destructive/15 text-destructive border border-destructive/30 animate-pulse">
                🔥 {timeInfo.label}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {isJoined && <Badge className="text-xs bg-primary text-primary-foreground">{t('dinner.joined')}</Badge>}
            {isFull && <Badge variant="destructive" className="text-xs">{t('dinner.full')}</Badge>}
            {hasExpired && <Badge variant="secondary" className="text-xs">{t('dinner.expiredBadge')}</Badge>}
            {dinner.friends_only && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>

        {/* Row 2: Title with food emoji */}
        <div className="flex items-start gap-2">
          {primaryFood && (
            <span className="text-2xl flex-shrink-0 mt-0.5">{getFoodEmoji(primaryFood)}</span>
          )}
          <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {dinner.title}
          </h3>
        </div>

        {/* Row 3: Description */}
        {dinner.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{dinner.description}</p>
        )}

        {/* Row 4: Time + Location */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span className="truncate text-xs">{timeInfo.label}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
            <span className="truncate text-xs">{dinner.location}</span>
          </div>
        </div>

        {/* Row 5: Participant progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{participantCount}/{dinner.max_participants} {t('dinnerDetail.people')}</span>
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(fillPercent)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Row 6: Food tags */}
        {dinner.food_preferences && dinner.food_preferences.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dinner.food_preferences.slice(0, 4).map((pref, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {getFoodEmoji(pref)} {pref}
              </span>
            ))}
            {dinner.food_preferences.length > 4 && (
              <span className="text-xs text-muted-foreground">+{dinner.food_preferences.length - 4}</span>
            )}
          </div>
        )}

        {/* Row 6.5: Match reasons */}
        {matchReasons && matchReasons.length > 0 && matchScore && matchScore > 0 && (
          <div className="flex flex-wrap gap-1">
            {matchReasons.map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20"
              >
                {reason.emoji} {t('recommend.because', '因为你喜欢')} {reason.label}
              </span>
            ))}
          </div>
        )}

        {/* Row 7: Creator + Action */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              {creatorProfile?.avatar_url && <AvatarImage src={creatorProfile.avatar_url} />}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {(creatorProfile?.nickname || '?')[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
              {creatorProfile?.nickname || t('dinnerDetail.anonymous')}
            </span>
            {isCreator && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {t('dinnerDetail.creator')}
              </Badge>
            )}
          </div>
          {userId && !hasExpired && (
            isJoined ? (
              <Button variant="outline" size="sm" onClick={handleLeaveClick} className="h-7 text-xs px-3">
                {t('dinner.leave')}
              </Button>
            ) : !isFull ? (
              <Button size="sm" onClick={handleJoinClick} className="h-7 text-xs px-3 bg-gradient-primary text-primary-foreground hover:opacity-90">
                {t('dinner.join')}
              </Button>
            ) : null
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EnhancedDinnerCard.displayName = 'EnhancedDinnerCard';
