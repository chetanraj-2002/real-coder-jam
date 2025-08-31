import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Code2, Users, Zap, Share, Plus } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/src/assets/hero-background.jpg)` }}
      />
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="container max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 className="h-6 w-6 text-primary" />
                <div>
                <h1 className="text-lg font-semibold">
                    LineCraft
                  </h1>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="gap-2"
                  >
                    Dashboard
                  </Button>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="container max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Code Together, Create Together
            </h2>
            <p className="text-muted-foreground">
              Real-time collaborative coding with instant sync and execution
            </p>
          </div>

          {/* Room Management */}
          <div>
            <SignedIn>
              <Card className="border border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      placeholder="Enter room ID to join"
                      className="font-mono text-center"
                      maxLength={6}
                      onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                    />
                  </div>

                  <Button 
                    onClick={joinRoom}
                    variant="outline"
                    className="w-full"
                    disabled={!roomId.trim()}
                  >
                    Join Room
                  </Button>

                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>

                  <Button
                    onClick={handleCreateRoom}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Room
                  </Button>
                </CardContent>
              </Card>
            </SignedIn>

            <SignedOut>
              <Card className="border border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-medium">Get Started</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in to start collaborating
                    </p>
                  </div>
                  <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </SignInButton>
                </CardContent>
              </Card>
            </SignedOut>
          </div>

          {/* Features */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                <span>Monaco Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Real-time Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Code Execution</span>
              </div>
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                <span>Easy Sharing</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center text-xs text-muted-foreground">
            <p>Built with React, Monaco Editor & Socket.IO</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;