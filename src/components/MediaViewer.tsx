import React, { useState } from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { useDownload } from '@/hooks/useDownload';
import { Loader2, AlertCircle, Play, Download, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Robustly extract storage object path from various Supabase URL formats
function extractFilePathFromSupabaseUrl(input: string, bucket: string): string | null {
  if (!input) return null;
  try {
    // Already a plain storage path like "userId/filename.ext"
    if (!input.startsWith('http')) return input;

    const url = new URL(input);
    const pathname = url.pathname; // query params are ignored automatically

    // Common patterns:
    // /storage/v1/object/sign/<bucket>/<path>
    // /storage/v1/object/public/<bucket>/<path>
    // /storage/v1/object/<bucket>/<path>
    const marker = '/storage/v1/object/';
    const idx = pathname.indexOf(marker);
    if (idx >= 0) {
      const after = pathname.slice(idx + marker.length);
      const parts = after.split('/');
      if (parts[0] === 'sign' || parts[0] === 'public') parts.shift();
      if (parts[0] === bucket) parts.shift();
      return parts.length ? decodeURIComponent(parts.join('/')) : null;
    }

    // Fallback: try to find "/<bucket>/" and take the trailing path
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

interface MediaViewerProps {
  url: string;
  mediaType: 'image' | 'video';
  alt?: string;
  className?: string;
  bucketName?: string;
}

export function MediaViewer({ 
  url, 
  mediaType, 
  alt = '', 
  className = '', 
  bucketName = 'chat-images' 
}: MediaViewerProps) {
  const [showControls, setShowControls] = useState(false);
  const filePath = extractFilePathFromSupabaseUrl(url, bucketName);
  const shouldResign = filePath !== null && !url.includes('token=');
  const { signedUrl, loading, error } = useSignedUrl(
    shouldResign ? filePath : null,
    bucketName
  );
  const { downloadFile, downloading } = useDownload();

  const displayUrl = signedUrl || url;

  const handleDownload = async () => {
    if (!filePath) {
      // 如果无法提取filePath，尝试直接下载URL
      const fileName = `${mediaType}-${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
      try {
        const response = await fetch(displayUrl);
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('下载失败:', error);
      }
      return;
    }

    await downloadFile(filePath, {
      bucketName,
      fileName: `${mediaType}-${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`}>
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div 
        className={`relative group ${className}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          src={displayUrl}
          controls
          className="w-full h-full object-cover rounded"
          preload="metadata"
        >
          您的浏览器不支持视频播放。
        </video>
        
        {/* 下载按钮 */}
        {showControls && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
                >
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload} disabled={downloading === filePath}>
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === filePath ? '下载中...' : '下载视频'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <img
        src={displayUrl}
        alt={alt}
        className="object-cover rounded w-full h-full"
        loading="lazy"
      />
      
      {/* 下载按钮 */}
      {showControls && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 border-0"
              >
                <MoreVertical className="h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload} disabled={downloading === filePath}>
                <Download className="h-4 w-4 mr-2" />
                {downloading === filePath ? '下载中...' : '下载图片'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}