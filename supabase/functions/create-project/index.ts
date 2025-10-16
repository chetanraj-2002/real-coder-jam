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

    const { title, description, files } = await req.json();

    if (!title) {
      throw new Error('Project title is required');
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        owner_id: user.id,
        owner_email: user.email,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Create initial files if provided
    if (files && Array.isArray(files) && files.length > 0) {
      const fileRecords = files.map((file: any) => ({
        project_id: project.id,
        filename: file.filename || 'untitled.js',
        file_path: file.file_path || '/',
        content: file.content || '',
        language: file.language || 'javascript',
      }));

      const { error: filesError } = await supabase
        .from('project_files')
        .insert(fileRecords);

      if (filesError) throw filesError;
    } else {
      // Create default file if none provided
      const { error: defaultFileError } = await supabase
        .from('project_files')
        .insert({
          project_id: project.id,
          filename: 'index.js',
          file_path: '/',
          content: '// Welcome to your new project\nconsole.log("Hello, World!");',
          language: 'javascript',
        });

      if (defaultFileError) throw defaultFileError;
    }

    return new Response(
      JSON.stringify({ project }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
