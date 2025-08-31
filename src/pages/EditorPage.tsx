import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SignedIn, useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeEditor } from "@/components/CodeEditor";
import { useSocket } from "@/hooks/useSocket";
import { useRoom } from "@/hooks/useRoom";
import { 
  Code2, 
  Copy, 
  Share, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Settings
} from "lucide-react";
import { toast } from "sonner";

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Load room data from Supabase
  const { code, setCode, language, setLanguage, loading } = useRoom(roomId || '');

  // Socket.IO connection for real-time sync
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, [setCode]);

  const handleUserJoin = useCallback((userData: any) => {
    toast.success(`${userData.name} joined the room`);
  }, []);

  const handleUserLeave = useCallback((userId: string) => {
    toast.info('Someone left the room');
  }, []);

  const { isConnected, sendCodeChange } = useSocket({
    roomId: roomId || '',
    onCodeChange: handleCodeChange,
    onUserJoin: handleUserJoin,
    onUserLeave: handleUserLeave,
  });

  const handleEditorChange = (value: string) => {
    setCode(value);
    sendCodeChange(value);
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


  return (
    <SignedIn>
      <div className="min-h-screen bg-gradient-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-primary">
                <Code2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Room {roomId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRoomId}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-accent" />
                        <span className="text-accent">Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">Reconnecting...</span>
                      </>
                    )}
                  </div>
                   <span>•</span>
                   <span>Real-time sync</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={shareRoom} className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Editor */}
        <main className="flex-1 flex flex-col">
          {/* Language Selector Bar */}
          <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Language:</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {isConnected ? '● Live sync enabled' : '○ Reconnecting...'}
              </div>
            </div>
          </div>
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
              />
            )}
            
            {/* Connection Status Overlay */}
            {!isConnected && (
              <div className="absolute top-4 right-4 z-10">
                <Card className="px-3 py-2 bg-destructive/10 border-destructive/20">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <WifiOff className="h-4 w-4" />
                    Reconnecting...
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm px-6 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{code.split('\n').length} lines</span>
                <span>{code.length} characters</span>
                <span>{language.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>UTF-8</span>
                <div className="flex items-center gap-1">
                  {isConnected ? (
                    <>
                      <div className="h-2 w-2 bg-accent rounded-full animate-pulse" />
                      <span>Live sync</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-destructive rounded-full" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
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