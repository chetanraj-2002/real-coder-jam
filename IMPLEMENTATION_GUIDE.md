# LineCraft - Collaborative Code Editor

## Project Overview

LineCraft is a real-time collaborative code editing platform built with React, TypeScript, Supabase, and Clerk authentication. It enables teams to work together on code projects with fine-grained file locking, access control, and live collaboration features.

## Implementation Stages Completed

### Stage 1: Database Schema & Security
- ✅ Created comprehensive database schema with 8 tables
- ✅ Implemented Row-Level Security (RLS) policies for all tables
- ✅ Added database functions for permission checking
- ✅ Set up triggers for activity logging and version control
- ✅ Implemented file locking mechanism with stale lock cleanup

### Stage 2: Backend Edge Functions
- ✅ `create-project`: Creates new projects with proper ownership
- ✅ `manage-collaborator`: Add, remove, update team members
- ✅ `manage-file-lock`: Acquire, release, and heartbeat file locks
- ✅ `manage-access-request`: Handle file access requests with approval flow
- ✅ `manage-file-version`: Version control and rollback functionality

### Stage 3: Frontend Components & UI
- ✅ Projects dashboard for project management
- ✅ Workspace page with Monaco code editor integration
- ✅ File tree with lock status indicators
- ✅ Collaborators list with real-time presence
- ✅ Activity feed for project events
- ✅ Access request notification system
- ✅ File lock modal for requesting access
- ✅ Custom hooks for all major features

### Stage 4: Real-time Integration
- ✅ Supabase Realtime for presence tracking
- ✅ Live code synchronization across users
- ✅ Cursor position sharing
- ✅ File lock acquisition/release events
- ✅ Access request real-time notifications
- ✅ Participant management

### Stage 5: Polish & Authentication
- ✅ Protected routes with authentication guards
- ✅ Connection status indicator with participant count
- ✅ Keyboard shortcuts (Ctrl+S for save)
- ✅ Loading skeletons for better UX
- ✅ Error boundaries for graceful error handling
- ✅ Toast notifications for user feedback
- ✅ Responsive design improvements

## Key Features

### 1. Project Management
- Create and manage multiple code projects
- Project ownership and access control
- Team collaboration with role-based permissions

### 2. File Management
- Create, edit, and delete files
- File locking to prevent conflicts
- Version history and rollback
- Real-time file status indicators

### 3. Collaboration
- Real-time presence awareness
- Live code synchronization
- Cursor position sharing
- Activity feed for team actions
- Access request system for locked files

### 4. Code Editing
- Monaco Editor integration
- Syntax highlighting for multiple languages
- Auto-save functionality
- Read-only mode when file is locked

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** with custom design system
- **Shadcn UI** component library
- **Monaco Editor** for code editing
- **React Router** for navigation
- **Clerk** for authentication

### Backend Stack
- **Supabase** for database and real-time
- **PostgreSQL** with RLS policies
- **Edge Functions** for serverless logic
- **Supabase Realtime** for live updates

### Security Features
- Row-Level Security on all tables
- Authentication required for all protected routes
- Fine-grained file permissions
- Access request approval workflow
- Activity logging for audit trail

## Database Schema

### Core Tables
1. **projects**: Project metadata and ownership
2. **project_files**: File content and lock status
3. **project_collaborators**: Team members and permissions
4. **file_permissions**: Fine-grained file access control
5. **file_access_requests**: Request workflow for locked files
6. **file_versions**: Version history for rollback
7. **project_activity_logs**: Audit trail of all actions
8. **rooms**: Legacy room-based editing (for /editor route)

## Real-time Features

### Supabase Realtime Channels
- **Project channels**: `project:{projectId}`
  - User presence tracking
  - Participant join/leave events
  - Broadcast events for collaboration

### Broadcast Events
- `code-change`: Live code synchronization
- `cursor-change`: Cursor position updates
- `file-lock-acquired`: Lock status updates
- `file-lock-released`: Lock release notifications
- `access-request-sent`: New access requests
- `collaborator-added`: Team member updates

## Usage Guide

### For Users

#### Creating a Project
1. Navigate to `/projects`
2. Click "New Project"
3. Enter project title and description
4. Click "Create Project"

#### Editing Files
1. Select a project from dashboard
2. Click on a file in the file tree
3. System will attempt to acquire lock
4. Edit code in Monaco editor
5. Press Ctrl+S or click Save to persist changes

#### Requesting File Access
1. Click on a locked file
2. Modal will appear showing current editor
3. Enter optional message
4. Click "Request Access"
5. Wait for approval from current editor

#### Adding Collaborators
1. Open project workspace
2. Click "+" icon in Team tab
3. Enter collaborator email
4. Select permission level
5. Click "Send Invite"

### For Developers

#### Running Locally
```bash
npm install
npm run dev
```

#### Environment Variables
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

#### Database Migrations
All migrations are in `supabase/migrations/`
They are automatically applied on deployment.

## API Reference

### Edge Functions

#### create-project
- **Method**: POST
- **Auth**: Required
- **Body**: `{ title, description }`
- **Returns**: Created project object

#### manage-collaborator
- **Method**: POST
- **Auth**: Required (Owner only)
- **Actions**: `add`, `remove`, `update`
- **Body**: `{ action, projectId, userEmail, permissionLevel }`

#### manage-file-lock
- **Method**: POST
- **Auth**: Required
- **Actions**: `acquire`, `release`, `heartbeat`
- **Body**: `{ action, fileId, content? }`

#### manage-access-request
- **Method**: POST
- **Auth**: Required
- **Actions**: `create`, `approve`, `deny`
- **Body**: `{ action, requestId?, fileId?, message? }`

## Testing Checklist

### Authentication
- [x] Sign in redirects to dashboard
- [x] Sign out clears session
- [x] Protected routes require auth
- [x] User profile loads correctly

### Project Management
- [x] Create project
- [x] View project list
- [x] Open project workspace
- [x] Delete project (owner only)

### File Operations
- [x] Create new file
- [x] Open file for editing
- [x] Save file changes
- [x] Lock acquisition on file open
- [x] Lock release on save/close

### Collaboration
- [x] Add collaborator
- [x] Remove collaborator
- [x] Real-time presence updates
- [x] Code synchronization
- [x] Cursor position sharing
- [x] Access request workflow

### Real-time
- [x] Connection status indicator
- [x] Participant count updates
- [x] Live activity feed
- [x] Lock status updates

## Known Limitations

1. File content saved only on explicit save (Ctrl+S)
2. Maximum 10 participants per project (configurable)
3. Lock expires after 30 minutes of inactivity
4. No conflict resolution for simultaneous edits

## Future Enhancements

- [ ] Real-time typing indicators
- [ ] Code comments and annotations
- [ ] Integrated terminal
- [ ] Git integration
- [ ] Code search across project
- [ ] Custom editor themes
- [ ] Mobile app version
- [ ] Voice/video chat integration

## Support

For issues or questions:
- Check the activity logs for debugging
- Review Edge Function logs in Supabase dashboard
- Check browser console for client-side errors

## License

This project is part of a collaborative coding platform demonstration.
