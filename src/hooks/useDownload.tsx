import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseDownloadOptions {
  bucketName: string;
  fileName?: string;
}

export function useDownload() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  const downloadFile = async (
    filePath: string, 
    options: UseDownloadOptions
  ) => {
    const { bucketName, fileName } = options;
    
    if (downloading) {
      toast({
        title: '下载进行中',
        description: '请等待当前下载完成',
        variant: 'destructive'
      });
      return;
    }

    setDownloading(filePath);
    
    try {
      // 获取文件数据
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('文件数据为空');
      }

      // 创建下载链接
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      
      // 设置文件名
      const downloadFileName = fileName || extractFileNameFromPath(filePath);
      link.download = downloadFileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(url);

      toast({
        title: '下载成功',
        description: `文件已保存到本地: ${downloadFileName}`
      });
    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: '下载失败',
        description: error instanceof Error ? error.message : '下载过程中出现错误',
        variant: 'destructive'
      });
    } finally {
      setDownloading(null);
    }
  };

  return {
    downloadFile,
    downloading
  };
}

// 从文件路径中提取文件名
function extractFileNameFromPath(filePath: string): string {
  if (!filePath) return 'download';
  
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  
  // 如果文件名包含时间戳，尝试提取原始文件名
  const match = fileName.match(/^\d+-[a-z0-9]+\.(.+)$/);
  if (match) {
    return `download.${match[1]}`;
  }
  
  return fileName || 'download';
}