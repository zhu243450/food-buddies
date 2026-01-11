import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { useDownload } from '@/hooks/useDownload';

interface ImageFullscreenViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  bucketName?: string;
}

// 从URL中提取文件路径
function extractFilePathFromUrl(input: string, bucket: string): string | null {
  if (!input) return null;
  try {
    if (!input.startsWith('http')) return input;
    const url = new URL(input);
    const pathname = url.pathname;
    const marker = '/storage/v1/object/';
    const idx = pathname.indexOf(marker);
    if (idx >= 0) {
      const after = pathname.slice(idx + marker.length);
      const parts = after.split('/');
      if (parts[0] === 'sign' || parts[0] === 'public') parts.shift();
      if (parts[0] === bucket) parts.shift();
      return parts.length ? decodeURIComponent(parts.join('/')) : null;
    }
    const bucketIdx = pathname.indexOf(`/${bucket}/`);
    if (bucketIdx >= 0) {
      const afterBucket = pathname.slice(bucketIdx + bucket.length + 2);
      return decodeURIComponent(afterBucket);
    }
    return null;
  } catch {
    return null;
  }
}

export function ImageFullscreenViewer({ 
  isOpen, 
  onClose, 
  imageUrl, 
  bucketName = 'chat-images' 
}: ImageFullscreenViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const filePath = extractFilePathFromUrl(imageUrl, bucketName);
  const shouldResign = filePath !== null && !imageUrl.includes('token=');
  const { signedUrl } = useSignedUrl(shouldResign ? filePath : null, bucketName);
  const { downloadFile, downloading } = useDownload();

  const displayUrl = signedUrl || imageUrl;

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
    }
  }, [isOpen]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = async () => {
    if (filePath) {
      await downloadFile(filePath, {
        bucketName,
        fileName: `image-${Date.now()}.jpg`
      });
    } else {
      // 直接下载URL
      try {
        const response = await fetch(displayUrl);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('下载失败:', error);
      }
    }
  };

  // 双击重置
  const handleDoubleClick = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
        {/* 工具栏 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 text-white hover:bg-white/20"
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 text-white hover:bg-white/20"
            disabled={scale >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-white/30" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8 text-white hover:bg-white/20"
            disabled={!!downloading}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* 图片容器 */}
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={displayUrl}
            alt="全屏预览"
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`
            }}
            draggable={false}
          />
        </div>

        {/* 提示 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          双击重置 · 滚轮缩放
        </div>
      </DialogContent>
    </Dialog>
  );
}
