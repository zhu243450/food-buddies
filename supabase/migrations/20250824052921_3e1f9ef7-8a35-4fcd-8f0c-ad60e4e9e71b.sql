-- Add denormalized participant_count and maintain via triggers
DO $$ BEGIN
  -- Add column if not exists
  ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS participant_count integer NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  -- ignore
  NULL;
END $$;

-- Backfill counts from existing participations
UPDATE public.campaigns c
SET participant_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT campaign_id, COUNT(*)::int AS cnt
  FROM public.campaign_participations
  GROUP BY campaign_id
) AS sub
WHERE c.id = sub.campaign_id;

-- Create trigger function to keep participant_count in sync
CREATE OR REPLACE FUNCTION public.update_campaign_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.campaigns
    SET participant_count = participant_count + 1
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.campaigns
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.campaign_id;
    RETURN OLD;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Recreate triggers for insert/delete
DROP TRIGGER IF EXISTS trg_campaign_participations_count_insert ON public.campaign_participations;
DROP TRIGGER IF EXISTS trg_campaign_participations_count_delete ON public.campaign_participations;

CREATE TRIGGER trg_campaign_participations_count_insert
AFTER INSERT ON public.campaign_participations
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_participant_count();

CREATE TRIGGER trg_campaign_participations_count_delete
AFTER DELETE ON public.campaign_participations
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_participant_count();