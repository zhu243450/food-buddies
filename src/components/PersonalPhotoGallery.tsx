import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useDownload } from "@/hooks/useDownload";
import { Heart, MessageCircle, Send, X, User, MoreHorizontal, Trash2, Camera, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PersonalPhoto {
  id: string;
  photo_url: string;
  description: string;
  user_id: string;
  created_at: string;
  dinner_id?: string;
  dinners?: {
    id: string;
    title: string;
    dinner_time: string;
  };
}

interface PhotoLike {
  id: string;
  user_id: string;
  photo_id: string;
}

interface PhotoComment {
  id: string;
  photo_id: string;
  content: string;
  user_id: string;
  parent_comment_id?: string | null;
  created_at: string;
  profiles: {
    nickname: string;
    avatar_url?: string;
  };
}

interface PersonalPhotoGalleryProps {
  photos: PersonalPhoto[];
  currentUserId: string;
  onPhotoDeleted: () => void;
}

const PersonalPhotoGallery = ({ photos, currentUserId, onPhotoDeleted }: PersonalPhotoGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PersonalPhoto | null>(null);
  const [likes, setLikes] = useState<{ [photoId: string]: PhotoLike[] }>({});
  const [comments, setComments] = useState<{ [photoId: string]: PhotoComment[] }>({});
  const [newComment, setNewComment] = useState("");
  const [replyToComment, setReplyToComment] = useState<PhotoComment | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { downloadFile, downloading } = useDownload();

  // 获取点赞数据
  const fetchLikes = async (photoIds: string[]) => {
    if (photoIds.length === 0) return;
    
    const { data, error } = await supabase
      .from('photo_likes')
      .select('*')
      .in('photo_id', photoIds);

    if (!error && data) {
      const likesGrouped = data.reduce((acc, like) => {
        if (!acc[like.photo_id]) acc[like.photo_id] = [];
        acc[like.photo_id].push(like);
        return acc;
      }, {} as { [photoId: string]: PhotoLike[] });
      
      setLikes(likesGrouped);
    }
  };

  // 获取评论数据
  const fetchComments = async (photoIds: string[]) => {
    if (photoIds.length === 0) return;
    
    const { data, error } = await supabase
      .from('photo_comments')
      .select(`
        *,
        profiles!user_id(nickname, avatar_url)
      `)
      .in('photo_id', photoIds)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const commentsGrouped = data.reduce((acc, comment) => {
        if (!acc[comment.photo_id]) acc[comment.photo_id] = [];
        acc[comment.photo_id].push(comment);
        return acc;
      }, {} as { [photoId: string]: PhotoComment[] });
      
      setComments(commentsGrouped);
    }
  };

  // 处理点赞/取消点赞
  const handleLike = async (photoId: string) => {
    const userLike = likes[photoId]?.find(like => like.user_id === currentUserId);
    
    try {
      if (userLike) {
        // 取消点赞
        const { error } = await supabase
          .from('photo_likes')
          .delete()
          .eq('id', userLike.id);
          
        if (error) throw error;
        
        setLikes(prev => ({
          ...prev,
          [photoId]: prev[photoId]?.filter(like => like.id !== userLike.id) || []
        }));
      } else {
        // 点赞
        const { data, error } = await supabase
          .from('photo_likes')
          .insert({
            photo_id: photoId,
            user_id: currentUserId
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setLikes(prev => ({
          ...prev,
          [photoId]: [...(prev[photoId] || []), data]
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: t('photoGallery.operationFailed'),
        description: t('photoGallery.likeOperationFailed'),
        variant: "destructive",
      });
    }
  };

  // 提交评论/回复
  const handleSubmitComment = async (photoId: string, parentCommentId?: string) => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    
    try {
      const insertPayload: any = {
        photo_id: photoId,
        user_id: currentUserId,
        content: newComment.trim(),
      };
      if (parentCommentId) insertPayload.parent_comment_id = parentCommentId;

      const { data, error } = await supabase
        .from('photo_comments')
        .insert(insertPayload)
        .select(`
          *,
          profiles!user_id(nickname, avatar_url)
        `)
        .single();
        
      if (error) throw error;
      
      setComments(prev => ({
        ...prev,
        [photoId]: [...(prev[photoId] || []), data]
      }));
      
      setNewComment("");
      setReplyToComment(null);
      
      toast({
        title: t('photoGallery.commentSuccess'),
        description: parentCommentId ? t('photoGallery.replyPublished', '回复已发布') : t('photoGallery.commentPublished'),
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: t('photoGallery.commentFailed'),
        description: t('photoGallery.commentFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // 删除照片
  const handleDeletePhoto = async (photo: PersonalPhoto) => {
    try {
      // 删除存储文件
      const fileName = photo.photo_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('dinner-photos')
          .remove([`${currentUserId}/${fileName}`]);
      }

      // 删除数据库记录
      const { error } = await supabase
        .from('dinner_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      setSelectedPhoto(null);
      onPhotoDeleted();
      
      toast({
        title: t('photoGallery.deleteSuccess'),
        description: t('photoGallery.photoDeleted'),
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: t('photoGallery.deleteFailed'),
        description: t('photoGallery.deleteFailedDesc'),
        variant: "destructive",
      });
    }
  };

  // 下载照片
  const handleDownloadPhoto = async (photo: PersonalPhoto) => {
    try {
      // 从 photo_url 提取文件路径
      const url = new URL(photo.photo_url);
      const pathname = url.pathname;
      const filePath = pathname.replace('/storage/v1/object/public/user-photos/', '');
      
      await downloadFile(filePath, {
        bucketName: 'user-photos',
        fileName: `photo-${Date.now()}.jpg`
      });
    } catch (error) {
      console.error('下载照片失败:', error);
      toast({
        title: '下载失败',
        description: '无法下载照片，请重试',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (photos.length > 0) {
      const validPhotos = photos.filter(p => p && p.id);
      if (validPhotos.length > 0) {
        const photoIds = validPhotos.map(p => p.id);
        Promise.all([
          fetchLikes(photoIds),
          fetchComments(photoIds)
        ]);
      }
    }
  }, [photos]);

  // 实时监听点赞和评论
  useEffect(() => {
    if (photos.length === 0) return;

    const validPhotos = photos.filter(p => p && p.id);
    if (validPhotos.length === 0) return;
    const photoIds = validPhotos.map(p => p.id);

    const likesChannel = supabase
      .channel('personal-photo-likes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'photo_likes' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const { photo_id, user_id } = payload.new as any;
            
            if (photoIds.includes(photo_id) && user_id !== currentUserId) {
              // 获取点赞者信息和照片信息
              const { data: likerProfile } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('user_id', user_id)
                .single();

              const photo = photos.find(p => p.id === photo_id);
              
              // 创建通知记录
              await supabase
                .from('notifications')
                .insert({
                  user_id: currentUserId,
                  title: '新的点赞',
                  message: `${likerProfile?.nickname || '有人'} 赞了您的照片`,
                  type: 'info',
                  category: 'photo_like',
                  related_dinner_id: photo?.dinner_id
                });

              toast({
                title: '新的点赞',
                description: `${likerProfile?.nickname || '有人'} 赞了您的照片`,
              });
            }
            
            fetchLikes([photo_id]);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            fetchLikes([(payload.old as any).photo_id]);
          }
        })
      .subscribe();

    const commentsChannel = supabase
      .channel('personal-photo-comments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'photo_comments' },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const { photo_id, user_id, content } = payload.new as any;
            
            if (photoIds.includes(photo_id) && user_id !== currentUserId) {
              // 获取评论者信息和照片信息
              const { data: commenterProfile } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('user_id', user_id)
                .single();

              const photo = photos.find(p => p.id === photo_id);
              
              // 创建通知记录
              await supabase
                .from('notifications')
                .insert({
                  user_id: currentUserId,
                  title: '新的评论',
                  message: `${commenterProfile?.nickname || '有人'} 评论了您的照片: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                  type: 'info',
                  category: 'photo_comment',
                  related_dinner_id: photo?.dinner_id
                });

              toast({
                title: '新的评论',
                description: `${commenterProfile?.nickname || '有人'} 评论了您的照片`,
              });
            }
            
            fetchComments([photo_id]);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            fetchComments([(payload.old as any).photo_id]);
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [photos, currentUserId]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t('profile.noPhotosYet')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('profile.startSharing', '开始分享您的美食时光吧！')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => {
          const photoLikes = likes[photo.id] || [];
          const photoComments = comments[photo.id] || [];
          const isLiked = photoLikes.some(like => like.user_id === currentUserId);
          
          return (
            <div key={photo.id} className="space-y-2">
              <div 
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={photo.photo_url} 
                  alt={photo.description || "照片"} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{photoLikes.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{photoComments.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {photo.description && (
                  <p className="text-xs text-foreground">{photo.description}</p>
                )}
                {photo.dinners ? (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">{photo.dinners.title}</p>
                    <p>{new Date(photo.dinners.dinner_time).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <p>{t('profile.personalPhoto', '个人分享')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 照片详情弹窗 */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* 照片区域 */}
              <div className="relative bg-black">
                <img
                  src={selectedPhoto.photo_url}
                  alt={selectedPhoto.description || "照片"}
                  className="w-full h-full object-contain"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* 互动区域 */}
              <div className="flex flex-col h-[600px]">
                <DialogHeader className="p-4 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-lg">照片详情</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        浏览个人照片并与其他用户互动
                      </DialogDescription>
                    </div>
                     <div className="relative">
                       <Button 
                         size="sm" 
                         variant="ghost"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           setPhotoMenuOpen(!photoMenuOpen);
                         }}
                       >
                         <MoreHorizontal className="w-4 h-4" />
                       </Button>
                       {photoMenuOpen && (
                         <>
                           <div 
                             className="fixed inset-0 z-40" 
                             onClick={() => setPhotoMenuOpen(false)}
                           />
                            <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
                              <button
                                className="flex items-center px-3 py-2 text-sm hover:bg-accent w-full text-left rounded-t-md"
                                onClick={() => {
                                  handleDownloadPhoto(selectedPhoto);
                                  setPhotoMenuOpen(false);
                                }}
                                disabled={downloading !== null}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                {downloading ? '下载中...' : t('photoGallery.downloadPhoto', '下载照片')}
                              </button>
                              {selectedPhoto.user_id === currentUserId && (
                                <button
                                  className="flex items-center px-3 py-2 text-sm text-destructive hover:bg-accent w-full text-left rounded-b-md"
                                  onClick={() => {
                                    handleDeletePhoto(selectedPhoto);
                                    setPhotoMenuOpen(false);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('photoGallery.deletePhoto')}
                                </button>
                              )}
                            </div>
                         </>
                        )}
                   </div>
                 </DialogHeader>

                {/* 照片信息和操作 */}
                <div className="p-4 border-b flex-shrink-0">
                  {selectedPhoto.description && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedPhoto.description}</p>
                  )}
                  
                  {selectedPhoto.dinners && (
                    <div className="text-sm text-muted-foreground mb-3 p-2 bg-muted rounded">
                      <p className="font-medium">{selectedPhoto.dinners.title}</p>
                      <p>{new Date(selectedPhoto.dinners.dinner_time).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`gap-2 ${likes[selectedPhoto.id]?.some(like => like.user_id === currentUserId) ? 'text-red-500' : ''}`}
                      onClick={() => handleLike(selectedPhoto.id)}
                    >
                      <Heart className={`w-4 h-4 ${likes[selectedPhoto.id]?.some(like => like.user_id === currentUserId) ? 'fill-current' : ''}`} />
                      {likes[selectedPhoto.id]?.length || 0}
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      {comments[selectedPhoto.id]?.length || 0} {t('photoGallery.comments')}
                    </div>
                  </div>
                </div>

                {/* 评论区域 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {(() => {
                      const all = comments[selectedPhoto.id] || [];
                      const repliesByParent: { [id: string]: PhotoComment[] } = {};
                      all.forEach(c => {
                        if (c.parent_comment_id) {
                          if (!repliesByParent[c.parent_comment_id]) repliesByParent[c.parent_comment_id] = [];
                          repliesByParent[c.parent_comment_id].push(c);
                        }
                      });
                      const topLevel = all.filter(c => !c.parent_comment_id);
                      return topLevel.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback>
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{comment.profiles?.nickname || t('photoGallery.anonymousUser')}</span>
                                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString(t('common.locale'))}</span>
                              </div>
                              <p className="text-sm text-foreground">{comment.content}</p>
                              <div className="mt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setReplyToComment(comment)}
                                >
                                  回复
                                </Button>
                              </div>

                              {/* 子回复 */}
                              {repliesByParent[comment.id]?.length ? (
                                <div className="mt-2 space-y-3 border-l pl-3">
                                  {repliesByParent[comment.id].map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-3">
                                      <Avatar className="w-7 h-7 flex-shrink-0">
                                        <AvatarImage src={reply.profiles?.avatar_url} />
                                        <AvatarFallback>
                                          <User className="w-4 h-4" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium">{reply.profiles?.nickname || t('photoGallery.anonymousUser')}</span>
                                          <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString(t('common.locale'))}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{reply.content}</p>
                                        <div className="mt-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => setReplyToComment(reply)}
                                          >
                                            回复
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 评论输入 */}
                <div className="p-4 border-t flex-shrink-0">
                  {replyToComment && (
                    <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
                      正在回复 <span className="font-medium">@{replyToComment.profiles?.nickname || '用户'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setReplyToComment(null)}
                      >
                        取消
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={replyToComment ? `回复 @${replyToComment.profiles?.nickname || '用户'}：` : t('photoGallery.addComment')}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="resize-none text-sm"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmitComment(selectedPhoto.id, replyToComment?.id || undefined)}
                      disabled={!newComment.trim() || submittingComment}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PersonalPhotoGallery;