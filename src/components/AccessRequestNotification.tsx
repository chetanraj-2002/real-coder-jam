import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell } from "lucide-react";

interface AccessRequestNotificationProps {
  open: boolean;
  onClose: () => void;
  requesterName: string;
  fileName: string;
  message?: string;
  onApprove: () => void;
  onDeny: () => void;
}

export default function AccessRequestNotification({
  open,
  onClose,
  requesterName,
  fileName,
  message,
  onApprove,
  onDeny,
}: AccessRequestNotificationProps) {
  const handleApprove = () => {
    onApprove();
    onClose();
  };

  const handleDeny = () => {
    onDeny();
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <AlertDialogTitle>Access Request</AlertDialogTitle>
              <AlertDialogDescription>
                Someone wants to edit your file
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm">
              <span className="font-medium text-foreground">{requesterName}</span>{" "}
              is requesting access to edit{" "}
              <span className="font-medium text-foreground">{fileName}</span>
            </p>
          </div>

          {message && (
            <div className="rounded-lg border bg-background p-3">
              <p className="text-sm text-muted-foreground italic">"{message}"</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Approving will transfer editing control to them and your editor will become read-only.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDeny}>Deny</AlertDialogCancel>
          <AlertDialogAction onClick={handleApprove}>
            Approve & Transfer Control
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
