-- 清理重复的外键约束并修复聊天功能的SQL脚本
-- 请在 Supabase SQL Editor 中执行此脚本

-- 1. 删除可能重复的外键约束（如果存在）
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS fk_chat_messages_sender_id;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS fk_chat_messages_session_id;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS fk_chat_sessions_dinner_id;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS fk_chat_sessions_participant1_id;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS fk_chat_sessions_participant2_id;
ALTER TABLE public.dinner_participants DROP CONSTRAINT IF EXISTS fk_dinner_participants_dinner_id;
ALTER TABLE public.dinner_participants DROP CONSTRAINT IF EXISTS fk_dinner_participants_user_id;
ALTER TABLE public.dinners DROP CONSTRAINT IF EXISTS fk_dinners_created_by;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_user_id;

-- 删除可能存在的旧外键约束名
ALTER TABLE public.dinner_participants DROP CONSTRAINT IF EXISTS dinner_participants_dinner_id_fkey;
ALTER TABLE public.dinner_participants DROP CONSTRAINT IF EXISTS dinner_participants_user_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_dinner_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_participant1_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_participant2_id_fkey;
ALTER TABLE public.dinners DROP CONSTRAINT IF EXISTS dinners_created_by_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 2. 重新添加清洁的外键约束
-- chat_messages 表的外键约束
ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_session_id 
FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- chat_sessions 表的外键约束
ALTER TABLE public.chat_sessions 
ADD CONSTRAINT fk_chat_sessions_dinner_id 
FOREIGN KEY (dinner_id) REFERENCES public.dinners(id) ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
ADD CONSTRAINT fk_chat_sessions_participant1_id 
FOREIGN KEY (participant1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
ADD CONSTRAINT fk_chat_sessions_participant2_id 
FOREIGN KEY (participant2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- dinner_participants 表的外键约束
ALTER TABLE public.dinner_participants 
ADD CONSTRAINT fk_dinner_participants_dinner_id 
FOREIGN KEY (dinner_id) REFERENCES public.dinners(id) ON DELETE CASCADE;

ALTER TABLE public.dinner_participants 
ADD CONSTRAINT fk_dinner_participants_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- dinners 表的外键约束
ALTER TABLE public.dinners 
ADD CONSTRAINT fk_dinners_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- profiles 表的外键约束
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 确保唯一约束存在且没有重复
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS unique_chat_session;
ALTER TABLE public.chat_sessions 
ADD CONSTRAINT unique_chat_session 
UNIQUE (dinner_id, participant1_id, participant2_id);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_profile_user_id;
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_profile_user_id 
UNIQUE (user_id);

ALTER TABLE public.dinner_participants DROP CONSTRAINT IF EXISTS unique_dinner_participant;
ALTER TABLE public.dinner_participants 
ADD CONSTRAINT unique_dinner_participant 
UNIQUE (dinner_id, user_id);

-- 4. 重新创建所有必要的触发器
-- 删除现有触发器
DROP TRIGGER IF EXISTS trigger_create_chat_session ON public.dinner_participants;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_dinners_updated_at ON public.dinners;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;

-- 重新创建触发器
CREATE TRIGGER trigger_create_chat_session
  AFTER INSERT ON public.dinner_participants
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_chat_session_on_join();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_dinners_updated_at
  BEFORE UPDATE ON public.dinners
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 脚本执行完毕提示
SELECT 'Database constraints cleaned up and chat functionality fixed!' as status;