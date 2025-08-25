-- Add English language fields to campaigns table for multilingual support
ALTER TABLE public.campaigns 
ADD COLUMN title_en TEXT,
ADD COLUMN description_en TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.campaigns.title_en IS 'English title for the campaign';
COMMENT ON COLUMN public.campaigns.description_en IS 'English description for the campaign';