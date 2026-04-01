interface ContextManager<T = any> {
  getStore(): T | undefined;
  run<R>(value: T, fn: () => R): R;
}

type AsyncLocalStorageLike = new () => ContextManager;
type AsyncHooksModuleLike = { AsyncLocalStorage?: AsyncLocalStorageLike };
type ProcessWithBuiltinModule = NodeJS.Process & {
  getBuiltinModule?: (id: string) => AsyncHooksModuleLike | undefined;
};

const CONTEXT_MANAGER_SYMBOL = Symbol.for('axiom.context_manager');
const globalScope = globalThis as typeof globalThis & {
  process?: ProcessWithBuiltinModule;
  [key: symbol]: unknown;
};

function getGlobalContextManager(): ContextManager | undefined {
  return globalScope[CONTEXT_MANAGER_SYMBOL] as ContextManager | undefined;
}

function setGlobalContextManager(manager: ContextManager): void {
  globalScope[CONTEXT_MANAGER_SYMBOL] = manager;
}

const isBrowser = typeof window !== 'undefined';

function getAsyncLocalStorageConstructor(): AsyncLocalStorageLike | undefined {
  const processWithBuiltinModule = globalScope.process;

  if (
    !processWithBuiltinModule ||
    typeof processWithBuiltinModule.getBuiltinModule !== 'function'
  ) {
    return undefined;
  }

  try {
    const asyncHooksModule =
      processWithBuiltinModule.getBuiltinModule('node:async_hooks') ??
      processWithBuiltinModule.getBuiltinModule('async_hooks');
    return asyncHooksModule?.AsyncLocalStorage;
  } catch {
    return undefined;
  }
}

function getContextManager(): ContextManager {
  // Check global Symbol registry cache first (shared across VM contexts)
  const existing = getGlobalContextManager();
  if (existing) return existing;

  let manager: ContextManager;

  try {
    const AsyncLocalStorage = getAsyncLocalStorageConstructor();
    if (!AsyncLocalStorage) {
      throw new Error('Unable to resolve AsyncLocalStorage');
    }
    manager = new AsyncLocalStorage();
  } catch (error) {
    // In browser fallback is expected, so avoid noisy warnings there.
    if (!isBrowser) {
      console.warn('AsyncLocalStorage not available, using fallback context manager:', error);
    }
    manager = createFallbackManager();
  }

  // Cache using Symbol to share across VM contexts
  setGlobalContextManager(manager);

  return manager;
}

function createFallbackManager(): ContextManager {
  let currentContext: unknown;
  return {
    getStore: () => currentContext,
    run: <R>(value: unknown, fn: () => R): R => {
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
      return getContextManager().getStore() as T | undefined;
    },
    run<R>(value: T, fn: () => R): R {
      const manager = getContextManager();
      return manager.run(value, fn);
    },
  };
}
