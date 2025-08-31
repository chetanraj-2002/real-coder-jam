import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal as TerminalIcon, 
  Play, 
  X, 
  Copy,
  RotateCcw,
  ChevronRight 
} from "lucide-react";
import { toast } from "sonner";

interface ConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  output: string;
  error?: string;
  executionTime?: number;
  isRunning: boolean;
  onRunCode: () => void;
  canRun: boolean;
}

export const Console = ({ 
  isOpen, 
  onClose, 
  output, 
  error, 
  executionTime, 
  isRunning, 
  onRunCode,
  canRun 
}: ConsoleProps) => {
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "Welcome to LineCraft Terminal",
    "Type 'help' for available commands"
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalHistory]);

  const handleTerminalCommand = (command: string) => {
    if (!command.trim()) return;

    const newHistory = [...terminalHistory, `$ ${command}`];
    
    // Simple terminal commands
    switch (command.toLowerCase().trim()) {
      case 'help':
        newHistory.push("Available commands:");
        newHistory.push("  help     - Show this help message");
        newHistory.push("  clear    - Clear terminal");
        newHistory.push("  run      - Execute current code");
        newHistory.push("  time     - Show current time");
        newHistory.push("  whoami   - Show current user info");
        break;
      case 'clear':
        setTerminalHistory([
          "Welcome to LineCraft Terminal",
          "Type 'help' for available commands"
        ]);
        setTerminalInput("");
        return;
      case 'run':
        if (canRun) {
          newHistory.push("Executing code...");
          onRunCode();
        } else {
          newHistory.push("Error: No code to execute or code is already running");
        }
        break;
      case 'time':
        newHistory.push(new Date().toLocaleString());
        break;
      case 'whoami':
        newHistory.push("LineCraft User - Collaborative Code Editor");
        break;
      default:
        newHistory.push(`bash: ${command}: command not found`);
        break;
    }

    setTerminalHistory(newHistory);
    setTerminalInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTerminalCommand(terminalInput);
    }
  };

  const copyOutput = () => {
    const textToCopy = error || output;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Output copied to clipboard");
    }
  };

  const clearOutput = () => {
    // This would need to be handled by parent component
    toast.info("Output cleared");
  };

  if (!isOpen) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => {/* This would be handled by parent */}}
          className="shadow-lg hover:shadow-xl transition-all duration-200"
          title="Open Console"
        >
          <TerminalIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed right-4 bottom-4 w-[90vw] max-w-2xl h-[60vh] max-h-[500px] z-50 shadow-2xl border bg-card">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            Console
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRunCode}
              disabled={isRunning || !canRun}
              className="h-7 px-2 gap-1 text-xs"
            >
              <Play className="h-3 w-3" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="output" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
            <TabsTrigger value="output" className="text-xs">
              Output
              {(error || output) && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">●</Badge>}
            </TabsTrigger>
            <TabsTrigger value="terminal" className="text-xs">Terminal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="output" className="flex-1 m-0 p-4 pt-3">
            <div className="h-full flex flex-col gap-3">
              {/* Output Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {executionTime !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {executionTime}ms
                    </Badge>
                  )}
                  {isRunning && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Running...
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyOutput}
                    disabled={!output && !error}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Output Content */}
              <ScrollArea className="flex-1 border rounded-md">
                <div className="p-3 font-mono text-xs space-y-1">
                  {error ? (
                    <div className="text-destructive whitespace-pre-wrap">
                      {error}
                    </div>
                  ) : output ? (
                    <div className="text-foreground whitespace-pre-wrap">
                      {output}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">
                      No output yet. Run some code to see results here.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="terminal" className="flex-1 m-0 p-4 pt-3">
            <div className="h-full flex flex-col gap-3">
              {/* Terminal Output */}
              <ScrollArea className="flex-1 border rounded-md bg-editor-background">
                <div className="p-3 font-mono text-xs space-y-1">
                  {terminalHistory.map((line, index) => (
                    <div 
                      key={index} 
                      className={`${
                        line.startsWith('$') ? 'text-accent' : 
                        line.includes('Error') || line.includes('bash:') ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </ScrollArea>

              {/* Terminal Input */}
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-editor-background">
                <ChevronRight className="h-3 w-3 text-accent flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground placeholder:text-muted-foreground"
                  autoComplete="off"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};