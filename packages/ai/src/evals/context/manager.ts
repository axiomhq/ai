import { AsyncLocalStorage } from 'node:async_hooks';

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

function getContextManager(): ContextManager {
  // Check global Symbol registry cache first (shared across VM contexts)
  const existing = getGlobalContextManager();
  if (existing) return existing;

  const manager = new AsyncLocalStorage();

  // Cache using Symbol to share across VM contexts
  setGlobalContextManager(manager);

  return manager;
}

export function createAsyncHook<T>(_name: string) {
  return {
    get(): T | undefined {
      return getContextManager().getStore();
    },
    run<R>(value: T, fn: () => R): R {
      return getContextManager().run(value, fn);
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
