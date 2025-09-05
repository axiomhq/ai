// Simplest approach: Node = AsyncLocalStorage, other = fallback

interface ContextManager<T = any> {
  getStore(): T | undefined;
  run<R>(value: T, fn: () => R): R;
}

let contextManager: ContextManager;

// Detect Node.js environment
const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNodeJS) {
  try {
    // Node.js - use AsyncLocalStorage
    const { AsyncLocalStorage } = require('async_hooks');
    contextManager = new AsyncLocalStorage();
  } catch (_error) {
    // Fallback if async_hooks is not available
    console.warn('AsyncLocalStorage not available, using fallback context manager');
    contextManager = createFallbackManager();
  }
} else {
  // Browser/CF Workers - simple fallback
  contextManager = createFallbackManager();
}

function createFallbackManager(): ContextManager {
  let currentContext: any = null;
  return {
    getStore: () => currentContext,
    run: <R>(value: any, fn: () => R): R => {
      const prev = currentContext;
      currentContext = value;
      try {
        return fn();
      } finally {
        currentContext = prev;
      }
    },
  };
}

export function createAsyncHook<T>(_name: string) {
  return {
    get(): T | undefined {
      if (contextManager.getStore) {
        return contextManager.getStore();
      }
      return undefined;
    },
    run<R>(value: T, fn: () => R): R {
      return contextManager.run(value, fn);
    },
  };
}
