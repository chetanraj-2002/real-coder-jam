import { Users, Crown, Dot, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Participant {
  id: string;
  name: string;
  email: string;
  cursor?: {
    line: number;
    column: number;
  };
  isOwner?: boolean;
}

interface ParticipantsPanelProps {
  participants: Participant[];
  isOwner: boolean;
  currentUserId?: string;
  onRemove?: (userId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function ParticipantsPanel({ 
  participants, 
  isOwner, 
  currentUserId, 
  onRemove, 
  onClose,
  className 
}: ParticipantsPanelProps) {
  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Participants ({participants.length})</span>
          <div className="flex-1" />
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Close participants"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4 pt-0">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <Dot className="h-4 w-4 text-accent animate-pulse" />
                    {participant.isOwner && (
                      <Crown className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {participant.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {participant.cursor && (
                    <Badge variant="secondary" className="text-xs">
                      {participant.cursor.line}:{participant.cursor.column}
                    </Badge>
                  )}
                  {isOwner && onRemove && participant.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(participant.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No participants yet
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}