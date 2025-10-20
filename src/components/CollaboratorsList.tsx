import { useCollaborators } from "@/hooks/useCollaborators";
import { useProject } from "@/hooks/useProject";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Crown, MoreVertical, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CollaboratorsListProps {
  projectId: string;
}

export default function CollaboratorsList({ projectId }: CollaboratorsListProps) {
  const { collaborators, loading, removeCollaborator } = useCollaborators(projectId);
  const { project, isOwner } = useProject(projectId);
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const handleInvite = async () => {
    try {
      const { error } = await supabase.functions.invoke("manage-collaborator", {
        body: {
          action: "add",
          projectId,
          userEmail: inviteEmail,
          permissionLevel: "editor",
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collaborator invited successfully",
      });
      setInviteEmail("");
      setInviteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invite collaborator",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading collaborators...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Team</h3>
        {isOwner && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <UserPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
                <DialogDescription>
                  Add a team member to collaborate on this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite}>Send Invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {/* Owner */}
        {project && (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {project.owner_email?.charAt(0).toUpperCase() || "O"}
                </AvatarFallback>
              </Avatar>
              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-green-500 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Owner</p>
              <p className="text-xs text-muted-foreground truncate">
                {project.owner_email}
              </p>
            </div>
            <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          </div>
        )}

        {/* Collaborators */}
        {collaborators.map((collab) => (
          <div
            key={collab.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {collab.user_name?.charAt(0) || collab.user_email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {collab.is_active && (
                <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-green-500 fill-current" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {collab.user_name || "Anonymous"}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground truncate">
                  {collab.user_email}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {collab.permission_level}
                </Badge>
              </div>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => removeCollaborator(collab.id)}
                    className="text-destructive"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
        
        {collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No collaborators yet
          </p>
        )}
      </div>
    </div>
  );
}
