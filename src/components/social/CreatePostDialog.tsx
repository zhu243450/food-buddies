import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Image, X, Hash, Globe, Users, Lock, Loader2 } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const POPULAR_HASHTAGS = [
  '今日份快乐', '深夜食堂', '美食探店', '一人食', '约饭日记',
  '减肥也要吃', '家常菜', '烘焙时光', '下午茶', '周末聚餐'
];

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { createPost } = usePosts();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 9) {
      return;
    }
    const newFiles = [...mediaFiles, ...files].slice(0, 9);
    setMediaFiles(newFiles);
    
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setMediaPreviews(previews);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addHashtag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '').trim();
    if (cleanTag && !hashtags.includes(cleanTag) && hashtags.length < 5) {
      setHashtags([...hashtags, cleanTag]);
    }
    setHashtagInput('');
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    if (!user) return;

    setUploading(true);
    try {
      // Upload media files
      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];

      for (const file of mediaFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('dinner-photos').upload(path, file);
        if (error) throw error;
        
        const { data: urlData } = supabase.storage.from('dinner-photos').getPublicUrl(path);
        mediaUrls.push(urlData.publicUrl);
        mediaTypes.push(file.type.startsWith('video/') ? 'video' : 'image');
      }

      await createPost.mutateAsync({
        content: content.trim(),
        media_urls: mediaUrls,
        media_types: mediaTypes,
        visibility,
        hashtags,
      });

      // Reset form
      setContent('');
      setVisibility('public');
      setHashtags([]);
      setMediaFiles([]);
      setMediaPreviews([]);
      setOpen(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setUploading(false);
    }
  };

  const visibilityIcons = {
    public: <Globe className="w-4 h-4" />,
    friends: <Users className="w-4 h-4" />,
    private: <Lock className="w-4 h-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-primary-foreground shadow-xl rounded-full w-16 h-16 fixed bottom-24 right-4 z-40 animate-bounce-slow ring-4 ring-primary/30 hover:ring-primary/50 hover:scale-110 transition-all duration-300">
          <Plus className="w-7 h-7" strokeWidth={3} />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">发布</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>发布动态</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的美食时光、生活日常..."
            className="min-h-[120px] resize-none"
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">{content.length}/500</div>

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {mediaPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media upload */}
          {mediaFiles.length < 9 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Image className="w-4 h-4" />
                添加图片/视频 ({mediaFiles.length}/9)
              </Button>
            </div>
          )}

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addHashtag(hashtagInput);
                  }
                }}
                placeholder="添加话题标签..."
                className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hashtags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setHashtags(prev => prev.filter(t => t !== tag))}>
                    #{tag} <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {POPULAR_HASHTAGS.filter(t => !hashtags.includes(t)).slice(0, 6).map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer text-xs hover:bg-primary/10"
                  onClick={() => addHashtag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  {visibilityIcons[visibility as keyof typeof visibilityIcons]}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">公开</SelectItem>
                <SelectItem value="friends">仅好友</SelectItem>
                <SelectItem value="private">仅自己</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSubmit}
              disabled={uploading || (!content.trim() && mediaFiles.length === 0)}
              className="bg-gradient-primary"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {uploading ? '发布中...' : '发布'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
