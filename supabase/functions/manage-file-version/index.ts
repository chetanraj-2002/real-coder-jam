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

    const { action, fileId, versionNumber, commitMessage } = await req.json();

    // Verify user has access to file
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select('project_id, content, version')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    const { data: canEdit } = await supabase.rpc('can_edit_file', {
      _user_id: user.id,
      _file_id: fileId,
    });

    if (!canEdit) {
      throw new Error('No permission to manage file versions');
    }

    let result;

    switch (action) {
      case 'create':
        // Manually create a version snapshot
        const { data: versionData, error: versionError } = await supabase
          .from('file_versions')
          .insert({
            file_id: fileId,
            version_number: file.version,
            content: file.content,
            edited_by: user.id,
            commit_message: commitMessage || 'Manual snapshot',
          })
          .select()
          .single();

        if (versionError) throw versionError;

        await supabase.from('project_activity_logs').insert({
          project_id: file.project_id,
          user_id: user.id,
          action_type: 'version_created',
          target_file_id: fileId,
          metadata: { version_number: file.version, commit_message: commitMessage },
        });

        result = versionData;
        break;

      case 'restore':
        if (!versionNumber) {
          throw new Error('Version number is required');
        }

        // Get version content
        const { data: version, error: getVersionError } = await supabase
          .from('file_versions')
          .select('content')
          .eq('file_id', fileId)
          .eq('version_number', versionNumber)
          .single();

        if (getVersionError) throw getVersionError;

        // Update file with version content and increment version
        const { data: restoreData, error: restoreError } = await supabase
          .from('project_files')
          .update({
            content: version.content,
            version: file.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fileId)
          .select()
          .single();

        if (restoreError) throw restoreError;

        // Create new version entry for the restoration
        await supabase.from('file_versions').insert({
          file_id: fileId,
          version_number: file.version + 1,
          content: version.content,
          edited_by: user.id,
          commit_message: `Restored from version ${versionNumber}`,
        });

        await supabase.from('project_activity_logs').insert({
          project_id: file.project_id,
          user_id: user.id,
          action_type: 'version_restored',
          target_file_id: fileId,
          metadata: { from_version: versionNumber, to_version: file.version + 1 },
        });

        result = restoreData;
        break;

      case 'list':
        // Get version history
        const { data: versions, error: listError } = await supabase
          .from('file_versions')
          .select('*')
          .eq('file_id', fileId)
          .order('version_number', { ascending: false });

        if (listError) throw listError;
        result = versions;
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error managing file version:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
