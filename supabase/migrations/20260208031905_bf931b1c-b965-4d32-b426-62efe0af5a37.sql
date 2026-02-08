
-- Add dinner_category column to dinners table
ALTER TABLE public.dinners 
ADD COLUMN dinner_category text DEFAULT NULL;

-- Add an index for filtering by category
CREATE INDEX idx_dinners_category ON public.dinners (dinner_category);

-- Add a comment for documentation
COMMENT ON COLUMN public.dinners.dinner_category IS 'Dinner scene category: business, friends, meetup, celebration, foodie, family, themed';
