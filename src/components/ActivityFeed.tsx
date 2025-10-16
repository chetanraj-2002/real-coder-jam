import { useActivityLog } from "@/hooks/useActivityLog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileEdit, Lock, Unlock, UserPlus, UserMinus, Shield, GitCommit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  projectId: string;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case "file_locked":
      return <Lock className="h-4 w-4 text-red-500" />;
    case "file_unlocked":
      return <Unlock className="h-4 w-4 text-green-500" />;
    case "file_edited":
      return <FileEdit className="h-4 w-4 text-blue-500" />;
    case "collaborator_added":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "collaborator_removed":
      return <UserMinus className="h-4 w-4 text-red-500" />;
    case "permission_changed":
      return <Shield className="h-4 w-4 text-yellow-500" />;
    case "version_created":
    case "version_restored":
      return <GitCommit className="h-4 w-4 text-purple-500" />;
    default:
      return <FileEdit className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActivityDescription = (activity: any) => {
  const userName = activity.user_name || "User";
  
  switch (activity.action_type) {
    case "file_locked":
      return `${userName} started editing ${activity.metadata?.filename || "a file"}`;
    case "file_unlocked":
      return `${userName} stopped editing ${activity.metadata?.filename || "a file"}`;
    case "file_edited":
      return `${userName} edited ${activity.metadata?.filename || "a file"}`;
    case "collaborator_added":
      return `${userName} added ${activity.metadata?.user_email || "a collaborator"}`;
    case "collaborator_removed":
      return `${userName} removed a collaborator`;
    case "permission_changed":
      return `${userName} changed permissions`;
    case "version_created":
      return `${userName} created a version snapshot`;
    case "version_restored":
      return `${userName} restored version ${activity.metadata?.from_version}`;
    case "file_access_granted":
      return `${userName} granted file access`;
    default:
      return `${userName} performed an action`;
  }
};

export default function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { activities, loading } = useActivityLog(projectId);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading activity...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Activity Feed</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No activity yet
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{getActivityDescription(activity)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
