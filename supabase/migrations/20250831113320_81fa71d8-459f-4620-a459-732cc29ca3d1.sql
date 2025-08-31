-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.rooms 
  SET updated_at = now() 
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;