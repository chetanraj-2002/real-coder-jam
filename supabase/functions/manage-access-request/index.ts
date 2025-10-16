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

    const { action, fileId, requestId, message, response } = await req.json();

    let result;

    switch (action) {
      case 'create':
        // Get current lock holder
        const { data: file, error: fileError } = await supabase
          .from('project_files')
          .select('locked_by')
          .eq('id', fileId)
          .single();

        if (fileError) throw fileError;
        if (!file.locked_by) {
          throw new Error('File is not currently locked');
        }

        const { data: requestData, error: requestError } = await supabase
          .from('file_access_requests')
          .insert({
            file_id: fileId,
            requester_id: user.id,
            current_editor_id: file.locked_by,
            message: message || null,
          })
          .select()
          .single();

        if (requestError) throw requestError;
        result = requestData;
        break;

      case 'respond':
        if (!requestId || !response) {
          throw new Error('Request ID and response are required');
        }

        // Get request details
        const { data: request, error: getRequestError } = await supabase
          .from('file_access_requests')
          .select('*, project_files!inner(project_id)')
          .eq('id', requestId)
          .single();

        if (getRequestError) throw getRequestError;

        // Verify user is current editor or project owner
        const { data: isOwner } = await supabase.rpc('is_project_owner', {
          _user_id: user.id,
          _project_id: request.project_files.project_id,
        });

        if (request.current_editor_id !== user.id && !isOwner) {
          throw new Error('Only current editor or owner can respond');
        }

        const { data: updateData, error: updateError } = await supabase
          .from('file_access_requests')
          .update({
            status: response,
            responded_at: new Date().toISOString(),
            responded_by: user.id,
          })
          .eq('id', requestId)
          .select()
          .single();

        if (updateError) throw updateError;

        // If approved, transfer lock
        if (response === 'approved') {
          const { error: transferError } = await supabase
            .from('project_files')
            .update({
              locked_by: request.requester_id,
              locked_at: new Date().toISOString(),
            })
            .eq('id', request.file_id);

          if (transferError) throw transferError;

          // Log activity
          await supabase.from('project_activity_logs').insert({
            project_id: request.project_files.project_id,
            user_id: user.id,
            action_type: 'file_access_granted',
            target_file_id: request.file_id,
            target_user_id: request.requester_id,
          });
        }

        result = updateData;
        break;

      case 'cancel':
        if (!requestId) {
          throw new Error('Request ID is required');
        }

        const { data: cancelData, error: cancelError } = await supabase
          .from('file_access_requests')
          .delete()
          .eq('id', requestId)
          .eq('requester_id', user.id)
          .select()
          .single();

        if (cancelError) throw cancelError;
        result = cancelData;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error managing access request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
