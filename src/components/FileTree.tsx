import { useProjectFiles } from "@/hooks/useProjectFiles";
import { File, FolderOpen, Lock, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  projectId: string;
}

export default function FileTree({ projectId }: FileTreeProps) {
  const { files, loading } = useProjectFiles(projectId);

  if (loading) {
    return <div className="p-4">Loading files...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Files</h3>
        <Button size="sm" variant="ghost">
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {files.map((file) => (
          <Button
            key={file.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 font-normal",
              file.locked_by && "opacity-60"
            )}
          >
            <File className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{file.filename}</span>
            {file.locked_by ? (
              <Lock className="h-3 w-3 ml-auto flex-shrink-0 text-red-500" />
            ) : (
              <Circle className="h-3 w-3 ml-auto flex-shrink-0 text-green-500 fill-current" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
