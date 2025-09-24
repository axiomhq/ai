import { createRequire } from 'node:module';

interface ContextManager<T = any> {
  getStore(): T | undefined;
  run<R>(value: T, fn: () => R): R;
}

const CONTEXT_MANAGER_SYMBOL = Symbol.for('axiom.context_manager');

function getGlobalContextManager(): ContextManager | undefined {
  return (globalThis as any)[CONTEXT_MANAGER_SYMBOL];
}

function setGlobalContextManager(manager: ContextManager): void {
  (globalThis as any)[CONTEXT_MANAGER_SYMBOL] = manager;
}

const isNodeJS = typeof process !== 'undefined' && !!process.versions?.node;

function getContextManager(): ContextManager {
  // Check global Symbol registry cache first (shared across VM contexts)
  const existing = getGlobalContextManager();
  if (existing) return existing;

  let manager: ContextManager;

  if (isNodeJS) {
    try {
      // Resolve AsyncLocalStorage in both ESM and CJS Node contexts without bundler interference
      let AsyncLocalStorage: any;

      // Use createRequire to obtain a require in ESM
      const req = createRequire(import.meta.url);
      try {
        AsyncLocalStorage = req('node:async_hooks').AsyncLocalStorage;
      } catch {
        AsyncLocalStorage = req('async_hooks').AsyncLocalStorage;
      }

      manager = new AsyncLocalStorage();
    } catch (error) {
      // Fallback if AsyncLocalStorage cannot be loaded
      console.warn('AsyncLocalStorage not available, using fallback context manager:', error);
      manager = createFallbackManager();
    }
  } else {
    // Browser/CF Workers - simple fallback (no warning needed here)
    console.warn('AsyncLocalStorage not available, using fallback context manager');
    manager = createFallbackManager();
  }

  // Cache using Symbol to share across VM contexts
  setGlobalContextManager(manager);

  return manager;
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
      const manager = getContextManager();
      if (manager.getStore) {
        return manager.getStore();
      }
      return undefined;
    },
    run<R>(value: T, fn: () => R): R {
      const manager = getContextManager();
      return manager.run(value, fn);
    },
  };
}

/**
 * Reset the context manager singleton for tests.
 * This clears the global cache and forces a new AsyncLocalStorage instance to be created.
 * Useful for test isolation when needed.
 */
export function __resetContextManagerForTests(): void {
  delete (globalThis as any)[CONTEXT_MANAGER_SYMBOL];
}
