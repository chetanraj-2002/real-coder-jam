-- Comprehensive fix for user ID types from UUID to TEXT
-- Must drop policies, triggers, and functions before altering column types

-- Step 1: Drop triggers that reference user_id columns
DROP TRIGGER IF EXISTS log_file_lock_trigger ON public.project_files;
DROP TRIGGER IF EXISTS update_project_files_updated_at ON public.project_files;

-- Step 2: Drop all RLS policies
DROP POLICY IF EXISTS "Users can view projects they own or collaborate on" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Only project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only project owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON public.project_collaborators;
DROP POLICY IF EXISTS "Only project owners can add collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Only project owners can update collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Only project owners can remove collaborators" ON public.project_collaborators;
DROP POLICY IF EXISTS "Users can view files in their projects" ON public.project_files;
DROP POLICY IF EXISTS "Project owners can create files" ON public.project_files;
DROP POLICY IF EXISTS "Users with permission can update files" ON public.project_files;
DROP POLICY IF EXISTS "Only project owners can delete files" ON public.project_files;
DROP POLICY IF EXISTS "Users can view their own file permissions" ON public.file_permissions;
DROP POLICY IF EXISTS "Only project owners can grant file permissions" ON public.file_permissions;
DROP POLICY IF EXISTS "Only project owners can update file permissions" ON public.file_permissions;
DROP POLICY IF EXISTS "Only project owners can revoke file permissions" ON public.file_permissions;
DROP POLICY IF EXISTS "Users can view versions of accessible files" ON public.file_versions;
DROP POLICY IF EXISTS "System can create file versions" ON public.file_versions;
DROP POLICY IF EXISTS "Users can view relevant access requests" ON public.file_access_requests;
DROP POLICY IF EXISTS "Users can create access requests" ON public.file_access_requests;
DROP POLICY IF EXISTS "Current editor or owner can respond to requests" ON public.file_access_requests;
DROP POLICY IF EXISTS "Requester can cancel their own requests" ON public.file_access_requests;
DROP POLICY IF EXISTS "Users can view activity logs of their projects" ON public.project_activity_logs;
DROP POLICY IF EXISTS "System can create activity logs" ON public.project_activity_logs;
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Anyone can manage room participants" ON public.room_participants;

-- Step 3: Drop functions
DROP FUNCTION IF EXISTS public.is_project_owner(TEXT, UUID);
DROP FUNCTION IF EXISTS public.is_project_collaborator(TEXT, UUID);
DROP FUNCTION IF EXISTS public.can_edit_file(TEXT, UUID);

-- Step 4: Alter column types to TEXT
ALTER TABLE public.projects ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE public.project_collaborators ALTER COLUMN user_id TYPE TEXT, ALTER COLUMN invited_by TYPE TEXT;
ALTER TABLE public.project_files ALTER COLUMN locked_by TYPE TEXT;
ALTER TABLE public.file_permissions ALTER COLUMN granted_by TYPE TEXT;
ALTER TABLE public.file_versions ALTER COLUMN edited_by TYPE TEXT;
ALTER TABLE public.file_access_requests 
  ALTER COLUMN requester_id TYPE TEXT,
  ALTER COLUMN current_editor_id TYPE TEXT,
  ALTER COLUMN responded_by TYPE TEXT;
ALTER TABLE public.project_activity_logs 
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN target_user_id TYPE TEXT;
ALTER TABLE public.rooms ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE public.room_participants ALTER COLUMN user_id TYPE TEXT;

-- Step 5: Recreate helper functions
CREATE FUNCTION public.is_project_owner(_user_id TEXT, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = _user_id
  )
$$;

CREATE FUNCTION public.is_project_collaborator(_user_id TEXT, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = _project_id AND user_id = _user_id AND is_active = true
  )
$$;

CREATE FUNCTION public.can_edit_file(_user_id TEXT, _file_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_files pf
    JOIN public.projects p ON pf.project_id = p.id
    LEFT JOIN public.project_collaborators pc ON pc.project_id = p.id AND pc.user_id = _user_id
    LEFT JOIN public.file_permissions fp ON fp.file_id = _file_id AND fp.collaborator_id = pc.id
    WHERE pf.id = _file_id
    AND (p.owner_id = _user_id OR (pc.is_active = true AND fp.can_edit = true))
  )
