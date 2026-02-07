import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserCheck, UserX, Users, Clock, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFriendship } from '@/hooks/useFriendship';
import { useNavigate } from 'react-router-dom';

// Friend action button for user profiles
export const FriendActionButton = memo<{ targetUserId: string }>(({ targetUserId }) => {
  const { t } = useTranslation();
  const { friendshipStatus, loading, sendFriendRequest, removeFriend } = useFriendship(targetUserId);

  if (friendshipStatus === 'accepted') {
    return (
      <Button variant="outline" size="sm" onClick={() => removeFriend()} disabled={loading} className="gap-1.5">
        <UserCheck className="w-4 h-4" />
        {t('friends.isFriend', '已是好友')}
      </Button>
    );
  }

  if (friendshipStatus === 'pending') {
    return (
      <Button variant="secondary" size="sm" disabled className="gap-1.5">
        <Clock className="w-4 h-4" />
        {t('friends.pending', '等待确认')}
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={sendFriendRequest} disabled={loading} className="gap-1.5 bg-gradient-primary text-primary-foreground hover:opacity-90">
      <UserPlus className="w-4 h-4" />
      {t('friends.addFriend', '加好友')}
    </Button>
  );
});
FriendActionButton.displayName = 'FriendActionButton';

// Pending friend requests card
export const PendingRequestsCard = memo(() => {
  const { t } = useTranslation();
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest, loading } = useFriendship();
  const navigate = useNavigate();

  if (pendingRequests.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          {t('friends.pendingRequests', '好友请求')}
          <Badge className="bg-primary text-primary-foreground text-xs">{pendingRequests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.map((req) => (
          <div key={req.id} className="flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={() => navigate(`/user/${req.profile.user_id}`)}
            >
              <Avatar className="w-8 h-8">
                {req.profile.avatar_url && <AvatarImage src={req.profile.avatar_url} />}
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {req.profile.nickname[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{req.profile.nickname}</span>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="default" onClick={() => acceptFriendRequest(req.id)} disabled={loading} className="h-7 px-2 bg-gradient-primary text-primary-foreground">
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => rejectFriendRequest(req.id)} disabled={loading} className="h-7 px-2">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
PendingRequestsCard.displayName = 'PendingRequestsCard';

// Friends list card
export const FriendsListCard = memo(() => {
  const { t } = useTranslation();
  const { friends, friendCount } = useFriendship();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {t('friends.myFriends', '我的好友')}
          <Badge variant="secondary" className="text-xs">{friendCount}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('friends.noFriends', '还没有好友，去发现页找饭友吧！')}
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {friends.map((friend) => (
              <div
                key={friend.user_id}
                className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80"
                onClick={() => navigate(`/user/${friend.user_id}`)}
              >
                <Avatar className="w-10 h-10">
                  {friend.avatar_url && <AvatarImage src={friend.avatar_url} />}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {friend.nickname[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {friend.nickname}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
FriendsListCard.displayName = 'FriendsListCard';
