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
import { MultiTerminal } from "@/components/MultiTerminal";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import codingBackground from "@/assets/coding-background.jpg";

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [executionTime, setExecutionTime] = useState<number>();
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Map<string, { line: number; column: number }>>(new Map());
  const [collaborationMethod, setCollaborationMethod] = useState<'socket' | 'supabase' | null>(null);
  const [effectiveOwner, setEffectiveOwner] = useState<string | null>(null);
  
  // Store room info for rejoining when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomId && user) {
        const roomData = {
          roomId,
          expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes from now
          name: `Room ${roomId}`
        };
        localStorage.setItem('lastRoom', JSON.stringify(roomData));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Store room info when component unmounts (user is leaving)
      handleBeforeUnload();
    };
  }, [roomId, user]);

  // Handle back button navigation with room storage
  const handleBackToHome = useCallback(() => {
    if (roomId && user) {
      const roomData = {
        roomId,
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes from now
        name: `Room ${roomId}`
      };
      localStorage.setItem('lastRoom', JSON.stringify(roomData));
    }
    navigate("/");
  }, [roomId, user, navigate]);

  // Load room data from Supabase
  const { code, setCode, language, setLanguage, loading } = useRoom(roomId || '');
  
  // Check room ownership  
  const { isOwner, loading: ownershipLoading, isEffectiveOwner, handleHostChange } = useRoomOwnership(roomId || '');

  // Handle authentication and navigation
  useEffect(() => {
    // Don't redirect immediately - give time for auth to load
    const timer = setTimeout(() => {
      if (!user && !loading) {
        console.log('User not authenticated, redirecting to home');
        navigate('/', { replace: true });
      }
    }, 2000); // Wait 2 seconds for auth to load

    return () => clearTimeout(timer);
  }, [user, navigate, loading]);
  
  const handleHostChangeEvent = useCallback((newOwner: string, isYou: boolean) => {
    setEffectiveOwner(newOwner);
    handleHostChange(newOwner);
    
    if (isYou) {
      toast.success("You are now the room host");
    } else {
      const newOwnerName = participants.find(p => p.id === newOwner)?.name || "Unknown";
      toast.info(`${newOwnerName} is now the room host`);
    }
  }, [handleHostChange, participants]);

  // Host reclaim is handled below with active transport awareness

  // Socket.IO connection for real-time sync
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, [setCode]);

  const handleUserJoin = useCallback((userData: any) => {
    // Normalize participant data from different transports
    const normalized = {
      id: userData.id || userData.user_id || userData.userId,
      name: userData.name || userData.user_name || userData.userName,
      email: userData.email || userData.user_email || userData.userEmail,
      isOwner: userData.isOwner
    };
    
    setParticipants(prev => {
      // Remove existing entry with same ID and add normalized one
      const filtered = prev.filter(p => p.id !== normalized.id);
      return [...filtered, normalized];
    });
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    // Normalize userId from different transports
    const normalizedId = userId;
    setParticipants(prev => prev.filter(p => p.id !== normalizedId));
    setCursorPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.delete(normalizedId);
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
    // Normalize participants from different transports
    const participantMap = new Map();
    
    participantsList.forEach(p => {
      const normalized = {
        id: p.id || p.user_id || p.userId,
        name: p.name || p.user_name || p.userName,
        email: p.email || p.user_email || p.userEmail,
        isOwner: p.isOwner
      };
      // Dedupe by ID
      if (normalized.id) {
        participantMap.set(normalized.id, normalized);
      }
    });
    
    setParticipants(Array.from(participantMap.values()));
  }, []);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setLanguage(newLanguage);
  }, [setLanguage]);

  const handleKick = useCallback((targetUserId: string) => {
    if (user && targetUserId === user.id) {
      // Store rejoin token for 5 minutes when kicked
      const roomData = {
        roomId,
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes from now
        name: `Room ${roomId}`
      };
      localStorage.setItem('lastRoom', JSON.stringify(roomData));
      toast.error("You were removed from the room");
      navigate('/');
    }
  }, [user, roomId, navigate]);

  // Socket.IO connection
  const { 
    isConnected: socketConnected, 
    connectionStatus: socketStatus, 
    sendCodeChange: socketSendCode, 
    sendCursorChange: socketSendCursor,
    sendLanguageChange: socketSendLanguage,
    kickParticipant: socketKickParticipant,
    broadcastHostChange: socketBroadcastHostChange
  } = useSocket({
    roomId: roomId || '',
    onCodeChange: handleCodeChange,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
    onCursorChange: handleCursorChange,
    onParticipantsUpdate: handleParticipantsUpdate,
    onLanguageChange: handleLanguageChange,
    onKick: handleKick,
    onHostChange: handleHostChangeEvent,
  });

  // Supabase Realtime fallback
  const { 
    isConnected: realtimeConnected, 
    connectionStatus: realtimeStatus, 
    sendCodeChange: realtimeSendCode, 
    sendCursorChange: realtimeSendCursor,
    sendLanguageChange: realtimeSendLanguage,
    kickParticipant: realtimeKickParticipant,
    broadcastHostChange: realtimeBroadcastHostChange
  } = useRealtime({
    roomId: roomId || '',
    onCodeChange: handleCodeChange,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
    onCursorChange: handleCursorChange,
    onParticipantsUpdate: handleParticipantsUpdate,
    onLanguageChange: handleLanguageChange,
    onKick: handleKick,
    onHostChange: handleHostChangeEvent,
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

  const handleRemoveParticipant = useCallback((targetUserId: string) => {
    if (collaborationMethod === 'socket') {
      socketKickParticipant?.(targetUserId);
    } else {
      realtimeKickParticipant?.(targetUserId);
    }
    toast.success("Participant removed");
  }, [collaborationMethod, socketKickParticipant, realtimeKickParticipant]);

  // Use active method for sending
  const isConnected = collaborationMethod === 'socket' ? socketConnected : realtimeConnected;
  const connectionStatus = collaborationMethod === 'socket' ? socketStatus : realtimeStatus;
  const sendCodeChange = collaborationMethod === 'socket' ? socketSendCode : realtimeSendCode;
  const sendCursorChange = collaborationMethod === 'socket' ? socketSendCursor : realtimeSendCursor;
  const sendLanguageChange = collaborationMethod === 'socket' ? socketSendLanguage : realtimeSendLanguage;
  const broadcastHostChange = collaborationMethod === 'socket' ? socketBroadcastHostChange : realtimeBroadcastHostChange;

  // Reclaim host when original room creator rejoins
  useEffect(() => {
    if (!user || !isOwner || !broadcastHostChange) return;
    
    const presentIds = new Set(participants.map(p => p.id));
    const currentOwnerId = effectiveOwner;
    
    // Conditions to reclaim host privileges:
    // 1. User is alone in the room, OR
    // 2. Current effective owner is no longer present
    const shouldReclaim = 
      (participants.length === 1 && presentIds.has(user.id)) ||
      (currentOwnerId && !presentIds.has(currentOwnerId));

    if (shouldReclaim && effectiveOwner !== user.id) {
      setEffectiveOwner(user.id);
      handleHostChange(user.id);
      broadcastHostChange(user.id);
      toast.success("Host privileges restored");
    }
  }, [participants, isOwner, user, effectiveOwner, handleHostChange, broadcastHostChange]);

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
    setIsTerminalCollapsed(false);
    setError("");
    setOutput("");
    setExecutionTime(undefined);
    
    try {
      const result = await runCode(code, language);
      
      if (result.error) {
        setError(result.error);
        setOutput("");
        toast.error("Code execution failed");
      } else {
        setOutput(result.output || "Code executed successfully");
        setError("");
        toast.success("Code executed successfully");
      }
      
      setExecutionTime(result.executionTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Execution failed: ${errorMessage}`);
      setOutput("");
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  // Show loading screen while authentication and room data loads
  if (!user || loading || ownershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">
            {!user ? 'Authenticating...' : 'Loading room...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SignedIn>
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Light mode subtle background */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${codingBackground})` }}
        />
        
        {/* Header */}
        <header className="border-b border-border px-4 py-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
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

            <div className="flex items-center gap-4">
              {/* Participants Strip */}
              {participants.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {participants.slice(0, 3).map((participant) => (
                      <div
                        key={participant.id}
                        className="h-6 w-6 rounded-full bg-primary/10 border border-background flex items-center justify-center text-xs font-medium"
                        title={participant.name}
                      >
                        {participant.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {participants.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-xs font-medium">
                        +{participants.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {participants.length} user{participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <ConnectionStatus 
                isConnected={isConnected}
                method={collaborationMethod || 'none'}
              />
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                className="gap-2"
              >
                <Terminal className="h-4 w-4" />
                {isTerminalCollapsed ? 'Show' : 'Hide'} Console
              </Button>
              <Button variant="outline" size="sm" onClick={shareRoom} className="gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex relative z-10 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Main Editor Area */}
            <ResizablePanel defaultSize={participants.length > 0 ? 75 : 100} minSize={50}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Editor Panel */}
                <ResizablePanel defaultSize={isTerminalCollapsed ? 100 : 70} minSize={40}>
                  <div className="h-full flex flex-col">
                    {/* Language Selector Bar */}
                    <div className="border-b border-border px-4 py-2 flex-shrink-0">
                      <div className="flex items-center gap-4 overflow-x-auto">
                        <select
                          value={language}
                          onChange={(e) => {
                            const newLanguage = e.target.value;
                            setLanguage(newLanguage);
                            if (isEffectiveOwner) {
                              sendLanguageChange(newLanguage);
                            }
                          }}
                          disabled={!isEffectiveOwner && !ownershipLoading}
                          className="px-3 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
                        {!isEffectiveOwner && !ownershipLoading && (
                          <span className="text-xs text-muted-foreground hidden sm:inline whitespace-nowrap">
                            Only room host can change language
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Code Editor */}
                    <div className="flex-1 min-h-0">
                      <CodeEditor
                        value={code}
                        language={language}
                        roomId={roomId || ''}
                        onChange={handleEditorChange}
                        onCursorPositionChange={handleCursorPositionChange}
                      />
                    </div>
                    
                    {/* Status bar */}
                    <div className="border-t border-border px-4 py-1 text-xs text-muted-foreground bg-muted/30 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-4">
                        <span>Lines: {code.split('\n').length}</span>
                        <span>Language: {language}</span>
                        {isConnected && (
                          <span className="text-accent">● Connected</span>
                        )}
                      </div>
                      {!isConnected && (
                        <span className="text-destructive text-xs">
                          Disconnected - Changes may not sync
                        </span>
                      )}
                    </div>
                  </div>
                </ResizablePanel>

                {/* Console/Terminal Panel */}
                {!isTerminalCollapsed && (
                  <>
                    <ResizableHandle withHandle className="h-1 bg-border hover:bg-primary/20 transition-colors" />
                    <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
                      <MultiTerminal
                        isCollapsed={isTerminalCollapsed}
                        onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                        output={output}
                        error={error}
                        executionTime={executionTime}
                        isRunning={isRunning}
                        onRunCode={handleRunCode}
                        canRun={!!code.trim()}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {/* Participants Panel - Desktop Only */}
            {participants.length > 0 && (
              <>
                <ResizableHandle withHandle className="w-1 bg-border hover:bg-primary/20 transition-colors hidden lg:flex" />
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="hidden lg:block">
                  <ParticipantsPanel
                    participants={participants}
                    isOwner={isEffectiveOwner}
                    currentUserId={user?.id}
                    onRemove={handleRemoveParticipant}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
          
          {/* Mobile Participants Panel */}
          <div className="lg:hidden">
            <ParticipantsPanel
              participants={participants}
              isOwner={isEffectiveOwner}
              currentUserId={user?.id}
              onRemove={handleRemoveParticipant}
            />
          </div>
        </div>

        {/* Bottom Terminal Bar (when collapsed) */}
        {isTerminalCollapsed && (
          <MultiTerminal
            isCollapsed={true}
            onToggleCollapse={() => setIsTerminalCollapsed(false)}
            output={output}
            error={error}
            executionTime={executionTime}
            isRunning={isRunning}
            onRunCode={handleRunCode}
            canRun={!!code.trim()}
          />
        )}
      </div>
    </SignedIn>
  );
};

export default EditorPage;