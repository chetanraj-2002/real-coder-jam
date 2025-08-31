// Web Worker for JavaScript REPL evaluation
// Maintains persistent context and captures console output

interface REPLMessage {
  type: 'eval' | 'reset';
  code?: string;
}

interface REPLResponse {
  type: 'log' | 'result' | 'error' | 'reset-ok';
  level?: string;
  text: string;
}

// Persistent context for variables between evaluations
const context: Record<string, any> = {};

// Create a proxy to handle variable access
const contextProxy = new Proxy(context, {
  get(target, prop) {
    if (prop in target) {
      return target[prop as string];
    }
    // Fall back to global scope for built-in functions and objects
    return (self as any)[prop];
  },
  set(target, prop, value) {
    target[prop as string] = value;
    return true;
  },
  has(target, prop) {
    return prop in target || prop in self;
  }
});

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

function postMessage(response: REPLResponse) {
  (self as any).postMessage(response);
}

function captureConsole() {
  const logs: { level: string; text: string }[] = [];
  
  console.log = (...args) => logs.push({ level: 'log', text: args.map(String).join(' ') });
  console.info = (...args) => logs.push({ level: 'info', text: args.map(String).join(' ') });
  console.warn = (...args) => logs.push({ level: 'warn', text: args.map(String).join(' ') });
  console.error = (...args) => logs.push({ level: 'error', text: args.map(String).join(' ') });
  
  return () => {
    // Restore original console
    Object.assign(console, originalConsole);
    return logs;
  };
}

async function evaluateCode(code: string) {
  const restoreConsole = captureConsole();
  
  try {
    // Wrap in async function to support top-level await
    const asyncFunction = new Function('contextProxy', `
      return (async () => {
        with (contextProxy) {
          ${code}
        }
      })();
    `);
    
    const result = await asyncFunction(contextProxy);
    const logs = restoreConsole();
    
    // Send captured console logs
    logs.forEach(log => {
      postMessage({ type: 'log', level: log.level, text: log.text });
    });
    
    // Send result if it's not undefined
    if (result !== undefined) {
      let resultText: string;
      if (typeof result === 'object' && result !== null) {
        try {
          resultText = JSON.stringify(result, null, 2);
        } catch {
          resultText = String(result);
        }
      } else {
        resultText = String(result);
      }
      postMessage({ type: 'result', text: resultText });
    }
    
  } catch (error) {
    restoreConsole();
    const errorMessage = error instanceof Error ? error.message : String(error);
    postMessage({ type: 'error', text: errorMessage });
  }
}

function resetContext() {
  // Clear all user-defined variables
  for (const key of Object.keys(context)) {
    delete context[key];
  }
  postMessage({ type: 'reset-ok', text: 'Context reset successfully' });
}

// Message handler
self.addEventListener('message', async (event) => {
  const message = event.data as REPLMessage;
  
  switch (message.type) {
    case 'eval':
      if (message.code) {
        await evaluateCode(message.code);
      }
      break;
      
    case 'reset':
      resetContext();
      break;
  }
});

// Export types for TypeScript
export type { REPLMessage, REPLResponse };