-- Allow sending videos in chat by updating message_type check constraint
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type = ANY (ARRAY['text'::text, 'system'::text, 'image'::text, 'video'::text]));