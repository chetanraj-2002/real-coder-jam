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
          console.log('useRoom: Room not found, creating new room');
          // Create new room - delay creation if user not available yet
          const createRoom = async () => {
            const { data: newRoom, error: createError } = await supabase
              .from('rooms')
              .insert([{ 
                id: roomId,
                owner_id: user?.id || null,
                owner_email: user?.primaryEmailAddress?.emailAddress || null,
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
            
            if (createError) {
              console.error('useRoom: Error creating room:', createError);
              // Set default content even if creation fails
              setCode(`// Welcome to LineCraft - Room ${roomId}
// Start coding together!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`);
              setLanguage('javascript');
              return;
            }
            
            room = newRoom;
          };

          await createRoom();
        }

        if (room) {
          console.log('useRoom: Room loaded successfully');
          setCode(room.code_content || '');
          setLanguage(room.language || 'javascript');
        }
      } catch (error) {
        console.error('useRoom: Error loading room:', error);
        // Set fallback content on error
        setCode(`// Welcome to LineCraft - Room ${roomId}
// Unable to load saved content, but you can start coding!

console.log("Hello, LineCraft!");`);
        setLanguage('javascript');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to allow user authentication to complete
    const timer = setTimeout(loadRoom, 100);
    return () => clearTimeout(timer);
  }, [roomId, user?.id, user?.primaryEmailAddress?.emailAddress]);

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