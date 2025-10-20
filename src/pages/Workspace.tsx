import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useProject } from "@/hooks/useProject";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { useFileLock } from "@/hooks/useFileLock";
import { useAccessRequests } from "@/hooks/useAccessRequests";
import { useRealtime } from "@/hooks/useRealtime";
import FileTree from "@/components/FileTree";
import CollaboratorsList from "@/components/CollaboratorsList";
import ActivityFeed from "@/components/ActivityFeed";
import { CodeEditor } from "@/components/CodeEditor";
import FileLockModal from "@/components/FileLockModal";
import AccessRequestNotification from "@/components/AccessRequestNotification";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const { project, loading, isOwner } = useProject(projectId!);
  const { files } = useProjectFiles(projectId!);
  
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [code, setCode] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [pendingFileToEdit, setPendingFileToEdit] = useState<any>(null);

  const { isLocked, lockedBy, hasLock, acquireLock, releaseLock } = useFileLock(selectedFile?.id);
  const { requests, respondToRequest } = useAccessRequests(projectId!);

  // Real-time collaboration
  const { isConnected, sendCodeChange, sendCursorChange } = useRealtime({
    roomId: `project:${projectId}`,
    onCodeChange: (newCode) => {
      if (!hasLock) {
        setCode(newCode);
      }
    },
    onUserJoin: (newUser) => {
      toast({
        title: "User joined",
        description: `${newUser.user_name} joined the workspace`,
      });
    },
    onUserLeave: (userId) => {
      toast({
        title: "User left",
        description: "A user left the workspace",
      });
    },
    onParticipantsUpdate: (newParticipants) => {
      setParticipants(newParticipants);
    },
    onCursorChange: (data) => {
      // Handle cursor updates from other users
      console.log("Cursor update:", data);
    },
  });

  // Load file content when selected
  useEffect(() => {
    if (selectedFile) {
      setCode(selectedFile.content || "");
    }
  }, [selectedFile]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: any) => {
    // If already editing this file, do nothing
    if (selectedFile?.id === file.id) return;

    // Release lock on previous file if any
    if (selectedFile && hasLock) {
      await releaseLock(code);
    }

    // Check if file is locked by someone else
    if (file.locked_by && file.locked_by !== user?.id) {
      setPendingFileToEdit(file);
      setShowLockModal(true);
      return;
    }

    // Set selected file
    setSelectedFile(file);

    // Try to acquire lock if not locked
    if (!file.locked_by) {
      const result = await acquireLock();
      if (!result.success) {
        toast({
          title: "Lock failed",
          description: "Could not acquire file lock",
          variant: "destructive",
        });
      }
    }
  }, [selectedFile, hasLock, code, releaseLock, acquireLock, user, toast]);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    if (!hasLock) {
      toast({
        title: "Read-only",
        description: "You don't have edit permission for this file",
        variant: "destructive",
      });
      return;
    }

    setCode(newCode);
    sendCodeChange(newCode);
  }, [hasLock, sendCodeChange, toast]);

  // Handle cursor position changes
  const handleCursorChange = useCallback((cursor: { line: number; column: number }) => {
    sendCursorChange(cursor);
  }, [sendCursorChange]);

  // Handle access request response
  const handleAccessRequestResponse = async (requestId: string, approved: boolean) => {
    await respondToRequest(requestId, approved ? "approved" : "denied");
    
    if (approved && selectedFile && hasLock) {
      await releaseLock(code);
      setSelectedFile(null);
    }
  };

  // Find pending access request for current user
  const currentAccessRequest = requests.find(
    (req) => req.status === "pending" && req.current_editor_id === user?.id
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>Loading workspace...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>Project not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Projects
          </Button>
          <h1 className="font-semibold text-lg">{project.title}</h1>
          {isConnected && (
            <span className="text-xs text-muted-foreground">
              {participants.length} active
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r overflow-y-auto">
          <FileTree 
            projectId={projectId!} 
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFile?.id}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            {selectedFile ? (
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                language={selectedFile.language || "javascript"}
                roomId={`file:${selectedFile.id}`}
                onCursorPositionChange={handleCursorChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a file to start editing
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l overflow-y-auto">
          <Tabs defaultValue="collaborators" className="h-full">
            <TabsList className="w-full">
              <TabsTrigger value="collaborators" className="flex-1">Team</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">
                <Activity className="h-4 w-4 mr-1" />
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="collaborators" className="p-0">
              <CollaboratorsList projectId={projectId!} />
            </TabsContent>
            <TabsContent value="activity" className="p-0">
              <ActivityFeed projectId={projectId!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* File Lock Modal */}
      {showLockModal && pendingFileToEdit && (
        <FileLockModal
          open={showLockModal}
          onClose={() => {
            setShowLockModal(false);
            setPendingFileToEdit(null);
          }}
          fileName={pendingFileToEdit.filename}
          lockedByUser="Another user"
          onRequestAccess={async (message) => {
            // Create access request via edge function
            toast({
              title: "Request sent",
              description: "Waiting for approval...",
            });
            setShowLockModal(false);
          }}
        />
      )}

      {/* Access Request Notification */}
      {currentAccessRequest && (
        <AccessRequestNotification
          open={true}
          onClose={() => {}}
          requesterName={currentAccessRequest.requester_id}
          fileName={files.find((f) => f.id === currentAccessRequest.file_id)?.filename || ""}
          message={currentAccessRequest.message}
          onApprove={() => handleAccessRequestResponse(currentAccessRequest.id, true)}
          onDeny={() => handleAccessRequestResponse(currentAccessRequest.id, false)}
        />
      )}
    </div>
  );
}
