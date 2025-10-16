import { useParams } from "react-router-dom";
import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import FileTree from "@/components/FileTree";
import CollaboratorsList from "@/components/CollaboratorsList";
import { CodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Workspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, loading } = useProject(projectId!);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [code, setCode] = useState("");

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
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r overflow-y-auto">
          <FileTree projectId={projectId!} />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            {selectedFile ? (
              <CodeEditor
                value={code}
                onChange={setCode}
                language={selectedFile.language || "javascript"}
                roomId={projectId!}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a file to start editing
              </div>
            )}
          </div>
        </div>

        <div className="w-64 border-l overflow-y-auto">
          <CollaboratorsList projectId={projectId!} />
        </div>
      </div>
    </div>
  );
}
