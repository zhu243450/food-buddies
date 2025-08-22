import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSignedUrl(filePath: string | null, bucketName: string = 'feedback-evidence') {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600 * 24); // 24小时有效期

        if (error) throw error;
        
        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('获取签名URL失败:', err);
        setError(err instanceof Error ? err.message : '获取图片失败');
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [filePath, bucketName]);

  return { signedUrl, loading, error };
}