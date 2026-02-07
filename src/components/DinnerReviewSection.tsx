import { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDinnerReviews } from '@/hooks/useDinnerReviews';

interface DinnerReviewSectionProps {
  dinnerId: string;
  userId?: string;
}

const StarRating = ({ rating, onRate, interactive = true }: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
}) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => interactive && onRate?.(star)}
        className={`transition-all ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        disabled={!interactive}
      >
        <Star
          className={`w-5 h-5 ${
            star <= rating
              ? 'fill-accent text-accent'
              : 'fill-none text-muted-foreground/40'
          }`}
        />
      </button>
    ))}
  </div>
);

export const DinnerReviewSection = memo<DinnerReviewSectionProps>(({ dinnerId, userId }) => {
  const { t } = useTranslation();
  const {
    reviews,
    reviewableUsers,
    myReviews,
    loading,
    dinnerCompleted,
    submitReview,
  } = useDinnerReviews(dinnerId);

  const [activeReviewUser, setActiveReviewUser] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!dinnerCompleted || !userId) return null;

  const unreviewedUsers = reviewableUsers.filter(u => !myReviews[u.user_id]);

  const handleSubmit = async () => {
    if (!activeReviewUser || rating === 0) return;
    setSubmitting(true);
    const success = await submitReview(activeReviewUser, rating, comment);
    if (success) {
      setActiveReviewUser(null);
      setRating(0);
      setComment('');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Star className="w-5 h-5 text-accent" />
        {t('review.title', '饭后评价')}
      </h3>

      {/* Review form for unreviewed users */}
      {unreviewedUsers.length > 0 && (
        <Card className="border-accent/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('review.ratePrompt', '为饭友打个分吧！')}
            </p>
            <div className="flex flex-wrap gap-2">
              {unreviewedUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => {
                    setActiveReviewUser(u.user_id);
                    setRating(0);
                    setComment('');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    activeReviewUser === u.user_id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/60 hover:border-primary/40'
                  }`}
                >
                  <Avatar className="w-6 h-6">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="text-xs">{u.nickname[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{u.nickname}</span>
                </button>
              ))}
            </div>

            {activeReviewUser && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t('review.rating', '评分')}:</span>
                  <StarRating rating={rating} onRate={setRating} />
                </div>
                <Textarea
                  placeholder={t('review.commentPlaceholder', '写点什么吧（选填）...')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none h-20"
                  maxLength={200}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  size="sm"
                  className="bg-gradient-primary text-primary-foreground"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {submitting ? t('common.loading') : t('review.submit', '提交评价')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Already submitted reviews */}
      {Object.keys(myReviews).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('review.myReviews', '我的评价')}</p>
          {Object.values(myReviews).map(review => (
            <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="w-8 h-8">
                {review.reviewed_profile?.avatar_url && (
                  <AvatarImage src={review.reviewed_profile.avatar_url} />
                )}
                <AvatarFallback className="text-xs">
                  {review.reviewed_profile?.nickname?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{review.reviewed_profile?.nickname}</span>
                  <StarRating rating={review.rating} interactive={false} />
                </div>
                {review.comment && (
                  <p className="text-xs text-muted-foreground mt-1">{review.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews from others */}
      {reviews.filter(r => r.reviewer_id !== userId).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('review.otherReviews', '其他评价')}</p>
          {reviews
            .filter(r => r.reviewer_id !== userId)
            .map(review => (
              <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/40">
                <Avatar className="w-8 h-8">
                  {review.reviewer_profile?.avatar_url && (
                    <AvatarImage src={review.reviewer_profile.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs">
                    {review.reviewer_profile?.nickname?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{review.reviewer_profile?.nickname}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm">{review.reviewed_profile?.nickname}</span>
                    <StarRating rating={review.rating} interactive={false} />
                  </div>
                  {review.comment && (
                    <p className="text-xs text-muted-foreground mt-1">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {!loading && reviews.length === 0 && unreviewedUsers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('review.noReviews', '暂无评价')}
        </p>
      )}
    </div>
  );
});

DinnerReviewSection.displayName = 'DinnerReviewSection';
