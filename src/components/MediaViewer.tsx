import React from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Loader2, AlertCircle, Play } from 'lucide-react';

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
  const filePath = extractFilePathFromSupabaseUrl(url, bucketName);
  const shouldResign = filePath !== null && !url.includes('token=');
  const { signedUrl, loading, error } = useSignedUrl(
    shouldResign ? filePath : null,
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