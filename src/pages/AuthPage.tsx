import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Users, Zap } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This will redirect authenticated users to the main page
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignedOut>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Code className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">LineCraft</h1>
              </div>
              <CardTitle>Welcome to LineCraft</CardTitle>
              <CardDescription>
                Join the collaborative coding experience. Sign in or create an account to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SignInButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton fallbackRedirectUrl="/" forceRedirectUrl="/">
                  <Button className="w-full">
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
              
              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-3 text-center">Why LineCraft?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm">Real-time collaboration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-primary" />
                    <span className="text-sm">Monaco code editor</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm">Instant synchronization</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SignedOut>

        <SignedIn>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>
                You're signed in and ready to collaborate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <UserButton afterSignOutUrl="/auth" />
              </div>
              
              <Button 
                onClick={() => navigate('/')} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </SignedIn>
      </div>
    </div>
  );
};

export default AuthPage;