import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SignedIn, useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeEditor } from "@/components/CodeEditor";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { useSocket } from "@/hooks/useSocket";
import { useRealtime } from "@/hooks/useRealtime";
import { useRoom } from "@/hooks/useRoom";
import { useRoomOwnership } from "@/hooks/useRoomOwnership";
import { runCode, type RunCodeResult } from "@/lib/runCode";
import { 
  Code2, 
  Copy, 
  Share, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Play,
  Terminal
} from "lucide-react";
import { toast } from "sonner";

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [showOutput, setShowOutput] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, { line: number; column: number }>>(new Map());
  const [collaborationMethod, setCollaborationMethod] = useState<'socket' | 'supabase' | null>(null);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Load room data from Supabase
  const { code, setCode, language, setLanguage, loading } = useRoom(roomId || '');
  
  // Check room ownership
  const { isOwner, loading: ownershipLoading } = useRoomOwnership(roomId || '');

  // Socket.IO connection for real-time sync
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, [setCode]);

  const handleUserJoin = useCallback((userData: any) => {
    setParticipants(prev => [...prev.filter(p => p.id !== userData.id), userData]);
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== userId));
    setCursorPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.delete(userId);
      return newPositions;
    });
  }, []);

  const handleCursorChange = useCallback((data: { userId: string; cursor: { line: number; column: number } }) => {
    setCursorPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(data.userId, data.cursor);
      return newPositions;
    });
  }, []);

  const handleParticipantsUpdate = useCallback((participantsList: any[]) => {
    setParticipants(participantsList);
  }, []);

  // Socket.IO connection
  const { 
    isConnected: socketConnected, 
    connectionStatus: socketStatus, 
    sendCodeChange: socketSendCode, 
    sendCursorChange: socketSendCursor 
  } = useSocket({
    roomId: roomId || '',
    onCodeChange: handleCodeChange,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
    onCursorChange: handleCursorChange,
    onParticipantsUpdate: handleParticipantsUpdate,
  });

  // Supabase Realtime fallback
  const { 
    isConnected: realtimeConnected, 
    connectionStatus: realtimeStatus, 
    sendCodeChange: realtimeSendCode, 
    sendCursorChange: realtimeSendCursor 
  } = useRealtime({
    roomId: roomId || '',
    onCodeChange: handleCodeChange,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
    onCursorChange: handleCursorChange,
    onParticipantsUpdate: handleParticipantsUpdate,
  });

  // Determine active collaboration method
  useEffect(() => {
    if (socketConnected && socketStatus === 'connected') {
      setCollaborationMethod('socket');
    } else if (realtimeConnected && realtimeStatus === 'connected') {
      setCollaborationMethod('supabase');
    } else {
      setCollaborationMethod(null);
    }
  }, [socketConnected, socketStatus, realtimeConnected, realtimeStatus]);

  // Use active method for sending
  const isConnected = collaborationMethod === 'socket' ? socketConnected : realtimeConnected;
  const connectionStatus = collaborationMethod === 'socket' ? socketStatus : realtimeStatus;
  const sendCodeChange = collaborationMethod === 'socket' ? socketSendCode : realtimeSendCode;
  const sendCursorChange = collaborationMethod === 'socket' ? socketSendCursor : realtimeSendCursor;

  const handleEditorChange = (value: string) => {
    setCode(value);
    sendCodeChange(value);
  };

  const handleCursorPositionChange = (cursor: { line: number; column: number }) => {
    sendCursorChange(cursor);
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    }
  };

  const shareRoom = () => {
    if (roomId) {
      const url = `${window.location.origin}/editor/${roomId}`;
      navigator.clipboard.writeText(url);
      toast.success("Room URL copied to clipboard!");
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    
    try {
      const result = await runCode(code, language);
      
      if (result.error) {
        setOutput(`Error: ${result.error}`);
        toast.error("Code execution failed");
      } else {
        setOutput(result.output || "Code executed successfully");
        toast.success("Code executed successfully");
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };


  return (
    <SignedIn>
      <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Room {roomId}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomId}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-accent animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'error' ? 'bg-destructive' :
                'bg-muted-foreground'
              }`} />
              <span className={
                connectionStatus === 'connected' ? 'text-accent' :
                connectionStatus === 'connecting' ? 'text-yellow-500' :
                connectionStatus === 'error' ? 'text-destructive' :
                'text-muted-foreground'
              }>
                {connectionStatus === 'connected' ? 
                  `Live (${collaborationMethod === 'socket' ? 'Socket.IO' : 'Supabase'})` :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'error' ? 'Error' :
                 'Offline'}
              </span>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleRunCode}
              disabled={isRunning || !code.trim()}
              className="gap-2"
            >
              <Play className="h-3 w-3" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button variant="outline" size="sm" onClick={shareRoom} className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Editor */}
        <main className="flex-1 flex flex-col">
          {/* Language Selector Bar */}
          <div className="border-b border-border px-4 py-2">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={!isOwner && !ownershipLoading}
                className="px-3 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
              {!isOwner && !ownershipLoading && (
                <span className="text-xs text-muted-foreground">
                  Only room owner can change language
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className="flex-1 relative">
              {loading ? (
                <div className="h-full flex items-center justify-center bg-editor-background">
                  <div className="text-muted-foreground">Loading room...</div>
                </div>
              ) : (
                <CodeEditor
                  value={code}
                  onChange={handleEditorChange}
                  language={language}
                  roomId={roomId || ""}
                  onCursorPositionChange={handleCursorPositionChange}
                />
              )}
            </div>

            {/* Participants Panel - Only for room owners */}
            {isOwner && (
              <ParticipantsPanel
                participants={participants.map(p => ({
                  ...p,
                  cursor: cursorPositions.get(p.id),
                  isOwner: p.id === user?.id
                }))}
                isOwner={isOwner}
              />
            )}

            {/* Output Panel */}
            {showOutput && (
              <div className="w-80 border-l border-border flex flex-col bg-card">
                <div className="border-b border-border px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="font-medium">Output</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOutput(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                  <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <footer className="border-t border-border px-4 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{code.split('\n').length} lines</span>
                <span>{code.length} chars</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{language.toUpperCase()}</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
    </SignedIn>
  );
};

export default EditorPage;