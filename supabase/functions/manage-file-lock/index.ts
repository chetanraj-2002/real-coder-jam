import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, fileId, content } = await req.json();

    // Get file and verify permissions
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select('*, projects!inner(owner_id)')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    const { data: canEdit } = await supabase.rpc('can_edit_file', {
      _user_id: user.id,
      _file_id: fileId,
    });

    if (!canEdit) {
      throw new Error('No permission to edit this file');
    }

    let result;

    switch (action) {
      case 'acquire':
        // Check if file is already locked
        if (file.locked_by && file.locked_by !== user.id) {
          throw new Error(`File is locked by another user`);
        }

        const { data: lockData, error: lockError } = await supabase
          .from('project_files')
          .update({
            locked_by: user.id,
            locked_at: new Date().toISOString(),
          })
          .eq('id', fileId)
          .select()
          .single();

        if (lockError) throw lockError;
        result = lockData;
        break;

      case 'release':
        // Only the user who locked it or project owner can unlock
        if (file.locked_by !== user.id && file.projects.owner_id !== user.id) {
          throw new Error('Cannot unlock file locked by another user');
        }

        const { data: unlockData, error: unlockError } = await supabase
          .from('project_files')
          .update({
            locked_by: null,
            locked_at: null,
            ...(content !== undefined && { content }),
          })
          .eq('id', fileId)
          .select()
          .single();

        if (unlockError) throw unlockError;
        result = unlockData;
        break;

      case 'heartbeat':
        // Update lock timestamp to prevent auto-unlock
        if (file.locked_by !== user.id) {
          throw new Error('File is not locked by you');
        }

        const { data: heartbeatData, error: heartbeatError } = await supabase
          .from('project_files')
          .update({ locked_at: new Date().toISOString() })
          .eq('id', fileId)
          .eq('locked_by', user.id)
          .select()
          .single();

        if (heartbeatError) throw heartbeatError;
        result = heartbeatData;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error managing file lock:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
