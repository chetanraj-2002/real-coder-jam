import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  X, 
  Play, 
  Copy,
  ChevronUp,
  ChevronDown,
  Terminal as TerminalIcon,
  Code2
} from "lucide-react";
import { JSTerminal } from "./terminal/JSTerminal";
import { SystemTerminal } from "./terminal/SystemTerminal";
import { toast } from "sonner";

interface MultiTerminalProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  output: string;
  error?: string;
  executionTime?: number;
  isRunning: boolean;
  onRunCode: () => void;
  canRun: boolean;
}

interface Terminal {
  id: string;
  type: 'js' | 'system';
  name: string;
}

export function MultiTerminal({
  isCollapsed,
  onToggleCollapse,
  output,
  error,
  executionTime,
  isRunning,
  onRunCode,
  canRun
}: MultiTerminalProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: '1', type: 'js', name: 'JS/TS' }
  ]);
  const [activeTab, setActiveTab] = useState("output");

  const addTerminal = useCallback((type: 'js' | 'system') => {
    const id = Date.now().toString();
    const name = type === 'js' ? `JS/TS ${terminals.filter(t => t.type === 'js').length + 1}` 
                              : `Terminal ${terminals.filter(t => t.type === 'system').length + 1}`;
    
    const newTerminal: Terminal = { id, type, name };
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTab(`terminal-${id}`);
    toast.success(`${type === 'js' ? 'JavaScript' : 'System'} terminal created`);
  }, [terminals]);

  const removeTerminal = useCallback((terminalId: string) => {
    setTerminals(prev => {
      const filtered = prev.filter(t => t.id !== terminalId);
      // If we removed the active terminal, switch to first available or output
      if (activeTab === `terminal-${terminalId}`) {
        setActiveTab(filtered.length > 0 ? `terminal-${filtered[0].id}` : 'output');
      }
      return filtered;
    });
    toast.success("Terminal closed");
  }, [activeTab]);

  const copyOutput = () => {
    const textToCopy = error || output;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Output copied to clipboard");
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-12 bg-card border-t border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Console</span>
          </div>
          
          {(error || output) && (
            <Badge variant={error ? "destructive" : "secondary"} className="text-xs">
              {error ? "Error" : "Output"}
            </Badge>
          )}
          
          {executionTime !== undefined && (
            <Badge variant="outline" className="text-xs">
              {executionTime}ms
            </Badge>
          )}
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
            onClick={onToggleCollapse}
            className="h-7 w-7 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-card border-t border-border flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Console & Terminals</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addTerminal('js')}
            className="h-7 px-2 gap-1 text-xs"
            title="New JavaScript Terminal"
          >
            <Code2 className="h-3 w-3" />
            JS
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addTerminal('system')}
            className="h-7 px-2 gap-1 text-xs"
            title="New System Terminal"
          >
            <TerminalIcon className="h-3 w-3" />
            Bash
          </Button>
          
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
            onClick={onToggleCollapse}
            className="h-7 w-7 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border px-4">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger value="output" className="text-xs h-7 px-3">
              Output
              {(error || output) && (
                <Badge 
                  variant={error ? "destructive" : "secondary"} 
                  className="ml-1 h-3 w-3 p-0 text-[8px] rounded-full"
                >
                  ●
                </Badge>
              )}
            </TabsTrigger>
            
            {terminals.map((terminal) => (
              <TabsTrigger 
                key={terminal.id} 
                value={`terminal-${terminal.id}`} 
                className="text-xs h-7 px-3 group"
              >
                {terminal.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTerminal(terminal.id);
                  }}
                  className="ml-1 h-3 w-3 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2 w-2" />
                </Button>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Output Tab */}
        <TabsContent value="output" className="flex-1 m-0">
          <div className="h-full flex flex-col">
            {/* Output Header */}
            <div className="flex items-center justify-between p-3 pb-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOutput}
                disabled={!output && !error}
                className="h-6 px-2 text-xs gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>

            {/* Output Content */}
            <ScrollArea className="flex-1 mx-3 mb-3 border rounded-md">
              <div className="p-3 font-mono text-xs">
                {error ? (
                  <div className="text-destructive whitespace-pre-wrap">{error}</div>
                ) : output ? (
                  <div className="text-foreground whitespace-pre-wrap">{output}</div>
                ) : (
                  <div className="text-muted-foreground italic">
                    No output yet. Run some code to see results here.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Terminal Tabs */}
        {terminals.map((terminal) => (
          <TabsContent 
            key={terminal.id} 
            value={`terminal-${terminal.id}`} 
            className="flex-1 m-0"
          >
            {terminal.type === 'js' ? (
              <JSTerminal 
                terminalId={terminal.id} 
                isActive={activeTab === `terminal-${terminal.id}`}
              />
            ) : (
              <SystemTerminal 
                terminalId={terminal.id} 
                isActive={activeTab === `terminal-${terminal.id}`}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}