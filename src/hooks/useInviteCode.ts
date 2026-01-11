import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InviteCodeData {
  inviteCode: string | null;
  successfulInvites: number;
  totalInvites: number;
  loading: boolean;
}

interface InviteRecord {
  id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function useInviteCode(userId: string | undefined) {
  const [data, setData] = useState<InviteCodeData>({
    inviteCode: null,
    successfulInvites: 0,
    totalInvites: 0,
    loading: true
  });
  const [inviteRecords, setInviteRecords] = useState<InviteRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchOrCreateInviteCode = async () => {
      try {
        // 先尝试获取现有邀请码
        const { data: existingCode, error: fetchError } = await supabase
          .from('user_invite_codes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingCode) {
          setData({
            inviteCode: existingCode.invite_code,
            successfulInvites: existingCode.successful_invites,
            totalInvites: existingCode.total_invites,
            loading: false
          });
        } else {
          // 创建新邀请码
          const { data: newCode, error: createError } = await supabase
            .rpc('create_user_invite_code', { target_user_id: userId });

          if (createError) throw createError;

          setData({
            inviteCode: newCode,
            successfulInvites: 0,
            totalInvites: 0,
            loading: false
          });
        }

        // 获取邀请记录
        const { data: records, error: recordsError } = await supabase
          .from('invite_records')
          .select('*')
          .eq('inviter_id', userId)
          .order('created_at', { ascending: false });

        if (!recordsError && records) {
          setInviteRecords(records);
        }

      } catch (error: any) {
        console.error('获取邀请码失败:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchOrCreateInviteCode();
  }, [userId]);

  const copyInviteCode = async () => {
    if (data.inviteCode) {
      try {
        await navigator.clipboard.writeText(data.inviteCode);
        toast({
          title: '复制成功',
          description: '邀请码已复制到剪贴板'
        });
        return true;
      } catch {
        toast({
          title: '复制失败',
          description: '请手动复制邀请码',
          variant: 'destructive'
        });
        return false;
      }
    }
    return false;
  };

  const copyInviteLink = async () => {
    if (data.inviteCode) {
      const link = `${window.location.origin}/auth?invite=${data.inviteCode}`;
      try {
        await navigator.clipboard.writeText(link);
        toast({
          title: '复制成功',
          description: '邀请链接已复制到剪贴板'
        });
        return true;
      } catch {
        toast({
          title: '复制失败',
          description: '请手动复制邀请链接',
          variant: 'destructive'
        });
        return false;
      }
    }
    return false;
  };

  return {
    ...data,
    inviteRecords,
    copyInviteCode,
    copyInviteLink
  };
}
