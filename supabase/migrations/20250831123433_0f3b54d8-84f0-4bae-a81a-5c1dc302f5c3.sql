-- Update rooms table to better track ownership
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Create index for faster owner queries
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON public.rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_email ON public.rooms(owner_email);