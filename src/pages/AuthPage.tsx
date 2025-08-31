import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Users, Zap, Share, ArrowRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@/assets/linecraft-hero.jpg";

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This will redirect authenticated users to the main page
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        <SignedOut>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Code2 className="h-10 w-10 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                LineCraft
              </h1>
            </div>
            <p className="text-muted-foreground">
              Real-time collaborative coding platform
            </p>
          </div>

          <Card className="border border-border/50 backdrop-blur-sm bg-card/80">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome to LineCraft</CardTitle>
              <CardDescription>
                Choose how you'd like to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                <Button className="w-full shadow-glow" size="lg">
                  Sign In
                </Button>
              </SignInButton>
              
              <SignUpButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                <Button variant="outline" className="w-full backdrop-blur-sm" size="lg">
                  Create Account
                </Button>
              </SignUpButton>

              <div className="pt-4 border-t border-border/50">
                <h3 className="font-medium mb-4 text-center">What you'll get:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span>Professional Monaco Editor</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-accent" />
                    <span>Real-time collaborative editing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Instant code execution</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Share className="h-4 w-4 text-accent" />
                    <span>Easy room sharing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SignedOut>

        <SignedIn>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Code2 className="h-10 w-10 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                LineCraft
              </h1>
            </div>
            
            <Card className="border border-border/50 backdrop-blur-sm bg-card/80">
              <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-3">
                  <h2 className="text-xl font-semibold">Welcome back!</h2>
                  <p className="text-muted-foreground">
                    Ready to start coding collaboratively?
                  </p>
                </div>
                
                <Button
                  onClick={() => navigate("/")}
                  className="w-full gap-2 shadow-glow"
                  size="lg"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                <div className="flex justify-center">
                  <UserButton afterSignOutUrl="/auth" />
                </div>
              </CardContent>
            </Card>
          </div>
        </SignedIn>
      </div>
    </div>
  );
};

export default AuthPage;