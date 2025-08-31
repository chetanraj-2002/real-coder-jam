import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SystemTerminalProps {
  terminalId: string;
  isActive: boolean;
}

interface TerminalEntry {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export function SystemTerminal({ terminalId, isActive }: SystemTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: '1',
      type: 'output',
      content: `LineCraft Terminal v1.0.0 (${terminalId})
Type 'help' for available commands`,
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const addEntry = (type: TerminalEntry['type'], content: string) => {
    const entry: TerminalEntry = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setEntries(prev => [...prev, entry]);
  };

  const executeCommand = (command: string) => {
    const cmd = command.trim();
    if (!cmd) return;

    // Add to history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Add command to output
    addEntry('command', `$ ${cmd}`);

    // Process command
    const [baseCmd, ...args] = cmd.split(' ');
    
    switch (baseCmd.toLowerCase()) {
      case 'help':
        addEntry('output', `Available commands:
  help           Show this help message
  clear          Clear the terminal
  echo <text>    Display text
  date           Show current date and time
  pwd            Show current directory (simulated)
  ls             List directory contents (simulated)
  whoami         Show current user
  history        Show command history
  uname          Show system information
  ps             Show running processes (simulated)
  env            Show environment variables (limited)
  node -v        Show Node.js version (simulated)
  npm -v         Show npm version (simulated)
  git --version  Show Git version (simulated)`);
        break;
      
      case 'clear':
        setEntries([{
          id: Date.now().toString(),
          type: 'output',
          content: `LineCraft Terminal v1.0.0 (${terminalId})
Type 'help' for available commands`,
          timestamp: new Date()
        }]);
        return;
      
      case 'echo':
        addEntry('output', args.join(' '));
        break;
      
      case 'date':
        addEntry('output', new Date().toString());
        break;
      
      case 'pwd':
        addEntry('output', '/workspace/linecraft');
        break;
      
      case 'ls':
        addEntry('output', `src/
components/
public/
package.json
tsconfig.json
vite.config.ts
README.md`);
        break;
      
      case 'whoami':
        addEntry('output', 'linecraft-user');
        break;
      
      case 'history':
        addEntry('output', commandHistory.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n'));
        break;
      
      case 'uname':
        addEntry('output', 'LineCraft 1.0.0 (Web Terminal)');
        break;
      
      case 'ps':
        addEntry('output', `  PID TTY          TIME CMD
    1 tty1     00:00:01 linecraft-editor
   42 tty1     00:00:00 monaco-worker
  123 tty1     00:00:00 vite-dev-server`);
        break;
      
      case 'env':
        addEntry('output', `NODE_ENV=development
TERMINAL_ID=${terminalId}
PWD=/workspace/linecraft
USER=linecraft-user`);
        break;
      
      case 'node':
        if (args[0] === '-v' || args[0] === '--version') {
          addEntry('output', 'v20.11.0');
        } else {
          addEntry('error', 'Interactive Node.js not available in web terminal');
        }
        break;
      
      case 'npm':
        if (args[0] === '-v' || args[0] === '--version') {
          addEntry('output', '10.2.4');
        } else {
          addEntry('error', 'npm commands not available in web terminal');
        }
        break;
      
      case 'git':
        if (args[0] === '--version') {
          addEntry('output', 'git version 2.40.1');
        } else {
          addEntry('error', 'git commands not available in web terminal');
        }
        break;
      
      default:
        addEntry('error', `bash: ${baseCmd}: command not found
Type 'help' for available commands`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput("");
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex] || "");
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            bash
          </Badge>
          <span className="text-xs text-muted-foreground">Terminal {terminalId}</span>
        </div>
      </div>

      {/* Terminal Output */}
      <ScrollArea className="flex-1 bg-editor-background">
        <div className="p-3">
          {entries.map((entry) => (
            <div key={entry.id} className="font-mono text-xs mb-1">
              {entry.type === 'command' && (
                <div className="text-accent">{entry.content}</div>
              )}
              {entry.type === 'output' && (
                <div className="text-foreground whitespace-pre-wrap">{entry.content}</div>
              )}
              {entry.type === 'error' && (
                <div className="text-destructive">{entry.content}</div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {/* Terminal Input */}
      <div className="border-t border-border bg-editor-background p-3">
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono text-xs">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-foreground"
            placeholder="Enter command..."
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}