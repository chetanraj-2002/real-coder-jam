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
  ChevronDown,
  ChevronUp
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
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalHistory]);

  // Focus terminal input when terminal tab is active
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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
        newHistory.push("  pwd      - Show current working directory");
        newHistory.push("  ls       - List files (simulated)");
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
      case 'pwd':
        newHistory.push("/workspace/linecraft-editor");
        break;
      case 'ls':
        newHistory.push("src/  public/  package.json  README.md  .gitignore");
        break;
      case 'exit':
        newHistory.push("Use the close button to exit console");
        break;
      default:
        if (command.startsWith('echo ')) {
          newHistory.push(command.substring(5));
        } else {
          newHistory.push(`bash: ${command}: command not found`);
        }
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
      isExpanded ? 'h-[70vh]' : 'h-[40vh]'
    }`}>
      <Card className="h-full rounded-t-lg rounded-b-none border-b-0 bg-card shadow-2xl">
        <CardHeader className="pb-3 border-b flex-shrink-0">
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
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 px-2 gap-1 text-xs"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                {isExpanded ? 'Collapse' : 'Expand'}
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
        
        <CardContent className="p-0 h-full flex flex-col min-h-0">
          <Tabs defaultValue="output" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2 flex-shrink-0">
              <TabsTrigger value="output" className="text-xs">
                Output
                {(error || output) && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">●</Badge>}
              </TabsTrigger>
              <TabsTrigger value="terminal" className="text-xs">Terminal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="output" className="flex-1 m-0 p-4 pt-3 min-h-0">
              <div className="h-full flex flex-col gap-3">
                {/* Output Header */}
                <div className="flex items-center justify-between flex-shrink-0">
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
                <ScrollArea className="flex-1 border rounded-md min-h-0">
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
            
            <TabsContent value="terminal" className="flex-1 m-0 p-4 pt-3 min-h-0">
              <div className="h-full flex flex-col gap-3">
                {/* Terminal Output */}
                <ScrollArea className="flex-1 border rounded-md bg-editor-background min-h-0">
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
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-editor-background flex-shrink-0">
                  <span className="text-accent text-xs font-mono">$</span>
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
    </div>
  );
};