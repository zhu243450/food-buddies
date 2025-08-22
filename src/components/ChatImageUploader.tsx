import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ChatImageUploaderProps {
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ChatImageUploader({ userId, onImageUploaded, disabled = false }: ChatImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return '图片大小不能超过 10MB';
    }
    
    if (!file.type.startsWith('image/')) {
      return '只支持图片文件';
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return '只支持 JPG、PNG、WEBP、GIF 格式的图片';
    }
    
    return null;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 获取签名URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-images')
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

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const uploadedUrl = await uploadImage(file);
      
      if (uploadedUrl) {
        onImageUploaded(uploadedUrl);
        setPreviewImage(null);
        toast({
          title: '图片上传成功',
          description: '图片已准备发送'
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
      setPreviewImage(null);
    } finally {
      setUploading(false);
      // 清空input
      e.target.value = '';
    }
  }, [userId, onImageUploaded, toast]);

  const cancelPreview = () => {
    setPreviewImage(null);
    setUploading(false);
  };

  return (
    <div className="relative">
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
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ImagePlus className="h-5 w-5" />
        )}
      </Button>

      {/* 预览图片 */}
      {previewImage && (
        <div className="absolute bottom-full mb-2 left-0 bg-background border rounded-lg p-2 shadow-lg">
          <div className="relative">
            <img
              src={previewImage}
              alt="预览"
              className="w-20 h-20 object-cover rounded"
            />
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
        </div>
      )}
    </div>
  );
}