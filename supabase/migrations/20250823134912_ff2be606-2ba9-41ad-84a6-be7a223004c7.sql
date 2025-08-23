-- 为 photo_comments 表添加回复功能支持
ALTER TABLE photo_comments ADD COLUMN parent_comment_id uuid REFERENCES photo_comments(id) ON DELETE CASCADE;

-- 创建索引以提高查询性能
CREATE INDEX idx_photo_comments_parent ON photo_comments(parent_comment_id);
CREATE INDEX idx_photo_comments_photo_parent ON photo_comments(photo_id, parent_comment_id);