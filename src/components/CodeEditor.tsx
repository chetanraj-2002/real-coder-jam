import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  roomId: string;
}

export const CodeEditor = ({ value, onChange, language, roomId }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);

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
  };

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

      {/* Custom CSS for Monaco Editor */}
      <style>{`

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