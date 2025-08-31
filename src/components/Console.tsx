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
import type { REPLResponse } from "@/workers/replWorker";

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
    "Welcome to LineCraft Terminal - JavaScript REPL",
    "Type 'help' for available commands"
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalHistory]);

  // Initialize REPL worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/replWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event) => {
        const response = event.data as REPLResponse;
        
        setTerminalHistory(prev => {
          const newHistory = [...prev];
          
          switch (response.type) {
            case 'log':
              newHistory.push(response.text);
              break;
            case 'result':
              newHistory.push(`=> ${response.text}`);
              break;
            case 'error':
              newHistory.push(`Error: ${response.text}`);
              break;
            case 'reset-ok':
              newHistory.push(response.text);
              break;
          }
          
          return newHistory;
        });
      };

      workerRef.current.onerror = (error) => {
        setTerminalHistory(prev => [...prev, `Worker Error: ${error.message}`]);
      };

    } catch (error) {
      setTerminalHistory(prev => [...prev, "Failed to initialize JS REPL. Falling back to basic commands."]);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

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

    // Add to command history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    const newHistory = [...terminalHistory, `$ ${command}`];
    
    // Handle special commands
    switch (command.toLowerCase().trim()) {
      case 'help':
        newHistory.push("LineCraft Terminal - JavaScript REPL");
        newHistory.push("Available commands:");
        newHistory.push("  help     - Show this help message");
        newHistory.push("  clear    - Clear terminal");
        newHistory.push("  reset    - Reset JS context (clear variables)");
        newHistory.push("  run      - Execute current code using Piston API");
        newHistory.push("  time     - Show current time");
        newHistory.push("");
        newHistory.push("JavaScript evaluation:");
        newHistory.push("  Any other input will be evaluated as JavaScript");
        newHistory.push("  Variables persist between evaluations");
        newHistory.push("  Use arrow keys to navigate command history");
        setTerminalHistory(newHistory);
        break;
        
      case 'clear':
        setTerminalHistory([
          "Welcome to LineCraft Terminal - JavaScript REPL",
          "Type 'help' for available commands"
        ]);
        break;
        
      case 'reset':
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'reset' });
          setTerminalHistory(newHistory);
        } else {
          newHistory.push("REPL worker not available");
          setTerminalHistory(newHistory);
        }
        break;
        
      case 'run':
        if (canRun) {
          newHistory.push("Executing code via Piston API...");
          setTerminalHistory(newHistory);
          onRunCode();
        } else {
          newHistory.push("Error: No code to execute or code is already running");
          setTerminalHistory(newHistory);
        }
        break;
        
      case 'time':
        newHistory.push(new Date().toLocaleString());
        setTerminalHistory(newHistory);
        break;
        
      default:
        // Evaluate as JavaScript using the worker
        if (workerRef.current) {
          setTerminalHistory(newHistory);
          workerRef.current.postMessage({ type: 'eval', code: command });
        } else {
          newHistory.push("REPL worker not available - use basic commands only");
          setTerminalHistory(newHistory);
        }
        break;
    }

    setTerminalInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTerminalCommand(terminalInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setTerminalInput("");
        } else {
          setHistoryIndex(newIndex);
          setTerminalInput(commandHistory[newIndex]);
        }
      }
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
                          line.startsWith('=>') ? 'text-primary' :
                          line.includes('Error') ? 'text-destructive' :
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
                    onKeyDown={handleKeyDown}
                    placeholder="Type JavaScript or a command..."
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