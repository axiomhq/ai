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

const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;

function getContextManager(): ContextManager {
  // Check global Symbol registry cache first (shared across VM contexts)
  const existing = getGlobalContextManager();
  if (existing) {
    return existing;
  }

  let manager: ContextManager;

  if (isNodeJS) {
    try {
      // Try dynamic require approaches to work in both Node.js and bundled environments
      let AsyncLocalStorage;

      try {
        // Try direct require first (works in most Node.js contexts)
        const requireFn = [eval][0]('require');
        AsyncLocalStorage = requireFn('async_hooks').AsyncLocalStorage;
      } catch (directError) {
        try {
          // Fallback: createRequire approach (works in VM contexts like Vitest)
          const requireFn = [eval][0]('require');
          const { createRequire } = requireFn('module');
          const dynamicRequire = createRequire(import.meta.url);
          AsyncLocalStorage = dynamicRequire('async_hooks').AsyncLocalStorage;
        } catch (_createRequireError) {
          // If both approaches fail, re-throw the original error for better debugging
          throw directError;
        }
      }

      manager = new AsyncLocalStorage();
    } catch (error) {
      // Fallback if async_hooks is not available
      console.warn('AsyncLocalStorage not available, using fallback context manager:', error);
      manager = createFallbackManager();
    }
  } else {
    // Browser/CF Workers - simple fallback (no warning needed here)
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
