import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeEditor } from "@/components/CodeEditor";
import { 
  Code2, 
  Users, 
  Copy, 
  Share, 
  Settings, 
  ArrowLeft,
  Wifi,
  WifiOff,
  Circle
} from "lucide-react";
import { toast } from "sonner";

// Mock data for demonstration
const mockUsers = [
  { id: "1", name: "Alex Chen", avatar: "AC", color: "#3B82F6", isActive: true },
  { id: "2", name: "Sarah Kim", avatar: "SK", color: "#10B981", isActive: true },
  { id: "3", name: "Mike Johnson", avatar: "MJ", color: "#F59E0B", isActive: false },
];

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(`// Welcome to CodeShare - Room ${roomId}
// Start coding together!

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Try editing this code with your team
console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
  console.log(fibonacci(i));
}

// Real-time collaboration features:
// ✨ Live cursors and selections
// ⚡ Instant synchronization  
// 👥 User presence indicators
// 🎨 Syntax highlighting
`);
  
  const [isConnected, setIsConnected] = useState(true);
  const [connectedUsers] = useState(mockUsers);
  const [language, setLanguage] = useState("javascript");

  // Mock connection status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(prev => Math.random() > 0.1 ? true : prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const activeUsers = connectedUsers.filter(user => user.isActive);
  const totalUsers = connectedUsers.length;

  return (
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
                  <span>{activeUsers.length} active</span>
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
        {/* Sidebar - Users Panel */}
        <aside className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-semibold">Participants</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {totalUsers}
              </Badge>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {connectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar 
                        className="h-8 w-8 border-2" 
                        style={{ borderColor: user.color }}
                      >
                        <AvatarFallback 
                          className="text-xs font-semibold text-white"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <Circle 
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${
                          user.isActive ? 'text-accent fill-accent' : 'text-muted fill-muted'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.isActive ? 'Active' : 'Away'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

            {/* Mock Activity Feed */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 text-accent fill-accent" />
                  <span>Alex joined the room</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 text-primary fill-primary" />
                  <span>Sarah edited line 15</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-2 w-2 text-muted fill-muted" />
                  <span>Mike went away</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Editor */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              roomId={roomId || ""}
              users={activeUsers}
            />
            
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
                <span>Line 1, Column 1</span>
                <span>UTF-8</span>
                <span>{language.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{code.split('\n').length} lines</span>
                <span>{code.length} characters</span>
                <div className="flex items-center gap-1">
                  <Circle className="h-2 w-2 text-accent fill-accent" />
                  <span>Auto-sync enabled</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;