import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserRewards } from '@/hooks/useUserRewards';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AchievementsCardProps {
  userId?: string;
}

const badgeColors: Record<string, string> = {
  bronze: 'bg-amber-600/20 text-amber-700 border-amber-600/30',
  silver: 'bg-slate-300/30 text-slate-600 border-slate-400/30',
  gold: 'bg-yellow-400/20 text-yellow-700 border-yellow-500/30',
  diamond: 'bg-cyan-400/20 text-cyan-700 border-cyan-500/30'
};

const categoryLabels: Record<string, { zh: string; en: string }> = {
  invite: { zh: '邀请成就', en: 'Invite Achievements' },
  dinner: { zh: '饭局成就', en: 'Dinner Achievements' },
  social: { zh: '社交成就', en: 'Social Achievements' },
  milestone: { zh: '里程碑', en: 'Milestones' }
};

export function AchievementsCard({ userId }: AchievementsCardProps) {
  const { i18n } = useTranslation();
  const { achievements, rewards } = useUserRewards(userId);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('invite');

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // 按类别分组
  const groupedAchievements = achievements.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {i18n.language === 'zh' ? '我的成就' : 'My Achievements'}
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-sm">
                {categoryLabels[category]?.[i18n.language === 'zh' ? 'zh' : 'en'] || category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {categoryAchievements.filter(a => a.unlocked).length}/{categoryAchievements.length}
                </span>
                {expandedCategory === category ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>
            
            {expandedCategory === category && (
              <div className="p-3 space-y-2">
                {categoryAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      achievement.unlocked 
                        ? badgeColors[achievement.badge_color] 
                        : "bg-muted/20 text-muted-foreground opacity-60"
                    )}
                  >
                    <div className="text-2xl flex-shrink-0">
                      {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        !achievement.unlocked && "text-muted-foreground"
                      )}>
                        {i18n.language === 'zh' ? achievement.name : (achievement.name_en || achievement.name)}
                      </p>
                      <p className="text-xs opacity-70 line-clamp-1">
                        {i18n.language === 'zh' ? achievement.description : (achievement.description_en || achievement.description)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {achievement.points_reward > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{achievement.points_reward}
                        </Badge>
                      )}
                      {achievement.unlocked && (
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
