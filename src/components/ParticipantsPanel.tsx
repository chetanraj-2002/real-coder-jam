import { useState } from "react";
import { Users, Crown, Dot, ChevronRight, ChevronDown, X, PanelRightOpen } from "lucide-react";
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
  className?: string;
}

export function ParticipantsPanel({ participants, isOwner, currentUserId, onRemove, className }: ParticipantsPanelProps) {
  const [panelState, setPanelState] = useState<'open' | 'minimized' | 'closed'>('open');

  if (panelState === 'closed') {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPanelState('open')}
          className="rounded-l-md rounded-r-none border-r-0 px-2 py-6 flex flex-col gap-1 bg-card/95 backdrop-blur-sm"
        >
          <PanelRightOpen className="h-4 w-4" />
          <div className="text-xs font-medium writing-mode-vertical-rl transform rotate-180">
            Participants
          </div>
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {participants.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <Card className={`border-l border-border transition-all duration-200 ${panelState === 'minimized' ? 'w-12' : 'w-64'} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelState(panelState === 'minimized' ? 'open' : 'minimized')}
            className="h-6 w-6 p-0"
          >
            {panelState === 'minimized' ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          {panelState === 'open' && (
            <>
              <Users className="h-4 w-4" />
              <span>Participants ({participants.length})</span>
            </>
          )}
          {panelState === 'minimized' && <Users className="h-4 w-4" />}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelState('closed')}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      {panelState === 'open' && (
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
  );
}