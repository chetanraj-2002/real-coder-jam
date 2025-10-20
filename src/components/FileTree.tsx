import { useProjectFiles } from "@/hooks/useProjectFiles";
import { File, FolderOpen, Lock, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface FileTreeProps {
  projectId: string;
  onFileSelect?: (file: any) => void;
  selectedFileId?: string;
}

export default function FileTree({ projectId, onFileSelect, selectedFileId }: FileTreeProps) {
  const { files, loading, createFile } = useProjectFiles(projectId);
  const { toast } = useToast();
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    const { error } = await createFile(
      newFileName,
      `/${newFileName}`,
      "",
      "javascript"
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "File created successfully",
      });
      setNewFileName("");
      setShowNewFile(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading files...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Files</h3>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => setShowNewFile(!showNewFile)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showNewFile && (
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="filename.js"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFile();
              if (e.key === "Escape") setShowNewFile(false);
            }}
            autoFocus
          />
        </div>
      )}

      <div className="space-y-1">
        {files.map((file) => (
          <Button
            key={file.id}
            variant="ghost"
            onClick={() => onFileSelect?.(file)}
            className={cn(
              "w-full justify-start gap-2 font-normal",
              selectedFileId === file.id && "bg-accent",
              file.locked_by && "opacity-60"
            )}
          >
            <File className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{file.filename}</span>
            {file.locked_by ? (
              <Lock className="h-3 w-3 ml-auto flex-shrink-0 text-destructive" />
            ) : (
              <Circle className="h-3 w-3 ml-auto flex-shrink-0 text-green-500 fill-current" />
            )}
          </Button>
        ))}
        
        {files.length === 0 && !showNewFile && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No files yet. Create one to start!
          </p>
        )}
      </div>
    </div>
  );
}
