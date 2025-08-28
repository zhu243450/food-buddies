import React from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Loader2, AlertCircle, Play } from 'lucide-react';

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
  const { signedUrl, loading, error } = useSignedUrl(
    url.includes('supabase') ? url.split('/').slice(-2).join('/') : null,
    bucketName
  );

  const displayUrl = signedUrl || url;

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
      <div className={`relative ${className}`}>
        <video
          src={displayUrl}
          controls
          className="w-full h-full object-cover rounded"
          preload="metadata"
        >
          您的浏览器不支持视频播放。
        </video>
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={`object-cover rounded ${className}`}
      loading="lazy"
    />
  );
}