import { useState, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface JSTerminalProps {
  terminalId: string;
  isActive: boolean;
}

interface TerminalEntry {
  id: string;
  type: 'command' | 'result' | 'error';
  content: string;
  timestamp: Date;
}

export function JSTerminal({ terminalId, isActive }: JSTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: '1',
      type: 'result',
      content: `// JavaScript/TypeScript Terminal (${terminalId})
// You can execute JavaScript code here
// Examples: console.log('Hello'), 1 + 1, Math.random()`,
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addEntry = useCallback((type: TerminalEntry['type'], content: string) => {
    const entry: TerminalEntry = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setEntries(prev => [...prev, entry]);
  }, []);

  const executeJS = useCallback((code: string) => {
    addEntry('command', `> ${code}`);
    
    try {
      // Create a safe execution environment
      const originalConsole = console;
      const logs: string[] = [];
      
      // Override console methods to capture output
      const mockConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        error: (...args: any[]) => {
          logs.push(`Error: ${args.join(' ')}`);
        },
        warn: (...args: any[]) => {
          logs.push(`Warning: ${args.join(' ')}`);
        },
        info: (...args: any[]) => {
          logs.push(`Info: ${args.join(' ')}`);
        }
      };

      // Replace console temporarily
      (globalThis as any).console = mockConsole;
      
      // Execute the code
      const result = eval(code);
      
      // Restore console
      (globalThis as any).console = originalConsole;
      
      // Show console output first if any
      if (logs.length > 0) {
        addEntry('result', logs.join('\n'));
      }
      
      // Show return value if it's not undefined
      if (result !== undefined) {
        const resultStr = typeof result === 'object' 
          ? JSON.stringify(result, null, 2)
          : String(result);
        addEntry('result', resultStr);
      } else if (logs.length === 0) {
        addEntry('result', 'undefined');
      }
      
    } catch (error) {
      addEntry('error', `${error}`);
    }
  }, [addEntry]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      }
      
      e.preventDefault();
      const code = currentInput.trim();
      if (code) {
        executeJS(code);
        setCurrentInput("");
      }
    }
  };

  const clearTerminal = () => {
    setEntries([{
      id: Date.now().toString(),
      type: 'result',
      content: `// Terminal cleared (${terminalId})`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            JS/TS
          </Badge>
          <span className="text-xs text-muted-foreground">Terminal {terminalId}</span>
        </div>
        <button
          onClick={clearTerminal}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50"
        >
          Clear
        </button>
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="font-mono text-xs">
              {entry.type === 'command' && (
                <div className="text-accent">{entry.content}</div>
              )}
              {entry.type === 'result' && (
                <div className="text-foreground whitespace-pre-wrap">{entry.content}</div>
              )}
              {entry.type === 'error' && (
                <div className="text-destructive">{entry.content}</div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Terminal Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-start gap-2">
          <span className="text-accent font-mono text-xs mt-1">&gt;</span>
          <textarea
            ref={inputRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter JavaScript/TypeScript code... (Shift+Enter for new line)"
            className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-xs text-foreground placeholder:text-muted-foreground min-h-[20px] max-h-24"
            rows={1}
            style={{ 
              minHeight: '20px',
              height: currentInput.split('\n').length * 16 + 4 + 'px'
            }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Press Enter to execute • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}