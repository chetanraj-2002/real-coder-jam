import { useState } from "react";
import { Users, Crown, Dot, X, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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
  className?: string;
}

export function ParticipantsPanel({ participants, isOwner, currentUserId, onRemove, className }: ParticipantsPanelProps) {
  const [panelState, setPanelState] = useState<'open' | 'closed'>('open');

  if (panelState === 'closed') {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setPanelState('open')}
          aria-label="Open participants"
          className="h-10 w-10 rounded-full shadow-lg relative"
        >
          <Users className="h-5 w-5" />
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-4 rounded-full">
            {participants.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed right-0 top-20 bottom-0 w-[90vw] max-w-[22rem] sm:max-w-[20rem] z-40 ${className}`}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={100} minSize={20}>
          <Card className="h-full rounded-lg border shadow-lg bg-card">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Participants ({participants.length})</span>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPanelState('closed')}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Close participants"
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            {panelState === 'open' && (
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
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
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No participants yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </ResizablePanel>
        <ResizableHandle withHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />
      </ResizablePanelGroup>
    </div>
  );
}