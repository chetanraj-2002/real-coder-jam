import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useRoomOwnership = (roomId: string) => {
  const { user } = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [effectiveOwner, setEffectiveOwner] = useState<string | null>(null);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!roomId) {
        setIsOwner(false);
        setLoading(false);
        return;
      }

      // If user is not available yet, wait a bit more
      if (!user) {
        const timer = setTimeout(() => {
          if (!user) {
            setIsOwner(false);
            setLoading(false);
          }
        }, 2000); // Wait up to 2 seconds for user to load
        return () => clearTimeout(timer);
      }

      try {
        const { data: room, error } = await supabase
          .from('rooms')
          .select('owner_id, owner_email')
          .eq('id', roomId)
          .maybeSingle();

        if (error) {
          console.error('Error checking room ownership:', error);
          // Assume user is owner if room check fails (for new rooms)
          setIsOwner(true);
        } else if (room) {
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
        // Default to owner for new rooms
        setIsOwner(true);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to allow authentication to settle
    const timer = setTimeout(checkOwnership, 100);
    return () => clearTimeout(timer);
  }, [user, roomId]);

  const handleHostChange = useCallback((newEffectiveOwner: string) => {
    setEffectiveOwner(newEffectiveOwner);
  }, []);

  // When the original owner rejoins, they should become effective owner
  useEffect(() => {
    if (isOwner && user && !effectiveOwner) {
      setEffectiveOwner(user.id);
    }
  }, [isOwner, user, effectiveOwner]);

  const isEffectiveOwner = effectiveOwner ? effectiveOwner === user?.id : isOwner;

  return { isOwner, loading, isEffectiveOwner, handleHostChange };
};