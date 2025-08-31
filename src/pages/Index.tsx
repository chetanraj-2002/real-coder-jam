import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Code2, Users, Zap, Github } from "lucide-react";

const Index = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/editor/${roomId.trim()}`);
    }
  };

  const handleCreateRoom = () => {
    generateRoomId();
    // Auto-join after generating
    setTimeout(() => {
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate(`/editor/${id}`);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/50">
        <div className="container max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary shadow-glow">
                  <Code2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    CodeShare
                  </h1>
                  <p className="text-sm text-muted-foreground">Realtime Collaborative Editor</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SignedOut>
                  <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <Button variant="outline" size="sm" className="gap-2">
                  <Github className="h-4 w-4" />
                  View Source
                </Button>
              </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Real-time Collaboration
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Code Together,
              <br />
              Create Together
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience seamless real-time collaboration with our powerful code editor. 
              Share ideas, debug together, and build amazing projects as a team.
            </p>
          </div>

          {/* Room Management */}
          <div className="max-w-md mx-auto">
            <SignedIn>
              <Card className="border-2 border-primary/20 shadow-elevation bg-card/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Join a Room</CardTitle>
                  <CardDescription>
                    Enter a room ID to join an existing session or create a new one
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="roomId" className="text-sm font-medium">
                      Room ID
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="roomId"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        placeholder="Enter room ID"
                        className="font-mono text-center tracking-wider"
                        maxLength={6}
                        onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                      />
                      <Button
                        variant="outline"
                        onClick={generateRoomId}
                        className="shrink-0"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={joinRoom}
                    className="w-full h-12 text-base font-semibold bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    disabled={!roomId.trim()}
                  >
                    Join Room
                  </Button>

                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                      or
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleCreateRoom}
                    className="w-full h-12 text-base font-semibold border-accent/50 text-accent hover:bg-accent/10 hover:border-accent hover:shadow-accent-glow transition-all duration-300"
                  >
                    Create New Room
                  </Button>
                </CardContent>
              </Card>
            </SignedIn>

            <SignedOut>
              <Card className="border-2 border-primary/20 shadow-elevation bg-card/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <CardDescription>
                    Sign in to start collaborating with your team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                    <Button className="w-full h-12 text-base font-semibold bg-gradient-primary hover:shadow-glow transition-all duration-300">
                      Sign In to Continue
                    </Button>
                  </SignInButton>
                  <p className="text-center text-sm text-muted-foreground">
                    New to CodeShare?{" "}
                    <Button variant="link" className="p-0 h-auto text-primary" asChild>
                      <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/" mode="modal">
                        Create an account
                      </SignInButton>
                    </Button>
                  </p>
                </CardContent>
              </Card>
            </SignedOut>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Monaco Editor</h3>
              <p className="text-muted-foreground">
                Professional code editing with syntax highlighting and IntelliSense
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-4 group-hover:bg-accent/20 transition-colors">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Collaboration</h3>
              <p className="text-muted-foreground">
                See cursors, selections, and changes from other developers in real-time
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-glow/10 border border-primary-glow/20 mb-4 group-hover:bg-primary-glow/20 transition-colors">
                <Zap className="h-6 w-6 text-primary-glow" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Sync</h3>
              <p className="text-muted-foreground">
                Lightning-fast synchronization powered by WebSocket technology
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Built with React, Monaco Editor & WebSockets</p>
            <p>© 2024 CodeShare. Open source project.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;