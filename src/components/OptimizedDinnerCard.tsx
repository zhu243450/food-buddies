import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Share2, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface Dinner {
  id: string;
  title: string;
  description: string | null;
  dinner_time: string;
  location: string | null;
  max_participants: number | null;
  dietary_preferences: string[] | null;
  alcohol_preference: string | null;
  split_method: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  mode: string | null;
  min_participants: number | null;
  registration_deadline: string | null;
  cancellation_policy: string | null;
  special_requirements: string | null;
}

interface OptimizedDinnerCardProps {
  dinner: Dinner;
  participantCount: number;
  isCreatedByUser: boolean;
  onShare?: (dinnerId: string) => void;
  onCancel?: (dinner: Dinner, event: React.MouseEvent) => void;
}

// 预计算格式化函数，避免重复计算
const formatDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const getModeIcon = (mode: string | undefined) => {
  switch (mode) {
    case 'public': return '🌍';
    case 'friends': return '👥';
    case 'private': return '🔒';
    default: return '🍽️';
  }
};

const getModeLabel = (mode: string | undefined, t: any) => {
  switch (mode) {
    case 'public': return t("dinner.mode.public");
    case 'friends': return t("dinner.mode.friends");
    case 'private': return t("dinner.mode.private");
    default: return t("dinner.mode.public");
  }
};

export const OptimizedDinnerCard = memo<OptimizedDinnerCardProps>(({ 
  dinner, 
  participantCount, 
  isCreatedByUser, 
  onShare, 
  onCancel 
}) => {
  const { t } = useTranslation();

  const formattedTime = formatDateTime(dinner.dinner_time);
  const modeIcon = getModeIcon(dinner.mode);
  const modeLabel = getModeLabel(dinner.mode, t);

  return (
    <Card className="dinner-card-stable contain-strict">
      <CardHeader className="pb-3" style={{ minHeight: '120px' }}>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            {modeIcon} {modeLabel}
          </Badge>
          {isCreatedByUser && (
            <div className="flex gap-1">
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare(dinner.id)}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => onCancel(dinner, e)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <CardTitle className="text-lg line-clamp-2" style={{ minHeight: '56px' }}>
          {dinner.title}
        </CardTitle>
        
        {dinner.description && (
          <p className="text-sm text-muted-foreground line-clamp-2" style={{ minHeight: '40px' }}>
            {dinner.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3" style={{ minHeight: '160px' }}>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="truncate">{formattedTime}</span>
        </div>
        
        {dinner.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{dinner.location}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 shrink-0" />
          <span>
            {participantCount}/{dinner.max_participants || '∞'} {t("dinner.participants")}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {dinner.dietary_preferences?.map((pref, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {pref}
            </Badge>
          ))}
          {dinner.alcohol_preference && (
            <Badge variant="outline" className="text-xs">
              {dinner.alcohol_preference === 'allowed' ? '🍷' : '🚫'} 
              {dinner.alcohol_preference === 'allowed' ? t("dinner.alcoholAllowed") : t("dinner.noAlcohol")}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedDinnerCard.displayName = 'OptimizedDinnerCard';