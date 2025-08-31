import { toast } from "sonner";

export interface RunCodeResult {
  output: string;
  error?: string;
  executionTime?: number;
}

interface PistonLanguage {
  language: string;
  version: string;
}

// Map our editor languages to Piston API languages
const LANGUAGE_MAP: Record<string, PistonLanguage> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  html: { language: "javascript", version: "18.15.0" }, // Fallback to JS
  css: { language: "javascript", version: "18.15.0" }, // Fallback to JS
  json: { language: "javascript", version: "18.15.0" }, // Fallback to JS
};

export const runCode = async (code: string, language: string): Promise<RunCodeResult> => {
  const pistonLang = LANGUAGE_MAP[language];
  
  if (!pistonLang) {
    return {
      output: "",
      error: `Language ${language} is not supported for execution`
    };
  }

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: pistonLang.language,
        version: pistonLang.version,
        files: [
          {
            name: `main.${getFileExtension(language)}`,
            content: code,
          },
        ],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Categorize errors as syntactical or logical
    if (result.run && result.run.code !== 0 && result.run.stderr) {
      const errorMessage = result.run.stderr;
      const errorType = categorizeError(errorMessage, language);
      return {
        output: result.run.stdout || "",
        error: `${errorType}: ${errorMessage}`,
        executionTime: result.run.time || 0
      };
    }

    if (result.compile && result.compile.code !== 0 && result.compile.stderr) {
      const errorMessage = result.compile.stderr;
      const errorType = categorizeError(errorMessage, language);
      return {
        output: result.compile.stdout || "",
        error: `${errorType}: ${errorMessage}`,
        executionTime: 0
      };
    }

    return {
      output: result.run?.stdout || result.compile?.stdout || "Code executed successfully",
      executionTime: result.run?.time || 0
    };

  } catch (error) {
    console.error("Error running code:", error);
    return {
      output: "",
      error: `Failed to execute code: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

function categorizeError(errorMessage: string, language: string): string {
  const syntaxPatterns: Record<string, RegExp[]> = {
    javascript: [
      /SyntaxError/i,
      /Unexpected token/i,
      /missing/i,
      /expected/i,
      /unterminated/i
    ],
    typescript: [
      /SyntaxError/i,
      /Unexpected token/i,
      /missing/i,
      /expected/i,
      /unterminated/i
    ],
    python: [
      /SyntaxError/i,
      /IndentationError/i,
      /TabError/i,
      /invalid syntax/i,
      /unexpected EOF/i
    ],
    java: [
      /error: /i,
      /expected/i,
      /illegal/i,
      /cannot find symbol/i,
      /class .* is public, should be declared/i
    ],
    cpp: [
      /error: /i,
      /expected/i,
      /missing/i,
      /invalid/i,
      /undeclared/i
    ]
  };

  const logicalPatterns = [
    /ReferenceError/i,
    /TypeError/i,
    /RangeError/i,
    /NameError/i,
    /AttributeError/i,
    /IndexError/i,
    /KeyError/i,
    /ValueError/i,
    /ZeroDivisionError/i,
    /NullPointerException/i,
    /ArrayIndexOutOfBoundsException/i,
    /segmentation fault/i,
    /runtime error/i
  ];

  // Check for syntax errors first
  const langPatterns = syntaxPatterns[language] || [];
  for (const pattern of langPatterns) {
    if (pattern.test(errorMessage)) {
      return "Syntax Error";
    }
  }

  // Check for logical/runtime errors
  for (const pattern of logicalPatterns) {
    if (pattern.test(errorMessage)) {
      return "Runtime Error";
    }
  }

  // Default to compilation error if unclear
  return "Compilation Error";
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: "js",
    typescript: "ts", 
    python: "py",
    java: "java",
    cpp: "cpp",
    html: "html",
    css: "css",
    json: "json"
  };
  
  return extensions[language] || "txt";
}