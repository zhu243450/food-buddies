-- 为照片相关表启用实时功能
ALTER TABLE photo_likes REPLICA IDENTITY FULL;
ALTER TABLE photo_comments REPLICA IDENTITY FULL;

-- 添加到实时发布中
ALTER PUBLICATION supabase_realtime ADD TABLE photo_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE photo_comments;