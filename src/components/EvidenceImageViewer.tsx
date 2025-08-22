import React from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface EvidenceImageViewerProps {
  url: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function EvidenceImageViewer({ url, alt, className = "", onClick }: EvidenceImageViewerProps) {
  // 从完整URL中提取文件路径
  const getFilePathFromUrl = (fullUrl: string): string | null => {
    try {
      // 如果是已经签名的URL，直接使用
      if (fullUrl.includes('token=')) {
        return null;
      }
      
      // 从Supabase存储URL中提取文件路径
      const urlObj = new URL(fullUrl);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'feedback-evidence');
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const filePath = getFilePathFromUrl(url);
  const { signedUrl, loading, error } = useSignedUrl(filePath);

  // 如果URL已经是签名URL或者无法解析路径，直接使用原URL
  const displayUrl = signedUrl || url;

  if (loading) {
    return (
      <Skeleton className={`aspect-square ${className}`} />
    );
  }

  if (error) {
    return (
      <div className={`aspect-square flex items-center justify-center bg-muted border rounded-lg ${className}`}>
        <div className="text-center p-2">
          <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-square relative rounded-lg overflow-hidden border bg-muted ${className}`}>
      <img
        src={displayUrl}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
        onClick={onClick}
        loading="lazy"
        onError={(e) => {
          console.error('图片加载失败:', displayUrl);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          
          // 显示错误占位符
          const errorDiv = document.createElement('div');
          errorDiv.className = 'absolute inset-0 flex items-center justify-center bg-muted';
          errorDiv.innerHTML = `
            <div class="text-center p-2">
              <svg class="h-6 w-6 text-muted-foreground mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p class="text-xs text-muted-foreground">图片加载失败</p>
            </div>
          `;
          target.parentNode?.appendChild(errorDiv);
        }}
      />
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="h-4 w-4 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}