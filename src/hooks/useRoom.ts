import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useRoom = (roomId: string) => {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);

  // Load room data from Supabase
  useEffect(() => {
    const loadRoom = async () => {
      console.log('useRoom: Loading room data for:', roomId);
      try {
        let { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .maybeSingle();

        if (!room) {
          console.log('useRoom: Room not found, creating new room');
          // Create new room if it doesn't exist
          const { data: newRoom } = await supabase
            .from('rooms')
            .insert([{ 
              id: roomId,
              owner_id: user?.id,
              owner_email: user?.primaryEmailAddress?.emailAddress,
              code_content: `// Welcome to LineCraft - Room ${roomId}
// Start coding together!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`,
              language: 'javascript'
            }])
            .select()
            .single();
          
          room = newRoom;
        }

        if (room) {
          console.log('useRoom: Room loaded successfully');
          setCode(room.code_content || '');
          setLanguage(room.language || 'javascript');
        }
      } catch (error) {
        console.error('useRoom: Error loading room:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  // Save code to Supabase (debounced)
  useEffect(() => {
    if (loading || !roomId) return;

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
  }, [code, language, roomId, loading]);

  return {
    code,
    setCode,
    language,
    setLanguage,
    loading
  };
};