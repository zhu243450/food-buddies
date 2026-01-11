import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Images, X, Loader2, Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MultiImageUploaderProps {
  userId: string;
  onImagesUploaded: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

interface ImagePreview {
  id: string;
  url: string;
  file: File;
  uploading: boolean;
  uploaded: boolean;
  uploadedUrl?: string;
}

export function MultiImageUploader({ 
  userId, 
  onImagesUploaded, 
  disabled = false,
  maxImages = 9
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return '只支持图片文件';
    }
    if (file.size > 10 * 1024 * 1024) {
      return '图片大小不能超过 10MB';
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return '只支持 JPG、PNG、WEBP、GIF 格式';
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

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-images')
        .createSignedUrl(data.path, 3600 * 24 * 7);

      if (signedUrlError) throw signedUrlError;

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('上传失败:', error);
      return null;
    }
  };

  const handleFilesSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: '图片数量超限',
        description: `最多可选择 ${maxImages} 张图片，还可添加 ${remainingSlots} 张`,
        variant: 'destructive'
      });
      return;
    }

    // 验证所有文件
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: '文件验证失败',
          description: `${file.name}: ${error}`,
          variant: 'destructive'
        });
        return;
      }
    }

    // 创建预览
    const newPreviews: ImagePreview[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      file,
      uploading: true,
      uploaded: false
    }));

    setImages(prev => [...prev, ...newPreviews]);
    setIsOpen(true);

    // 并行上传所有图片
    const uploadPromises = newPreviews.map(async (preview) => {
      const uploadedUrl = await uploadImage(preview.file);
      setImages(prev => prev.map(img => 
        img.id === preview.id 
          ? { ...img, uploading: false, uploaded: !!uploadedUrl, uploadedUrl }
          : img
      ));
      return { id: preview.id, url: uploadedUrl };
    });

    await Promise.all(uploadPromises);

    // 清空input
    e.target.value = '';
  }, [images.length, maxImages, userId, toast]);

  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      if (updated.length === 0) setIsOpen(false);
      return updated;
    });
  };

  const handleSend = () => {
    const uploadedUrls = images
      .filter(img => img.uploaded && img.uploadedUrl)
      .map(img => img.uploadedUrl!);
    
    if (uploadedUrls.length === 0) {
      toast({
        title: '请等待上传完成',
        variant: 'destructive'
      });
      return;
    }

    onImagesUploaded(uploadedUrls);
    setImages([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setImages([]);
    setIsOpen(false);
  };

  const isUploading = images.some(img => img.uploading);
  const uploadedCount = images.filter(img => img.uploaded).length;

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelect}
        className="hidden"
        id="multi-image-upload"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => document.getElementById('multi-image-upload')?.click()}
        disabled={disabled || isUploading}
        className="h-9 w-9"
        title="发送多张图片"
      >
        <Images className="h-5 w-5" />
      </Button>

      {/* 多图预览面板 */}
      {isOpen && images.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 bg-background border rounded-lg p-3 shadow-lg min-w-[280px] max-w-[400px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              已选择 {images.length}/{maxImages} 张图片
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {images.map((img) => (
                <div key={img.id} className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded overflow-hidden border">
                    <img
                      src={img.url}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {img.uploading ? (
                    <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5"
                      onClick={() => removeImage(img.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {/* 添加更多按钮 */}
              {images.length < maxImages && (
                <button
                  className="w-16 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors flex-shrink-0"
                  onClick={() => document.getElementById('multi-image-upload')?.click()}
                  disabled={isUploading}
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isUploading || uploadedCount === 0}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  上传中 ({uploadedCount}/{images.length})
                </>
              ) : (
                `发送 ${uploadedCount} 张`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
