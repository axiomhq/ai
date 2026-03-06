interface ContextManager<T = any> {
  getStore(): T | undefined;
  run<R>(value: T, fn: () => R): R;
}

type AsyncLocalStorageLikeConstructor = new <T = any>() => ContextManager<T>;

type NodeRequireLike = (id: string) => unknown;

const CONTEXT_MANAGER_SYMBOL = Symbol.for('axiom.context_manager');

const FALLBACK_CONCURRENCY_ERROR =
  'AsyncLocalStorage fallback does not support concurrent async contexts';

function getGlobalContextManager(): ContextManager | undefined {
  return (globalThis as any)[CONTEXT_MANAGER_SYMBOL];
}

function setGlobalContextManager(manager: ContextManager): void {
  (globalThis as any)[CONTEXT_MANAGER_SYMBOL] = manager;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

function createFallbackManager(): ContextManager {
  let currentContext: any = undefined;
  let activeRuns = 0;

  return {
    getStore: () => currentContext,
    run: <R>(value: any, fn: () => R): R => {
      if (activeRuns > 0) {
        throw new Error(FALLBACK_CONCURRENCY_ERROR);
      }

      activeRuns += 1;
      const previousContext = currentContext;
      currentContext = value;

      const cleanup = () => {
        activeRuns -= 1;
        if (currentContext === value) {
          currentContext = previousContext;
        }
      };

      let result: R;
      try {
        result = fn();
      } catch (error) {
        cleanup();
        throw error;
      }

      if (isPromiseLike(result)) {
        return Promise.resolve(result).finally(cleanup) as R;
      }

      cleanup();
      return result;
    },
  };
}

function getAsyncLocalStorageFromModule(module: unknown): AsyncLocalStorageLikeConstructor | undefined {
  const asyncLocalStorageCtor = (module as { AsyncLocalStorage?: AsyncLocalStorageLikeConstructor })
    ?.AsyncLocalStorage;
  return typeof asyncLocalStorageCtor === 'function' ? asyncLocalStorageCtor : undefined;
}

function getLegacyNodeRequire(): NodeRequireLike | undefined {
  const processRef = (globalThis as any).process as { mainModule?: { require?: NodeRequireLike } };
  const globalRequire = (globalThis as any).require as NodeRequireLike | undefined;

  if (typeof globalRequire === 'function') {
    return globalRequire;
  }

  const mainModuleRequire = processRef?.mainModule?.require;
  if (typeof mainModuleRequire === 'function') {
    return mainModuleRequire;
  }

  return undefined;
}

function getAsyncLocalStorageFromLegacyRequire(
  legacyRequire: NodeRequireLike,
): AsyncLocalStorageLikeConstructor | undefined {
  let asyncHooksModule: unknown;

  try {
    asyncHooksModule = legacyRequire('node:async_hooks');
  } catch {
    try {
      asyncHooksModule = legacyRequire('async_hooks');
    } catch {
      return undefined;
    }
  }

  return getAsyncLocalStorageFromModule(asyncHooksModule);
}

function getAsyncLocalStorageConstructor(): AsyncLocalStorageLikeConstructor | undefined {
  const getBuiltinModule = (globalThis as any).process?.getBuiltinModule as
    | ((id: string) => unknown)
    | undefined;

  if (typeof getBuiltinModule === 'function') {
    try {
      const asyncHooksModule =
        getBuiltinModule('node:async_hooks') ?? getBuiltinModule('async_hooks');

      const asyncLocalStorageCtor = getAsyncLocalStorageFromModule(asyncHooksModule);
      if (asyncLocalStorageCtor) {
        return asyncLocalStorageCtor;
      }
    } catch (error) {
      console.warn('Failed to load AsyncLocalStorage from node:async_hooks:', error);
    }
  }

  const legacyRequire = getLegacyNodeRequire();
  if (typeof legacyRequire === 'function') {
    try {
      const asyncLocalStorageCtor = getAsyncLocalStorageFromLegacyRequire(legacyRequire);
      if (asyncLocalStorageCtor) {
        return asyncLocalStorageCtor;
      }
    } catch (error) {
      console.warn('Failed to load AsyncLocalStorage via legacy require fallback:', error);
    }
  }

  const globalAsyncLocalStorage = (globalThis as any).AsyncLocalStorage;
  if (typeof globalAsyncLocalStorage === 'function') {
    return globalAsyncLocalStorage as AsyncLocalStorageLikeConstructor;
  }

  return undefined;
}

function getContextManager(): ContextManager {
  // Check global Symbol registry cache first (shared across VM contexts)
  const existing = getGlobalContextManager();
  if (existing) return existing;

  const AsyncLocalStorageCtor = getAsyncLocalStorageConstructor();
  const manager = AsyncLocalStorageCtor ? new AsyncLocalStorageCtor() : createFallbackManager();

  if (!AsyncLocalStorageCtor) {
    console.warn('AsyncLocalStorage not available, using fallback context manager');
  }

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

