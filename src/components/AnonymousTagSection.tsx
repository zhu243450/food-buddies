import { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Sparkles, Check } from 'lucide-react';

const POSITIVE_TAGS = [
  { label: '很温柔', emoji: '🤗' },
  { label: '聊天很舒服', emoji: '💬' },
  { label: '很有趣', emoji: '😄' },
  { label: '有品味', emoji: '✨' },
  { label: '很靠谱', emoji: '👍' },
  { label: '超热情', emoji: '🔥' },
  { label: '很幽默', emoji: '😂' },
  { label: '很体贴', emoji: '💛' },
  { label: '安静舒适', emoji: '🍃' },
  { label: '有故事', emoji: '📖' },
];

interface AnonymousTagSectionProps {
  dinnerId: string;
  userId?: string;
}

export const AnonymousTagSection = memo<AnonymousTagSectionProps>(({ dinnerId, userId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dinnerCompleted, setDinnerCompleted] = useState(false);
  const [reviewableUsers, setReviewableUsers] = useState<{ user_id: string; nickname: string }[]>([]);
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [myTags, setMyTags] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!dinnerId || !user) return;

    // Check if dinner completed
    const { data: dinner } = await supabase
      .from('dinners')
      .select('dinner_time, created_by')
      .eq('id', dinnerId)
      .single();

    if (!dinner || new Date(dinner.dinner_time) >= new Date()) return;
    setDinnerCompleted(true);

    // Get participants
    const { data: parts } = await supabase
      .from('dinner_participants')
      .select('user_id')
      .eq('dinner_id', dinnerId);

    const userIds = new Set<string>();
    parts?.forEach(p => userIds.add(p.user_id));
    userIds.add(dinner.created_by);
    userIds.delete(user.id);

    if (userIds.size === 0) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname')
      .in('user_id', Array.from(userIds));

    setReviewableUsers(profiles || []);

    // Check existing tags from me
    const { data: existingTags } = await supabase
      .from('anonymous_tags')
      .select('reviewed_user_id, tags')
      .eq('dinner_id', dinnerId)
      .eq('reviewer_id', user.id);

    if (existingTags) {
      const tagMap: Record<string, string[]> = {};
      existingTags.forEach(t => { tagMap[t.reviewed_user_id] = t.tags; });
      setMyTags(tagMap);
    }
  }, [dinnerId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!user || !activeUser || selectedTags.length === 0) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('anonymous_tags')
        .insert({
          dinner_id: dinnerId,
          reviewer_id: user.id,
          reviewed_user_id: activeUser,
          tags: selectedTags,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: '已经评价过了', variant: 'destructive' });
        } else throw error;
      } else {
        toast({ title: '✨ 标签已匿名发送！+5积分' });
        setMyTags(prev => ({ ...prev, [activeUser]: selectedTags }));
        setActiveUser(null);
        setSelectedTags([]);
      }
    } catch (err: any) {
      toast({ title: '发送失败', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!dinnerCompleted || !userId) return null;

  const untaggedUsers = reviewableUsers.filter(u => !myTags[u.user_id]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-500" />
        匿名暖心标签
        <Badge variant="secondary" className="text-xs">匿名 · +5积分</Badge>
      </h3>

      {untaggedUsers.length > 0 && (
        <Card className="border-pink-200/50 bg-gradient-to-br from-pink-50/50 to-orange-50/50 dark:from-pink-950/20 dark:to-orange-950/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              💌 匿名给饭友贴个暖心标签吧！对方只能看到标签，不知道是谁给的
            </p>
            <div className="flex flex-wrap gap-2">
              {untaggedUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => { setActiveUser(u.user_id); setSelectedTags([]); }}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    activeUser === u.user_id
                      ? 'border-pink-400 bg-pink-100/50 dark:bg-pink-900/30'
                      : 'border-border/60 hover:border-pink-300'
                  }`}
                >
                  {u.nickname}
                </button>
              ))}
            </div>

            {activeUser && (
              <div className="space-y-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">选择标签（可多选）：</p>
                <div className="flex flex-wrap gap-2">
                  {POSITIVE_TAGS.map(tag => (
                    <button
                      key={tag.label}
                      onClick={() => toggleTag(tag.label)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selectedTags.includes(tag.label)
                          ? 'border-pink-400 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 scale-105'
                          : 'border-border/60 hover:border-pink-300 text-muted-foreground'
                      }`}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedTags.length === 0 || submitting}
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:from-pink-600 hover:to-orange-500"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {submitting ? '发送中...' : `匿名发送 (${selectedTags.length})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Already tagged users */}
      {Object.keys(myTags).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3" /> 已发送的标签
          </p>
          {Object.entries(myTags).map(([uid, tags]) => {
            const profile = reviewableUsers.find(u => u.user_id === uid);
            return (
              <div key={uid} className="flex items-center gap-2 flex-wrap p-2 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{profile?.nickname || '用户'}</span>
                <span className="text-xs text-muted-foreground">→</span>
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-pink-100/50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300">
                    {POSITIVE_TAGS.find(t => t.label === tag)?.emoji} {tag}
                  </Badge>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

AnonymousTagSection.displayName = 'AnonymousTagSection';
