-- Notify admins when a new report is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, category)
  SELECT ur.user_id,
         '新的反馈/举报',
         '类型：' || NEW.report_type || '｜标题：' || NEW.title,
         'warning',
         'report_created'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_report ON public.reports;
CREATE TRIGGER trg_notify_admins_on_new_report
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_report();