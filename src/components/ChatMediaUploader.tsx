import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Video, X, Loader2 } from 'lucide-react';

interface ChatMediaUploaderProps {
  userId: string;
  onMediaUploaded: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  disabled?: boolean;
}

interface MediaPreview {
  url: string;
  type: 'image' | 'video';
  file: File;
}

export function ChatMediaUploader({ userId, onMediaUploaded, disabled = false }: ChatMediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaPreview | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return '只支持图片和视频文件';
    }

    if (isImage) {
      if (file.size > 10 * 1024 * 1024) {
        return '图片大小不能超过 10MB';
      }
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        return '只支持 JPG、PNG、WEBP、GIF 格式的图片';
      }
    }

    if (isVideo) {
      const allowedVideoTypes = [
        'video/mp4',
        'video/webm', 
        'video/mov',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        'video/3gpp',
        'video/3gpp2',
        'video/x-flv',
        'video/mkv',
        'video/x-matroska',
        'video/mp2t',
        'video/x-ms-wmv',
        'video/m4v'
      ];
      if (!allowedVideoTypes.includes(file.type)) {
        return '只支持常见的视频格式（MP4、MOV、AVI、WEBM、3GP、MKV等）';
      }
    }
    
    return null;
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const isVideo = file.type.startsWith('video/');
      const bucketName = isVideo ? 'chat-videos' : 'chat-images';
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 获取签名URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(data.path, 3600 * 24 * 7); // 7天有效期

      if (signedUrlError) throw signedUrlError;

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('上传失败:', error);
      return null;
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    const error = validateFile(file);
    if (error) {
      toast({
        title: '文件验证失败',
        description: error,
        variant: 'destructive'
      });
      return;
    }

    const isVideo = file.type.startsWith('video/');
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewMedia({
        url: e.target?.result as string,
        type: isVideo ? 'video' : 'image',
        file
      });
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const uploadedUrl = await uploadMedia(file);
      
      if (uploadedUrl) {
        onMediaUploaded(uploadedUrl, isVideo ? 'video' : 'image');
        setPreviewMedia(null);
        toast({
          title: `${isVideo ? '视频' : '图片'}上传成功`,
          description: `${isVideo ? '视频' : '图片'}已准备发送`
        });
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      toast({
        title: '上传失败',
        description: '请重试',
        variant: 'destructive'
      });
      setPreviewMedia(null);
    } finally {
      setUploading(false);
      // 清空input
      e.target.value = '';
    }
  }, [userId, onMediaUploaded, toast]);

  const cancelPreview = () => {
    setPreviewMedia(null);
    setUploading(false);
  };

  return (
    <div className="relative flex gap-2">
      {/* 图片上传按钮 */}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="chat-image-upload"
          disabled={disabled || uploading}
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => document.getElementById('chat-image-upload')?.click()}
          disabled={disabled || uploading}
          className="h-9 w-9"
          title="发送图片"
        >
          {uploading && previewMedia?.type === 'image' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* 视频上传按钮 */}
      <div>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="chat-video-upload"
          disabled={disabled || uploading}
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => document.getElementById('chat-video-upload')?.click()}
          disabled={disabled || uploading}
          className="h-9 w-9"
          title="发送视频"
        >
          {uploading && previewMedia?.type === 'video' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Video className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* 预览媒体 */}
      {previewMedia && (
        <div className="absolute bottom-full mb-2 left-0 bg-background border rounded-lg p-2 shadow-lg">
          <div className="relative">
            {previewMedia.type === 'image' ? (
              <img
                src={previewMedia.url}
                alt="预览"
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            {!uploading && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={cancelPreview}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {uploading ? '上传中...' : '准备发送'}
          </p>
          
          <p className="text-xs text-muted-foreground text-center">
            {previewMedia.type === 'video' ? '视频' : '图片'} ({(previewMedia.file.size / 1024 / 1024).toFixed(1)}MB)
          </p>
        </div>
      )}
    </div>
  );
}