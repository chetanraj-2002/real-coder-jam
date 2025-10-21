import { useProjectFiles } from "@/hooks/useProjectFiles";
import { File, FolderOpen, Folder, Lock, Circle, Plus, FileText, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface FileTreeProps {
  projectId: string;
  onFileSelect?: (file: any) => void;
  selectedFileId?: string;
}

export default function FileTree({ projectId, onFileSelect, selectedFileId }: FileTreeProps) {
  const { files, loading, createFile, deleteFile } = useProjectFiles(projectId);
  const { toast } = useToast();
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));
  const [creatingInFolder, setCreatingInFolder] = useState<string>("/");

  // Organize files into folder structure
  const fileStructure = useMemo(() => {
    const structure: { [key: string]: any[] } = {};
    
    files.forEach((file) => {
      const path = file.file_path || "/";
      const folder = path.substring(0, path.lastIndexOf("/") + 1) || "/";
      
      if (!structure[folder]) {
        structure[folder] = [];
      }
      structure[folder].push(file);
    });
    
    return structure;
  }, [files]);

  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    files.forEach((file) => {
      const path = file.file_path || "/";
      const parts = path.split("/").filter(Boolean);
      let currentPath = "";
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          currentPath += "/" + part;
          folderSet.add(currentPath);
        }
      });
    });
    return Array.from(folderSet).sort();
  }, [files]);

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    const filePath = creatingInFolder === "/" 
      ? `/${newFileName}` 
      : `${creatingInFolder}/${newFileName}`;

    const { error } = await createFile(
      newFileName,
      filePath,
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
      setCreatingInFolder("/");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderPath = creatingInFolder === "/" 
      ? `/${newFolderName}` 
      : `${creatingInFolder}/${newFolderName}`;

    // Create a placeholder file to establish the folder
    const { error } = await createFile(
      ".gitkeep",
      `${folderPath}/.gitkeep`,
      "",
      "text"
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
      setNewFolderName("");
      setShowNewFolder(false);
      setExpandedFolders(prev => new Set([...prev, folderPath]));
      setCreatingInFolder("/");
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    const { error } = await deleteFile(fileId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading files...</div>;
  }

  const renderFolder = (folderPath: string, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folderPath);
    const folderName = folderPath === "/" ? "root" : folderPath.split("/").filter(Boolean).pop() || "";
    const filesInFolder = fileStructure[folderPath + "/"] || [];

    return (
      <div key={folderPath}>
        <ContextMenu>
          <ContextMenuTrigger>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFolder(folderPath)}
              className="w-full justify-start gap-2 font-normal"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Folder className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{folderName}</span>
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setCreatingInFolder(folderPath);
                setShowNewFile(true);
                setShowNewFolder(false);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              New File
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setCreatingInFolder(folderPath);
                setShowNewFolder(true);
                setShowNewFile(false);
              }}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && (
          <>
            {filesInFolder.map((file) => (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileSelect?.(file)}
                    className={cn(
                      "w-full justify-start gap-2 font-normal",
                      selectedFileId === file.id && "bg-accent",
                      file.locked_by && "opacity-60"
                    )}
                    style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                  >
                    <File className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{file.filename}</span>
                    {file.locked_by ? (
                      <Lock className="h-3 w-3 ml-auto flex-shrink-0 text-destructive" />
                    ) : (
                      <Circle className="h-3 w-3 ml-auto flex-shrink-0 text-green-500 fill-current" />
                    )}
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => handleDeleteFile(file.id, file.filename)}
                    className="text-destructive"
                  >
                    Delete File
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Files</h3>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setShowNewFile(!showNewFile);
              setShowNewFolder(false);
              setCreatingInFolder("/");
            }}
            title="New File"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setShowNewFolder(!showNewFolder);
              setShowNewFile(false);
              setCreatingInFolder("/");
            }}
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showNewFile && (
        <div className="mb-4 space-y-2">
          <div className="text-xs text-muted-foreground">
            Creating in: {creatingInFolder}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile();
                if (e.key === "Escape") {
                  setShowNewFile(false);
                  setCreatingInFolder("/");
                }
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      {showNewFolder && (
        <div className="mb-4 space-y-2">
          <div className="text-xs text-muted-foreground">
            Creating in: {creatingInFolder}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") {
                  setShowNewFolder(false);
                  setCreatingInFolder("/");
                }
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {/* Root level files */}
        {(fileStructure["/"] || []).map((file) => (
          <ContextMenu key={file.id}>
            <ContextMenuTrigger>
              <Button
                variant="ghost"
                size="sm"
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
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => handleDeleteFile(file.id, file.filename)}
                className="text-destructive"
              >
                Delete File
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Folders */}
        {folders.map((folder) => renderFolder(folder, 0))}
        
        {files.length === 0 && !showNewFile && !showNewFolder && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No files yet. Create one to start!
          </p>
        )}
      </div>
    </div>
  );
}