$$;

-- Step 6: Recreate triggers
CREATE TRIGGER log_file_lock_trigger
  AFTER UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION public.log_file_lock_activity();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 7: Recreate all RLS policies
CREATE POLICY "Users can view projects they own or collaborate on" ON public.projects FOR SELECT
  USING (owner_id = (auth.jwt() ->> 'sub'::text) OR is_project_collaborator((auth.jwt() ->> 'sub'::text), id));

CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT
  WITH CHECK (owner_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Only project owners can update projects" ON public.projects FOR UPDATE
  USING (owner_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Only project owners can delete projects" ON public.projects FOR DELETE
  USING (owner_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Users can view collaborators of their projects" ON public.project_collaborators FOR SELECT
  USING (is_project_owner((auth.jwt() ->> 'sub'::text), project_id) OR user_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Only project owners can add collaborators" ON public.project_collaborators FOR INSERT
  WITH CHECK (is_project_owner((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "Only project owners can update collaborators" ON public.project_collaborators FOR UPDATE
  USING (is_project_owner((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "Only project owners can remove collaborators" ON public.project_collaborators FOR DELETE
  USING (is_project_owner((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "Users can view files in their projects" ON public.project_files FOR SELECT
  USING (is_project_owner((auth.jwt() ->> 'sub'::text), project_id) OR is_project_collaborator((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "Project owners can create files" ON public.project_files FOR INSERT
  WITH CHECK (is_project_owner((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "Users with permission can update files" ON public.project_files FOR UPDATE
  USING (can_edit_file((auth.jwt() ->> 'sub'::text), id));

CREATE POLICY "Only project owners can delete files" ON public.project_files FOR DELETE
  USING (is_project_owner((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "Users can view their own file permissions" ON public.file_permissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_collaborators pc
    JOIN project_files pf ON pf.id = file_permissions.file_id
    WHERE pc.id = file_permissions.collaborator_id
    AND (is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id) OR pc.user_id = (auth.jwt() ->> 'sub'::text))
  ));

CREATE POLICY "Only project owners can grant file permissions" ON public.file_permissions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM project_files pf WHERE pf.id = file_permissions.file_id AND is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id)));

CREATE POLICY "Only project owners can update file permissions" ON public.file_permissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM project_files pf WHERE pf.id = file_permissions.file_id AND is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id)));

CREATE POLICY "Only project owners can revoke file permissions" ON public.file_permissions FOR DELETE
  USING (EXISTS (SELECT 1 FROM project_files pf WHERE pf.id = file_permissions.file_id AND is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id)));

CREATE POLICY "Users can view versions of accessible files" ON public.file_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_files pf WHERE pf.id = file_versions.file_id AND (is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id) OR is_project_collaborator((auth.jwt() ->> 'sub'::text), pf.project_id))));

CREATE POLICY "System can create file versions" ON public.file_versions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view relevant access requests" ON public.file_access_requests FOR SELECT
  USING (requester_id = (auth.jwt() ->> 'sub'::text) OR current_editor_id = (auth.jwt() ->> 'sub'::text) OR EXISTS (SELECT 1 FROM project_files pf WHERE pf.id = file_access_requests.file_id AND is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id)));

CREATE POLICY "Users can create access requests" ON public.file_access_requests FOR INSERT
  WITH CHECK (requester_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Current editor or owner can respond to requests" ON public.file_access_requests FOR UPDATE
  USING (current_editor_id = (auth.jwt() ->> 'sub'::text) OR EXISTS (SELECT 1 FROM project_files pf WHERE pf.id = file_access_requests.file_id AND is_project_owner((auth.jwt() ->> 'sub'::text), pf.project_id)));

CREATE POLICY "Requester can cancel their own requests" ON public.file_access_requests FOR DELETE
  USING (requester_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Users can view activity logs of their projects" ON public.project_activity_logs FOR SELECT
  USING (is_project_owner((auth.jwt() ->> 'sub'::text), project_id) OR is_project_collaborator((auth.jwt() ->> 'sub'::text), project_id));

CREATE POLICY "System can create activity logs" ON public.project_activity_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can view room participants" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can manage room participants" ON public.room_participants FOR ALL USING (true);

-- Step 8: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_files_locked_by ON public.project_files(locked_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.project_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON public.rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);