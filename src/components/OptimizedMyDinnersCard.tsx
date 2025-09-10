import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Users2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import ShareDinner from "./ShareDinner";

interface Dinner {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  dinner_time: string;
  location: string;
  max_participants: number;
  food_preferences?: string[];
  friends_only?: boolean;
  dinner_mode?: string;
  urgency_level?: string;
  gender_preference?: string;
  personality_tags?: string[];
  dietary_restrictions?: string[];
  created_at: string;
  updated_at: string;
  status?: string;
}

interface OptimizedMyDinnersCardProps {
  dinner: Dinner;
  participantCount: number;
  userId?: string;
  onCancel: (dinner: Dinner, event: React.MouseEvent) => void;
  onClick: () => void;
}

// 预计算格式化函数，避免重复计算
const formatDateTime = (dateString: string, language: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getModeIcon = (mode: string | undefined): string => {
  switch (mode) {
    case 'instant': return '🔥';
    case 'scheduled': return '📅';
    case 'group': return '👥';
    default: return '🔥';
  }
};

const getModeLabel = (mode: string | undefined, t: any): string => {
  switch (mode) {
    case 'instant': return t('dinner.instant');
    case 'scheduled': return t('dinner.scheduled');
    case 'group': return t('dinner.group');
    default: return t('dinner.instant');
  }
};

export const OptimizedMyDinnersCard = memo<OptimizedMyDinnersCardProps>(({ 
  dinner, 
  participantCount, 
  userId,
  onCancel,
  onClick 
}) => {
  const { t, i18n } = useTranslation();

  // 预计算所有值，避免每次渲染重复计算
  const computedValues = useMemo(() => {
    const isCreatedByMe = dinner.created_by === userId;
    const totalParticipants = participantCount + 1;
    const canCancel = (dinner as any).status === 'active' || !(dinner as any).status;
    const formattedTime = formatDateTime(dinner.dinner_time, i18n.language);
    const modeIcon = getModeIcon(dinner.dinner_mode);
    const modeLabel = getModeLabel(dinner.dinner_mode, t);
    const isFull = totalParticipants >= dinner.max_participants;
    const truncatedDescription = dinner.description && dinner.description.length > 50 
      ? dinner.description.substring(0, 50) + "..."
      : dinner.description;

    return {
      isCreatedByMe,
      totalParticipants,
      canCancel,
      formattedTime,
      modeIcon,
      modeLabel,
      isFull,
      truncatedDescription
    };
  }, [dinner, participantCount, userId, i18n.language, t]);

  // 预计算样式类名
  const cardClassName = `dinner-card-stable cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 shadow-md bg-gradient-to-br from-card to-accent/5 relative group overflow-hidden rounded-lg border`;
  
  return (
    <div className={cardClassName}>
      <div onClick={onClick}>
        {computedValues.canCancel && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive hover:text-white text-destructive h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(dinner, e);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="pb-2 flex flex-col space-y-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
              {computedValues.modeIcon} {computedValues.modeLabel}
            </Badge>
            {computedValues.isCreatedByMe && participantCount > 0 && (
              <Badge className="bg-primary text-primary-foreground border-primary/30 text-xs font-bold animate-pulse">
                {participantCount}
              </Badge>
            )}
          </div>
          
          <h3 className="text-base font-bold text-foreground line-clamp-2 leading-tight mb-2">
            {dinner.title}
          </h3>
          
          {computedValues.truncatedDescription && (
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {computedValues.truncatedDescription}
            </p>
          )}
        </div>
        
        <div className="space-y-3 p-4 pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/10 p-2 rounded">
            <CalendarDays className="w-3 h-3 text-primary shrink-0" />
            <span className="font-medium truncate">{computedValues.formattedTime}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/10 p-2 rounded">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="font-medium truncate">{dinner.location}</span>
          </div>
          
          <div className={`flex items-center gap-2 text-xs text-muted-foreground p-2 rounded ${
            participantCount > 0 ? 'bg-primary/20 border border-primary/30' : 'bg-primary/10'
          }`}>
            <Users className="w-3 h-3 text-primary shrink-0" />
            <span className={`font-bold ${participantCount > 0 ? 'text-primary' : 'text-primary'}`}>
              {computedValues.totalParticipants}/{dinner.max_participants}
            </span>
            {computedValues.isFull && (
              <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive ml-auto">
                满
              </Badge>
            )}
          </div>

          {dinner.food_preferences && dinner.food_preferences.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dinner.food_preferences.slice(0, 2).map((preference) => (
                <Badge 
                  key={preference} 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30"
                >
                  {preference}
                </Badge>
              ))}
              {dinner.food_preferences.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{dinner.food_preferences.length - 2}
                </Badge>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1 items-center">
            {dinner.personality_tags && dinner.personality_tags.length > 0 && (
              dinner.personality_tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-xs bg-accent/10 text-accent border-accent/30"
                >
                  #{tag}
                </Badge>
              ))
            )}
            
            {dinner.gender_preference && dinner.gender_preference !== 'no_preference' && (
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                <Users2 className="w-3 h-3 mr-1" />
                {dinner.gender_preference === 'same_gender' ? '同性' : '异性'}
              </Badge>
            )}

            {dinner.friends_only && (
              <Badge variant="outline" className="text-xs border-accent text-accent">
                仅好友
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedMyDinnersCard.displayName = 'OptimizedMyDinnersCard';