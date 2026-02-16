import { useState, useEffect, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react';

const TAG_EMOJI_MAP: Record<string, string> = {
  '很温柔': '🤗', '聊天很舒服': '💬', '很有趣': '😄',
  '有品味': '✨', '很靠谱': '👍', '超热情': '🔥',
  '很幽默': '😂', '很体贴': '💛', '安静舒适': '🍃', '有故事': '📖',
};

interface ReceivedTagsDisplayProps {
  targetUserId: string;
}

export const ReceivedTagsDisplay = memo<ReceivedTagsDisplayProps>(({ targetUserId }) => {
  const { user } = useAuth();
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      
      // Query tags received by the target user
      // We don't select reviewer_id to maintain anonymity
      const { data } = await supabase
        .from('anonymous_tags')
        .select('tags')
        .eq('reviewed_user_id', targetUserId);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(row => {
          row.tags?.forEach((tag: string) => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        });
        setTagCounts(counts);
      }
    };

    fetchTags();
  }, [targetUserId, user]);

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]);

  if (sortedTags.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-500" />
        <h3 className="font-semibold text-foreground">饭友印象</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(([tag, count]) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-gradient-to-r from-pink-100/80 to-orange-100/80 dark:from-pink-900/30 dark:to-orange-900/30 text-pink-700 dark:text-pink-300 border-pink-200/50 dark:border-pink-800/50"
          >
            {TAG_EMOJI_MAP[tag] || '💫'} {tag}
            {count > 1 && (
              <span className="ml-1 text-xs opacity-70">×{count}</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
});

ReceivedTagsDisplay.displayName = 'ReceivedTagsDisplay';
