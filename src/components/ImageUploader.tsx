import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EvidenceImageViewer } from '@/components/EvidenceImageViewer';

interface ImageUploaderProps {
  userId: string;
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
  bucketName?: string;
  alertText?: string;
}

interface UploadedImage {
  url: string;
  file: File;
  uploading: boolean;
}

export function ImageUploader({
  userId,
  onImagesChange,
  maxImages = 5,
  maxSizePerImage = 10,
  bucketName = 'feedback-evidence',
  alertText = '上传的图片将作为反馈证据，管理员可以查看这些图片'
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizePerImage * 1024 * 1024) {
      return `文件大小不能超过 ${maxSizePerImage}MB`;
    }
    
    if (!file.type.startsWith('image/')) {
      return '只支持图片文件';
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '只支持 JPG、PNG、WEBP 格式的图片';
    }
    
    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 获取签名URL（用于私有存储桶）
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

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: '图片数量超限',
        description: `最多只能上传 ${maxImages} 张图片`,
        variant: 'destructive'
      });
      return;
    }

    // 验证文件
    for (const file of fileArray) {
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

    // 添加临时图片项（显示上传状态）
    const tempImages: UploadedImage[] = fileArray.map(file => ({
      url: URL.createObjectURL(file),
      file,
      uploading: true
    }));

    setImages(prev => [...prev, ...tempImages]);

    // 逐个上传
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadedUrl = await uploadFile(file);
      
      if (uploadedUrl) {
        setImages(prev => prev.map((img, index) => {
          if (index === prev.length - fileArray.length + i) {
            // 释放临时URL
            URL.revokeObjectURL(img.url);
            return { ...img, url: uploadedUrl, uploading: false };
          }
          return img;
        }));
      } else {
        // 上传失败，移除该项
        setImages(prev => prev.filter((_, index) => 
          index !== prev.length - fileArray.length + i
        ));
        toast({
          title: '上传失败',
          description: `${file.name} 上传失败，请重试`,
          variant: 'destructive'
        });
      }
    }
  }, [images.length, maxImages, userId, toast]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      const urls = newImages.filter(img => !img.uploading).map(img => img.url);
      onImagesChange(urls);
      return newImages;
    });
  }, [onImagesChange]);

  // 当图片上传完成时，通知父组件
  React.useEffect(() => {
    const uploadedUrls = images.filter(img => !img.uploading).map(img => img.url);
    onImagesChange(uploadedUrls);
  }, [images, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <Card
        className={`
          relative border-2 border-dashed p-6 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${images.length >= maxImages ? 'opacity-50 pointer-events-none' : 'hover:border-primary hover:bg-primary/5'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={images.length >= maxImages}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              点击或拖拽上传图片
            </p>
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG、WEBP 格式，单张不超过 {maxSizePerImage}MB
            </p>
            <p className="text-xs text-muted-foreground">
              最多 {maxImages} 张图片 ({images.length}/{maxImages})
            </p>
          </div>
        </div>
      </Card>

      {/* 提示信息 */}
      {images.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {alertText}
          </AlertDescription>
        </Alert>
      )}

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative overflow-hidden">
                  <div className="aspect-square relative">
                    {image.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <p className="text-xs text-muted-foreground">上传中...</p>
                        </div>
                      </div>
                    ) : (
                      <>
        <EvidenceImageViewer
          url={image.url}
          alt={`上传的图片 ${index + 1}`}
          className="relative"
          bucketName={bucketName}
        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full z-10"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}