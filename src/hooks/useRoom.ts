import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRoom = (roomId: string) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);

  // Load room data from Supabase
  useEffect(() => {
    const loadRoom = async () => {
      try {
        let { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (!room) {
          // Create new room if it doesn't exist
          const { data: newRoom } = await supabase
            .from('rooms')
            .insert([{ 
              id: roomId,
              code_content: `// Welcome to Line Craft - Room ${roomId}
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
          setCode(room.code_content || '');
          setLanguage(room.language || 'javascript');
        }
      } catch (error) {
        console.error('Error loading room:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId]);

  // Save code to Supabase (debounced)
  useEffect(() => {
    if (loading) return;

    const saveTimer = setTimeout(async () => {
      try {
        await supabase
          .from('rooms')
          .upsert({ 
            id: roomId, 
            code_content: code,
            language: language,
            updated_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error saving code:', error);
      }
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [code, language, roomId, loading]);

  return {
    code,
    setCode,
    language,
    setLanguage,
    loading
  };
};