-- 添加递归函数获取行政区划的所有子级
CREATE OR REPLACE FUNCTION public.get_division_descendants(division_id_param uuid)
RETURNS TABLE(
    id uuid,
    name text,
    code text,
    level text,
    parent_id uuid,
    full_path text
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE division_tree AS (
        -- 起始节点
        SELECT 
            ad.id,
            ad.name,
            ad.code,
            ad.level,
            ad.parent_id,
            ad.name::text as full_path,
            0 as depth
        FROM public.administrative_divisions ad
        WHERE ad.id = division_id_param
        
        UNION ALL
        
        -- 递归查找子节点
        SELECT 
            child.id,
            child.name,
            child.code,
            child.level,
            child.parent_id,
            (dt.full_path || ' > ' || child.name)::text as full_path,
            dt.depth + 1
        FROM public.administrative_divisions child
        INNER JOIN division_tree dt ON child.parent_id = dt.id
        WHERE dt.depth < 10 -- 防止无限递归
    )
    SELECT 
        dt.id,
        dt.name,
        dt.code,
        dt.level,
        dt.parent_id,
        dt.full_path
    FROM division_tree dt
    WHERE dt.id = division_id_param OR dt.depth > 0;
END;
$$;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_administrative_divisions_parent_id ON public.administrative_divisions(parent_id);
CREATE INDEX IF NOT EXISTS idx_administrative_divisions_level ON public.administrative_divisions(level);
CREATE INDEX IF NOT EXISTS idx_administrative_divisions_code ON public.administrative_divisions(code);
CREATE INDEX IF NOT EXISTS idx_administrative_divisions_name ON public.administrative_divisions USING gin(to_tsvector('simple', name));

-- 添加函数获取行政区划层级路径
CREATE OR REPLACE FUNCTION public.get_division_path(division_id_param uuid)
RETURNS TABLE(
    id uuid,
    name text,
    level text,
    depth integer
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE division_path AS (
        -- 起始节点
        SELECT 
            ad.id,
            ad.name,
            ad.level,
            ad.parent_id,
            0 as depth
        FROM public.administrative_divisions ad
        WHERE ad.id = division_id_param
        
        UNION ALL
        
        -- 递归查找父节点
        SELECT 
            parent.id,
            parent.name,
            parent.level,
            parent.parent_id,
            dp.depth + 1
        FROM public.administrative_divisions parent
        INNER JOIN division_path dp ON parent.id = dp.parent_id
        WHERE dp.depth < 10 -- 防止无限递归
    )
    SELECT 
        dp.id,
        dp.name,
        dp.level,
        dp.depth
    FROM division_path dp
    ORDER BY dp.depth DESC;
END;
$$;