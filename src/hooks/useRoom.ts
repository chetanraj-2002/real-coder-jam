import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useRoom = (roomId: string) => {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [roomExists, setRoomExists] = useState<boolean>(true);

  // Load room data from Supabase
  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) {
        setLoading(false);
        return;
      }

      console.log('useRoom: Loading room data for:', roomId);
      try {
        let { data: room, error: fetchError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .maybeSingle();

        if (fetchError) {
          console.error('useRoom: Error fetching room:', fetchError);
          // Continue with room creation if fetch fails
        }

        if (!room) {
          console.log('useRoom: Room not found');
          setRoomExists(false);
          // Set default content for standalone terminal use
          setCode(`// Room ${roomId} does not exist
// You can still use the terminal below to run JavaScript code`);
          setLanguage('javascript');
        } else {
          setRoomExists(true);
        }

        if (room) {
          console.log('useRoom: Room loaded successfully');
          setCode(room.code_content || '');
          setLanguage(room.language || 'javascript');
        }
      } catch (error) {
        console.error('useRoom: Error loading room:', error);
        // Set fallback content on error
        setCode(`// Welcome to LineCraft!
// Start coding together in room ${roomId}`);
        setLanguage('javascript');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to allow user authentication to complete
    const timer = setTimeout(loadRoom, 100);
    return () => clearTimeout(timer);
  }, [roomId, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Save code to Supabase (debounced) - only if room exists
  useEffect(() => {
    if (loading || !roomId || !roomExists) return;

    console.log('useRoom: Setting up auto-save for room:', roomId);
    const saveTimer = setTimeout(async () => {
      try {
        console.log('useRoom: Auto-saving code changes');
        await supabase
          .from('rooms')
          .upsert({ 
            id: roomId, 
            code_content: code,
            language: language,
            updated_at: new Date().toISOString()
          });
        console.log('useRoom: Code saved successfully');
      } catch (error) {
        console.error('useRoom: Error saving code:', error);
      }
    }, 2000);

    return () => {
      console.log('useRoom: Clearing auto-save timer');
      clearTimeout(saveTimer);
    };
  }, [code, language, roomId, loading, roomExists]);

  return {
    code,
    setCode,
    language,
    setLanguage,
    loading,
    roomExists
  };
};