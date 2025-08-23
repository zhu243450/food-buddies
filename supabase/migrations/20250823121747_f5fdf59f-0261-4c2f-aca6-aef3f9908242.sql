-- 修改dinner_photos表，使dinner_id变为可选，允许用户分享不绑定特定饭局的照片
ALTER TABLE public.dinner_photos 
ALTER COLUMN dinner_id DROP NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN public.dinner_photos.dinner_id IS '可选：关联的饭局ID，如果为NULL则表示用户的个人分享照片';

-- 更新RLS政策，允许用户上传个人照片（不绑定饭局）
DROP POLICY IF EXISTS "用户可以上传自己的照片" ON public.dinner_photos;

CREATE POLICY "用户可以上传自己的照片" 
ON public.dinner_photos 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (
    -- 可以上传个人照片（不绑定饭局）
    dinner_id IS NULL 
    OR 
    -- 或者上传饭局相关照片（需要是参与者或创建者）
    (
      dinner_id IS NOT NULL AND 
      (
        (EXISTS ( SELECT 1
         FROM dinner_participants
         WHERE (dinner_participants.dinner_id = dinner_photos.dinner_id) AND (dinner_participants.user_id = auth.uid())
        )) 
        OR 
        (EXISTS ( SELECT 1
         FROM dinners
         WHERE (dinners.id = dinner_photos.dinner_id) AND (dinners.created_by = auth.uid())
        ))
      )
    )
  )
);

-- 更新查看政策，允许查看所有个人分享照片
DROP POLICY IF EXISTS "用户可以查看已参与饭局的照片" ON public.dinner_photos;

CREATE POLICY "用户可以查看已参与饭局的照片" 
ON public.dinner_photos 
FOR SELECT 
USING (
  -- 可以查看个人分享照片（不绑定饭局的）
  dinner_id IS NULL
  OR
  -- 或者查看自己参与的饭局照片
  (
    dinner_id IS NOT NULL AND 
    (
      (EXISTS ( SELECT 1
       FROM dinner_participants
       WHERE (dinner_participants.dinner_id = dinner_photos.dinner_id) AND (dinner_participants.user_id = auth.uid())
      )) 
      OR 
      (EXISTS ( SELECT 1
       FROM dinners
       WHERE (dinners.id = dinner_photos.dinner_id) AND (dinners.created_by = auth.uid())
      ))
    )
  )
);

-- 确保"用户可以查看所有照片用于个人资料"政策仍然生效