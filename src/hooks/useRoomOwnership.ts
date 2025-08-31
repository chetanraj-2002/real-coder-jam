import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useRoomOwnership = (roomId: string) => {
  const { user } = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user || !roomId) {
        setIsOwner(false);
        setLoading(false);
        return;
      }

      try {
        const { data: room } = await supabase
          .from('rooms')
          .select('owner_id, owner_email')
          .eq('id', roomId)
          .maybeSingle();

        if (room) {
          // Check if user is owner by ID or email
          const isOwnerById = room.owner_id === user.id;
          const isOwnerByEmail = room.owner_email === user.primaryEmailAddress?.emailAddress;
          setIsOwner(isOwnerById || isOwnerByEmail);
        } else {
          // If room doesn't exist yet, user will be the owner when it's created
          setIsOwner(true);
        }
      } catch (error) {
        console.error('Error checking room ownership:', error);
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [user, roomId]);

  return { isOwner, loading };
};