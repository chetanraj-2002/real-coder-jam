import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Code2, Users, Zap, Share, Plus, Sparkles, Monitor, Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import codingHeroBg from "@/assets/coding-hero-bg.jpg";

const Index = () => {
  const [roomId, setRoomId] = useState("");
  const [lastRoom, setLastRoom] = useState<{roomId: string; expiresAt: number; name: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const navigate = useNavigate();

  // Refresh rejoin timer on app exit
  useEffect(() => {
    const refreshRejoinTimer = () => {
      const stored = localStorage.getItem('lastRoom');
      if (stored) {
        try {
          const roomData = JSON.parse(stored);
          const newExpiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
          const updatedRoomData = { ...roomData, expiresAt: new Date(newExpiryTime).toISOString() };
          localStorage.setItem('lastRoom', JSON.stringify(updatedRoomData));
        } catch (error) {
          // Handle error silently
        }
      }
    };

    const handleBeforeUnload = () => {
      refreshRejoinTimer();
    };

    const handleBackButton = () => {
      refreshRejoinTimer();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

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
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/editor/${id}`);
  };

  const handleRejoinRoom = () => {
    if (lastRoom) {
      navigate(`/editor/${lastRoom.roomId}`);
      localStorage.removeItem('lastRoom');
      setLastRoom(null);
    }
  };

  const clearLastRoom = () => {
    localStorage.removeItem('lastRoom');
    setLastRoom(null);
    setTimeLeft(0);
  };

  // Check for last room on mount and set up timer
  useEffect(() => {
    const stored = localStorage.getItem('lastRoom');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setLastRoom(parsed);
          setTimeLeft(Math.ceil((parsed.expiresAt - Date.now()) / 1000));
        } else {
          localStorage.removeItem('lastRoom');
        }
      } catch (e) {
        localStorage.removeItem('lastRoom');
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (lastRoom && timeLeft === 0) {
      clearLastRoom();
    }
  }, [timeLeft, lastRoom]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${codingHeroBg})` }}
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
                <h1 className="text-xl font-semibold text-foreground">
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
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="mb-12 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Terminal className="h-32 w-32 text-primary" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground relative z-10">
              LineCraft
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium relative z-10">
              Real-time collaborative coding platform
            </p>
            <p className="text-base md:text-lg text-muted-foreground relative z-10">
              Code together, debug together, create together
            </p>
          </div>

          {/* Room Management */}
          <div className="max-w-md mx-auto">
            <SignedIn>
              {/* Rejoin Last Room */}
              {lastRoom && timeLeft > 0 && (
                <Card className="border border-accent/50 backdrop-blur-sm bg-accent/5 mb-4">
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-accent">Rejoin Recent Room</h3>
                      <p className="text-sm text-muted-foreground">
                        You were recently in {lastRoom.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires in {formatTime(timeLeft)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleRejoinRoom}
                        variant="default"
                        className="flex-1"
                      >
                        Rejoin Room
                      </Button>
                      <Button 
                        onClick={clearLastRoom}
                        variant="ghost"
                        size="sm"
                        className="px-3"
                      >
                        ×
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="border border-border/50 backdrop-blur-sm bg-card/80">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Input
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit room ID"
                      className="font-mono text-center text-base md:text-lg h-12 backdrop-blur-sm bg-input/80"
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
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                      or
                    </span>
                  </div>

                  <Button
                    onClick={handleCreateRoom}
                    className="w-full gap-2 h-12"
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
                    <h3 className="text-lg md:text-xl font-semibold">Ready to start coding?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Sign in to create or join collaborative coding sessions
                    </p>
                  </div>
                  <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                    <Button className="w-full h-12">
                      Get Started
                    </Button>
                  </SignInButton>
                </CardContent>
              </Card>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 relative z-10">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
              Everything you need for collaborative coding
            </h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Powerful features to enhance your development workflow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg md:text-xl font-medium text-foreground">Monaco Editor</h4>
              <p className="text-sm md:text-base text-muted-foreground">
                Professional code editor with syntax highlighting and IntelliSense
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h4 className="text-lg md:text-xl font-medium text-foreground">Real-time Sync</h4>
              <p className="text-sm md:text-base text-muted-foreground">
                See changes instantly as you and your team code together
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg md:text-xl font-medium text-foreground">Code Execution</h4>
              <p className="text-sm md:text-base text-muted-foreground">
                Run and test your code directly in the browser
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10">
                <Share className="h-6 w-6 text-accent" />
              </div>
              <h4 className="text-lg md:text-xl font-medium text-foreground">Easy Sharing</h4>
              <p className="text-sm md:text-base text-muted-foreground">
                Share your coding sessions with a simple room ID
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-sm py-6 relative z-10">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center text-sm md:text-base text-muted-foreground">
            <p>Built with React, Monaco Editor & Socket.IO</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;