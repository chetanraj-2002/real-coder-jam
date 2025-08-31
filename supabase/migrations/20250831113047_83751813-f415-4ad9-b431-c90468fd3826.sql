-- Update rooms table to include user tracking and real-time features
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS owner_id UUID,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create room_events table for entry/exit logging and activity tracking
CREATE TABLE IF NOT EXISTS public.room_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('join', 'leave', 'code_change', 'language_change')),
  user_name TEXT,
  user_email TEXT,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on room_events
ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;

-- Create policies for room_events (anyone can read events for rooms they have access to)
CREATE POLICY "Anyone can view room events" ON public.room_events
FOR SELECT USING (true);

CREATE POLICY "Anyone can create room events" ON public.room_events
FOR INSERT WITH CHECK (true);

-- Create room_participants table for real-time presence
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT,
  cursor_position INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_participants
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for room_participants
CREATE POLICY "Anyone can view room participants" ON public.room_participants
FOR SELECT USING (true);

CREATE POLICY "Anyone can manage room participants" ON public.room_participants
FOR ALL USING (true);

-- Add realtime support for all tables
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_events REPLICA IDENTITY FULL;
ALTER TABLE public.room_participants REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;

-- Create function to update room updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.rooms 
  SET updated_at = now() 
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update room timestamp when events occur
CREATE TRIGGER update_room_on_event
  AFTER INSERT ON public.room_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_updated_at();