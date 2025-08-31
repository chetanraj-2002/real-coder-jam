import { Users, Crown, Dot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

export function ParticipantsPanel({ participants, isOwner }: ParticipantsPanelProps) {
  if (!isOwner) return null;

  return (
    <Card className="w-64 h-full border-l border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2 p-4 pt-0">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
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
                {participant.cursor && (
                  <Badge variant="secondary" className="text-xs">
                    {participant.cursor.line}:{participant.cursor.column}
                  </Badge>
                )}
              </div>
            ))}
            {participants.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No participants yet
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}