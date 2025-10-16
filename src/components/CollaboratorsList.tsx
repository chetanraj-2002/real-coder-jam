import { useCollaborators } from "@/hooks/useCollaborators";
import { useProject } from "@/hooks/useProject";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface CollaboratorsListProps {
  projectId: string;
}

export default function CollaboratorsList({ projectId }: CollaboratorsListProps) {
  const { collaborators, loading } = useCollaborators(projectId);
  const { project, isOwner } = useProject(projectId);

  if (loading) {
    return <div className="p-4">Loading collaborators...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Collaborators</h3>
        {isOwner && (
          <Button size="sm" variant="ghost">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Owner */}
        {project && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {project.owner_email?.charAt(0).toUpperCase() || "O"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Owner</div>
              <div className="text-xs text-muted-foreground truncate">
                {project.owner_email}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Owner</Badge>
          </div>
        )}

        {/* Collaborators */}
        {collaborators.map((collaborator) => (
          <div key={collaborator.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {collaborator.user_email?.charAt(0).toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {collaborator.user_name || "Collaborator"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {collaborator.user_email}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {collaborator.permission_level}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
