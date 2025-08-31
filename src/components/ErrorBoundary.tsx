import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        resetError={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    resetError();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {error?.message || 'An unexpected error occurred while loading the page.'}
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleReload}
              variant="default"
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};