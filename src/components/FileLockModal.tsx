import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useState } from "react";

interface FileLockModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  lockedByUser: string;
  onRequestAccess: (message?: string) => void;
}

export default function FileLockModal({
  open,
  onClose,
  fileName,
  lockedByUser,
  onRequestAccess,
}: FileLockModalProps) {
  const [message, setMessage] = useState("");
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    setRequesting(true);
    await onRequestAccess(message);
    setRequesting(false);
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Lock className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <DialogTitle>File is Locked</DialogTitle>
              <DialogDescription className="mt-1">
                {fileName} is currently being edited
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{lockedByUser}</span> is currently editing this file.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Request Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let them know why you need access..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequest}
            disabled={requesting}
            className="w-full sm:w-auto"
          >
            {requesting ? "Requesting..." : "Request Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
