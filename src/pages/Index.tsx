import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Code2, Users, Zap, Share, Plus, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@/assets/linecraft-hero.jpg";

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
    <div className="min-h-screen bg-gradient-background flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm px-6 py-4 relative z-10">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Code2 className="h-8 w-8 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  LineCraft
                </h1>
                <p className="text-xs text-muted-foreground">Collaborative Coding</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <SignedOut>
                <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                  <Button variant="outline" size="sm" className="backdrop-blur-sm">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2 backdrop-blur-sm"
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
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <div className="container max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              LineCraft
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              Real-time collaborative coding platform
            </p>
            <p className="text-sm text-muted-foreground">
              Code together, debug together, create together
            </p>
          </div>

          {/* Room Management */}
          <div>
            <SignedIn>
              <Card className="border border-border/50 backdrop-blur-sm bg-card/80">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Input
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit room ID"
                      className="font-mono text-center text-lg h-14 backdrop-blur-sm bg-input/80"
                      maxLength={6}
                      onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                    />
                    <Button 
                      onClick={joinRoom}
                      variant="outline"
                      className="w-full h-12 backdrop-blur-sm"
                      disabled={!roomId.trim()}
                    >
                      Join Room
                    </Button>
                  </div>

                  <div className="relative">
                    <Separator className="opacity-50" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>

                  <Button
                    onClick={handleCreateRoom}
                    className="w-full gap-2 h-12 shadow-glow"
                  >
                    <Plus className="h-5 w-5" />
                    Create New Room
                  </Button>
                </CardContent>
              </Card>
            </SignedIn>

            <SignedOut>
              <Card className="border border-border/50 backdrop-blur-sm bg-card/80">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg font-semibold">Ready to start coding?</h3>
                    <p className="text-muted-foreground">
                      Sign in to create or join collaborative coding sessions
                    </p>
                  </div>
                  <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                    <Button className="w-full h-12 shadow-glow">
                      Get Started
                    </Button>
                  </SignInButton>
                </CardContent>
              </Card>
            </SignedOut>
          </div>

        </div>
      </main>

      {/* Features Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm py-6 relative z-10">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <Code2 className="h-4 w-4" />
              <span>Monaco Editor</span>
            </div>
            <div className="flex items-center gap-2 hover:text-accent transition-colors">
              <Users className="h-4 w-4" />
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition-colors">
              <Zap className="h-4 w-4" />
              <span>Code Execution</span>
            </div>
            <div className="flex items-center gap-2 hover:text-accent transition-colors">
              <Share className="h-4 w-4" />
              <span>Easy Sharing</span>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Built with React, Monaco Editor & Socket.IO</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;