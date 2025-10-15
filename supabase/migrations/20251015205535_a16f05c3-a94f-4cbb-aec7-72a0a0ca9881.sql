-- =====================================================
-- STAGE 1: Multi-File Project Workspace Database Schema
-- =====================================================

-- Create enum for collaborator permission levels
CREATE TYPE public.collaborator_permission AS ENUM ('read_only', 'edit', 'priority_edit');

-- Create enum for access request status
CREATE TYPE public.access_request_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');

-- =====================================================
-- TABLES
-- =====================================================

-- Projects table (enhanced rooms)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  owner_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Project files table
CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT DEFAULT '/',
  content TEXT,
  language TEXT DEFAULT 'javascript',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  UNIQUE(project_id, file_path, filename)
);

-- Project collaborators table
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  permission_level collaborator_permission DEFAULT 'read_only',
  invited_by TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(project_id, user_id)
);

-- File permissions table (granular per-file permissions)
CREATE TABLE public.file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.project_collaborators(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  can_request_access BOOLEAN DEFAULT true,
  granted_by TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, collaborator_id)
);

-- File access requests table
CREATE TABLE public.file_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL,
  current_editor_id TEXT NOT NULL,
  message TEXT,
  status access_request_status DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by TEXT
);

-- File versions table (version history)
CREATE TABLE public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  edited_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  commit_message TEXT,
  UNIQUE(file_id, version_number)
);

-- Project activity logs table
CREATE TABLE public.project_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  action_type TEXT NOT NULL,
  target_file_id UUID,
  target_user_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX idx_project_files_locked_by ON public.project_files(locked_by);
CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_file_permissions_file_id ON public.file_permissions(file_id);
CREATE INDEX idx_file_access_requests_file_id ON public.file_access_requests(file_id);
CREATE INDEX idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX idx_activity_logs_project_id ON public.project_activity_logs(project_id);

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Check if user is project owner
CREATE OR REPLACE FUNCTION public.is_project_owner(_user_id TEXT, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND owner_id = _user_id
  )
$$;

-- Check if user is project collaborator
CREATE OR REPLACE FUNCTION public.is_project_collaborator(_user_id TEXT, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_collaborators
    WHERE project_id = _project_id AND user_id = _user_id AND is_active = true
  )
$$;

-- Check if user can edit a specific file
CREATE OR REPLACE FUNCTION public.can_edit_file(_user_id TEXT, _file_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_files pf
    JOIN public.projects p ON pf.project_id = p.id
    LEFT JOIN public.project_collaborators pc ON pc.project_id = p.id AND pc.user_id = _user_id
    LEFT JOIN public.file_permissions fp ON fp.file_id = _file_id AND fp.collaborator_id = pc.id
    WHERE pf.id = _file_id
    AND (
      p.owner_id = _user_id
      OR (pc.is_active = true AND fp.can_edit = true)
    )
  )
$$;

-- Auto-unlock stale files (files locked for > 30 minutes)
CREATE OR REPLACE FUNCTION public.unlock_stale_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.project_files
  SET locked_by = NULL, locked_at = NULL
  WHERE locked_at < NOW() - INTERVAL '30 minutes';
END;
$$;

-- Update project updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_project_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET updated_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

-- Log file lock activity
CREATE OR REPLACE FUNCTION public.log_file_lock_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.locked_by IS DISTINCT FROM OLD.locked_by THEN
    INSERT INTO public.project_activity_logs (
      project_id,
      user_id,
      action_type,
      target_file_id,
      metadata
    )
    SELECT
      pf.project_id,
      COALESCE(NEW.locked_by, OLD.locked_by),
      CASE WHEN NEW.locked_by IS NULL THEN 'file_unlocked' ELSE 'file_locked' END,
      NEW.id,
      jsonb_build_object('filename', NEW.filename, 'file_path', NEW.file_path)
    FROM public.project_files pf
    WHERE pf.id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Increment file version on content change
CREATE OR REPLACE FUNCTION public.increment_file_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.version = OLD.version + 1;
    NEW.updated_at = now();
    
    -- Create version snapshot
    INSERT INTO public.file_versions (
      file_id,
      version_number,
      content,
      edited_by,
      commit_message
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.content,
      NEW.locked_by,
      'Auto-save version ' || NEW.version
    );
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update project timestamp when files change
CREATE TRIGGER update_project_timestamp_trigger
AFTER INSERT OR UPDATE ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.update_project_timestamp();

-- Log file lock changes
CREATE TRIGGER log_file_lock_trigger
AFTER UPDATE OF locked_by ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.log_file_lock_activity();

-- Auto-increment version on content change
CREATE TRIGGER increment_file_version_trigger
BEFORE UPDATE OF content ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.increment_file_version();

-- Update updated_at on project_files
CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity_logs ENABLE ROW LEVEL SECURITY;

-- PROJECTS table policies
CREATE POLICY "Users can view projects they own or collaborate on"
ON public.projects FOR SELECT
USING (
  owner_id = auth.jwt() ->> 'sub'
  OR public.is_project_collaborator(auth.jwt() ->> 'sub', id)
);

CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT
WITH CHECK (owner_id = auth.jwt() ->> 'sub');

CREATE POLICY "Only project owners can update projects"
ON public.projects FOR UPDATE
USING (owner_id = auth.jwt() ->> 'sub');

CREATE POLICY "Only project owners can delete projects"
ON public.projects FOR DELETE
USING (owner_id = auth.jwt() ->> 'sub');

-- PROJECT_FILES table policies
CREATE POLICY "Users can view files in their projects"
ON public.project_files FOR SELECT
USING (
  public.is_project_owner(auth.jwt() ->> 'sub', project_id)
  OR public.is_project_collaborator(auth.jwt() ->> 'sub', project_id)
);

CREATE POLICY "Project owners can create files"
ON public.project_files FOR INSERT
WITH CHECK (public.is_project_owner(auth.jwt() ->> 'sub', project_id));

CREATE POLICY "Users with permission can update files"
ON public.project_files FOR UPDATE
USING (public.can_edit_file(auth.jwt() ->> 'sub', id));

CREATE POLICY "Only project owners can delete files"
ON public.project_files FOR DELETE
USING (public.is_project_owner(auth.jwt() ->> 'sub', project_id));

-- PROJECT_COLLABORATORS table policies
CREATE POLICY "Users can view collaborators of their projects"
ON public.project_collaborators FOR SELECT
USING (
  public.is_project_owner(auth.jwt() ->> 'sub', project_id)
  OR user_id = auth.jwt() ->> 'sub'
);

CREATE POLICY "Only project owners can add collaborators"
ON public.project_collaborators FOR INSERT
WITH CHECK (public.is_project_owner(auth.jwt() ->> 'sub', project_id));

CREATE POLICY "Only project owners can update collaborators"
ON public.project_collaborators FOR UPDATE
USING (public.is_project_owner(auth.jwt() ->> 'sub', project_id));

CREATE POLICY "Only project owners can remove collaborators"
ON public.project_collaborators FOR DELETE
USING (public.is_project_owner(auth.jwt() ->> 'sub', project_id));

-- FILE_PERMISSIONS table policies
CREATE POLICY "Users can view their own file permissions"
ON public.file_permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    JOIN public.project_files pf ON pf.id = file_id
    WHERE pc.id = collaborator_id
    AND (
      public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
      OR pc.user_id = auth.jwt() ->> 'sub'
    )
  )
);

CREATE POLICY "Only project owners can grant file permissions"
ON public.file_permissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_files pf
    WHERE pf.id = file_id
    AND public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
  )
);

CREATE POLICY "Only project owners can update file permissions"
ON public.file_permissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_files pf
    WHERE pf.id = file_id
    AND public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
  )
);

CREATE POLICY "Only project owners can revoke file permissions"
ON public.file_permissions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_files pf
    WHERE pf.id = file_id
    AND public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
  )
);

-- FILE_ACCESS_REQUESTS table policies
CREATE POLICY "Users can view relevant access requests"
ON public.file_access_requests FOR SELECT
USING (
  requester_id = auth.jwt() ->> 'sub'
  OR current_editor_id = auth.jwt() ->> 'sub'
  OR EXISTS (
    SELECT 1 FROM public.project_files pf
    WHERE pf.id = file_id
    AND public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
  )
);

CREATE POLICY "Users can create access requests"
ON public.file_access_requests FOR INSERT
WITH CHECK (requester_id = auth.jwt() ->> 'sub');

CREATE POLICY "Current editor or owner can respond to requests"
ON public.file_access_requests FOR UPDATE
USING (
  current_editor_id = auth.jwt() ->> 'sub'
  OR EXISTS (
    SELECT 1 FROM public.project_files pf
    WHERE pf.id = file_id
    AND public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
  )
);

CREATE POLICY "Requester can cancel their own requests"
ON public.file_access_requests FOR DELETE
USING (requester_id = auth.jwt() ->> 'sub');

-- FILE_VERSIONS table policies
CREATE POLICY "Users can view versions of accessible files"
ON public.file_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_files pf
    WHERE pf.id = file_id
    AND (
      public.is_project_owner(auth.jwt() ->> 'sub', pf.project_id)
      OR public.is_project_collaborator(auth.jwt() ->> 'sub', pf.project_id)
    )
  )
);

CREATE POLICY "System can create file versions"
ON public.file_versions FOR INSERT
WITH CHECK (true);

-- PROJECT_ACTIVITY_LOGS table policies
CREATE POLICY "Users can view activity logs of their projects"
ON public.project_activity_logs FOR SELECT
USING (
  public.is_project_owner(auth.jwt() ->> 'sub', project_id)
  OR public.is_project_collaborator(auth.jwt() ->> 'sub', project_id)
);

CREATE POLICY "System can create activity logs"
ON public.project_activity_logs FOR INSERT
WITH CHECK (true);