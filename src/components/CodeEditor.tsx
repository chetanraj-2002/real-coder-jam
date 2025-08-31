import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isActive: boolean;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  roomId: string;
  users: User[];
}

export const CodeEditor = ({ value, onChange, language, roomId, users }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Configure editor theme and options
    editor.updateOptions({
      theme: 'vs-dark',
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'gutter',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
    });

    // Mock collaborative cursors and selections
    simulateCollaborativeCursors();
  };

  const simulateCollaborativeCursors = () => {
    if (!editorRef.current) return;

    // Simulate other users' cursors and selections
    const mockDecorations = users.slice(0, 2).map((user, index) => {
      const randomLine = Math.floor(Math.random() * 10) + 5;
      const randomColumn = Math.floor(Math.random() * 20) + 1;
      
      return {
        range: {
          startLineNumber: randomLine,
          startColumn: randomColumn,
          endLineNumber: randomLine,
          endColumn: randomColumn + 5,
        },
        options: {
          className: `collaborative-selection`,
          hoverMessage: { value: `${user.name} is editing here` },
          stickiness: 1,
          beforeContentClassName: 'collaborative-cursor',
        }
      };
    });

    // Add collaborative decorations with custom styles
    if (mockDecorations.length > 0) {
      const newDecorations = editorRef.current.deltaDecorations(
        decorationsRef.current,
        mockDecorations
      );
      decorationsRef.current = newDecorations;
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        simulateCollaborativeCursors();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [users]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="h-full w-full relative">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          contextmenu: true,
          copyWithSyntaxHighlighting: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always',
          },
          fixedOverflowWidgets: true,
          folding: true,
          foldingHighlight: true,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          fontLigatures: true,
          glyphMargin: true,
          hover: { enabled: true },
          lineHeight: 22,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          links: true,
          minimap: {
            enabled: true,
            renderCharacters: false,
          },
          mouseWheelZoom: true,
          multiCursorMergeOverlapping: true,
          overviewRulerBorder: false,
          padding: { top: 20, bottom: 20 },
          quickSuggestions: true,
          renderLineHighlight: 'gutter',
          roundedSelection: true,
          rulers: [80, 120],
          scrollBeyondLastColumn: 5,
          scrollBeyondLastLine: false,
          selectOnLineNumbers: true,
          smoothScrolling: true,
          suggestOnTriggerCharacters: true,
          wordBasedSuggestions: 'off',
          wordWrap: 'on',
          wrappingIndent: 'indent',
        }}
      />

      {/* Custom CSS for collaborative features */}
      <style>{`
        .collaborative-selection {
          background-color: rgba(16, 185, 129, 0.2) !important;
          border-left: 2px solid #10B981;
        }
        
        .collaborative-cursor::before {
          content: '';
          position: absolute;
          width: 2px;
          height: 20px;
          background-color: #10B981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
          animation: cursor-blink 1s infinite;
        }
        
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        /* Monaco Editor Dark Theme Customization */
        .monaco-editor .margin {
          background-color: hsl(220 15% 6%) !important;
        }
        
        .monaco-editor {
          background-color: hsl(220 15% 6%) !important;
        }
        
        .monaco-editor .monaco-scrollable-element > .scrollbar > .slider {
          background-color: hsl(220 15% 20%) !important;
        }
        
        .monaco-editor .monaco-scrollable-element > .scrollbar > .slider:hover {
          background-color: hsl(220 15% 30%) !important;
        }
        
        .monaco-editor .line-numbers {
          color: hsl(220 10% 45%) !important;
        }
        
        .monaco-editor .current-line ~ .line-numbers {
          color: hsl(220 15% 70%) !important;
        }
        
        .monaco-editor .selected-text {
          background-color: hsl(240 85% 65% / 0.3) !important;
        }
        
        .monaco-editor .focused .selected-text {
          background-color: hsl(240 85% 65% / 0.4) !important;
        }
      `}</style>
    </div>
  );
};