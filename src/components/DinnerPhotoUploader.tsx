import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Image, Video, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

interface DinnerMediaUploaderProps {
  dinnerId: string | null; // 允许为null，表示个人分享媒体
  onUploadSuccess?: () => void;
  onPhotoUploaded?: () => void; // 新增回调函数
}

const DinnerMediaUploader = ({ dinnerId, onUploadSuccess, onPhotoUploaded }: DinnerMediaUploaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidMedia = isImage || isVideo;
      
      if (!isValidMedia) {
        toast({
          title: "无效文件格式",
          description: "请选择图片或视频文件",
          variant: "destructive",
        });
        return false;
      }
      
      // 只限制图片大小，视频无限制
      if (!isVideo && file.size > 10 * 1024 * 1024) {
        toast({
          title: "文件过大", 
          description: "图片大小不能超过10MB",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      // 创建预览
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviews(prev => ({
            ...prev,
            [file.name]: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[fileName];
      return newPreviews;
    });
    setDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[fileName];
      return newDescriptions;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "请选择照片",
        description: "至少选择一张照片进行上传",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "未登录",
          description: "请先登录后再上传照片",
          variant: "destructive",
        });
        return;
      }

      const uploadPromises = selectedFiles.map(async (file) => {
        // 生成唯一文件名
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const isVideo = file.type.startsWith('video/');
        
        // 上传到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('dinner-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 获取公开URL
        const { data: { publicUrl } } = supabase.storage
          .from('dinner-photos')
          .getPublicUrl(fileName);

        let width = null;
        let height = null;
        let duration = null;

        if (isVideo) {
          // 获取视频时长
          const video = document.createElement('video');
          await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              duration = Math.floor(video.duration);
              width = video.videoWidth;
              height = video.videoHeight;
              resolve(void 0);
            };
            video.onerror = () => reject(new Error('Failed to load video'));
            video.src = previews[file.name];
          });
        } else {
          // 获取图片尺寸
          const img = document.createElement('img');
          await new Promise((resolve, reject) => {
            img.onload = () => {
              width = img.width;
              height = img.height;
              resolve(void 0);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = previews[file.name];
          });
        }

        // 保存到数据库
        const { error: dbError } = await supabase
          .from('dinner_photos')
          .insert({
            dinner_id: dinnerId,
            user_id: user.id,
            photo_url: publicUrl,
            description: descriptions[file.name] || '',
            file_size: file.size,
            mime_type: file.type,
            width,
            height,
            media_type: isVideo ? 'video' : 'image',
            duration,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "上传成功",
        description: `成功上传了 ${selectedFiles.length} 个文件`,
      });

      // 重置状态
      setSelectedFiles([]);
      setDescriptions({});
      setPreviews({});
      setIsOpen(false);
      onUploadSuccess?.();
      onPhotoUploaded?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "上传失败",
        description: "媒体文件上传失败，请重试",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
          <Camera className="w-4 h-4 mr-2" />
          {dinnerId ? '分享美食媒体' : '分享媒体'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            {dinnerId ? '分享饭局媒体' : '分享媒体'}
          </DialogTitle>
          <DialogDescription>
            上传照片或视频来分享精彩瞬间
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 文件选择区域 */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              点击选择媒体文件或拖拽到此处
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              支持图片（JPG、PNG，10MB内）和视频（MP4、MOV、AVI、3GP等常见格式，无大小限制）
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </Button>
          </div>

          {/* 照片预览区域 */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">待上传文件 ({selectedFiles.length})</h4>
              <div className="space-y-3">
                {selectedFiles.map((file) => {
                  const isVideo = file.type.startsWith('video/');
                  return (
                    <div key={file.name} className="border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        {previews[file.name] && (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
                            {isVideo ? (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Play className="w-6 h-6 text-muted-foreground" />
                              </div>
                            ) : (
                              <img
                                src={previews[file.name]}
                                alt="预览"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isVideo ? (
                                <Video className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Image className="w-4 h-4 text-muted-foreground" />
                              )}
                              <p className="text-sm font-medium truncate">{file.name}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.name)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {isVideo ? '视频' : '图片'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Textarea
                            placeholder={`为这个${isVideo ? '视频' : '图片'}添加描述...`}
                            value={descriptions[file.name] || ''}
                            onChange={(e) => setDescriptions(prev => ({
                              ...prev,
                              [file.name]: e.target.value
                            }))}
                            className="resize-none text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? "上传中..." : `上传 ${selectedFiles.length} 个文件`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DinnerMediaUploader;