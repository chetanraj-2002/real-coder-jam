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

    const { action, projectId, collaboratorId, userId, userEmail, userName, permissionLevel } = await req.json();

    // Verify user is project owner
    const { data: isOwner } = await supabase.rpc('is_project_owner', {
      _user_id: user.id,
      _project_id: projectId,
    });

    if (!isOwner) {
      throw new Error('Only project owner can manage collaborators');
    }

    let result;

    switch (action) {
      case 'add':
        if (!userId || !userEmail) {
          throw new Error('User ID and email are required');
        }

        const { data: addData, error: addError } = await supabase
          .from('project_collaborators')
          .insert({
            project_id: projectId,
            user_id: userId,
            user_email: userEmail,
            user_name: userName,
            permission_level: permissionLevel || 'read_only',
            invited_by: user.id,
          })
          .select()
          .single();

        if (addError) throw addError;

        // Log activity
        await supabase.from('project_activity_logs').insert({
          project_id: projectId,
          user_id: user.id,
          action_type: 'collaborator_added',
          target_user_id: userId,
          metadata: { user_email: userEmail, permission_level: permissionLevel || 'read_only' },
        });

        result = addData;
        break;

      case 'update':
        if (!collaboratorId) {
          throw new Error('Collaborator ID is required');
        }

        const { data: updateData, error: updateError } = await supabase
          .from('project_collaborators')
          .update({ permission_level: permissionLevel })
          .eq('id', collaboratorId)
          .eq('project_id', projectId)
          .select()
          .single();

        if (updateError) throw updateError;

        await supabase.from('project_activity_logs').insert({
          project_id: projectId,
          user_id: user.id,
          action_type: 'permission_changed',
          target_user_id: updateData.user_id,
          metadata: { new_permission: permissionLevel },
        });

        result = updateData;
        break;

      case 'remove':
        if (!collaboratorId) {
          throw new Error('Collaborator ID is required');
        }

        const { data: removeData, error: removeError } = await supabase
          .from('project_collaborators')
          .delete()
          .eq('id', collaboratorId)
          .eq('project_id', projectId)
          .select()
          .single();

        if (removeError) throw removeError;

        await supabase.from('project_activity_logs').insert({
          project_id: projectId,
          user_id: user.id,
          action_type: 'collaborator_removed',
          target_user_id: removeData.user_id,
        });

        result = removeData;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error managing collaborator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
