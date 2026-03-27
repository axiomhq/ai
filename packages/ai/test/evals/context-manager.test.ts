import { describe, expect, it, vi, afterEach } from 'vitest';
import { createAsyncHook } from '../../src/evals/context/manager';

const CONTEXT_MANAGER_SYMBOL = Symbol.for('axiom.context_manager');
const originalGetBuiltinModule = (
  process as NodeJS.Process & {
    getBuiltinModule?: (id: string) => unknown;
  }
).getBuiltinModule;

class FakeAsyncLocalStorage<T = unknown> {
  private currentStore: T | undefined;

  getStore(): T | undefined {
    return this.currentStore;
  }

  run<R>(value: T, fn: () => R): R {
    const previousStore = this.currentStore;
    this.currentStore = value;
    try {
      return fn();
    } finally {
      this.currentStore = previousStore;
    }
  }
}

function resetContextManagerSingleton(): void {
  delete (globalThis as any)[CONTEXT_MANAGER_SYMBOL];
}

function setGetBuiltinModule(fn?: (id: string) => unknown): void {
  (process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }).getBuiltinModule =
    fn;
}

describe('evals context manager async_hooks detection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetContextManagerSingleton();
    setGetBuiltinModule(originalGetBuiltinModule);
  });

  it('prefers node:async_hooks via getBuiltinModule', () => {
    const getBuiltinModule = vi.fn((id: string) => {
      if (id === 'node:async_hooks') {
        return { AsyncLocalStorage: FakeAsyncLocalStorage };
      }
      return undefined;
    });
    setGetBuiltinModule(getBuiltinModule);

    const hook = createAsyncHook<string>('test');
    const value = hook.run('hello', () => hook.get());

    expect(value).toBe('hello');
    expect(getBuiltinModule).toHaveBeenCalledWith('node:async_hooks');
  });

  it('falls back to async_hooks when node:async_hooks is unavailable', () => {
    const getBuiltinModule = vi.fn((id: string) => {
      if (id === 'async_hooks') {
        return { AsyncLocalStorage: FakeAsyncLocalStorage };
      }
      return undefined;
    });
    setGetBuiltinModule(getBuiltinModule);

    const hook = createAsyncHook<number>('test');
    const value = hook.run(42, () => hook.get());

    expect(value).toBe(42);
    expect(getBuiltinModule).toHaveBeenNthCalledWith(1, 'node:async_hooks');
    expect(getBuiltinModule).toHaveBeenNthCalledWith(2, 'async_hooks');
  });

  it('uses fallback manager and warns when getBuiltinModule is unavailable', () => {
    setGetBuiltinModule(undefined);
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const hook = createAsyncHook<string>('test');
    const value = hook.run('fallback', () => hook.get());

    expect(value).toBe('fallback');
    expect(warningSpy).toHaveBeenCalledWith(
      'AsyncLocalStorage not available, using fallback context manager:',
      expect.any(Error),
    );
  });

  it('uses fallback manager and warns when getBuiltinModule throws', () => {
    setGetBuiltinModule(() => {
      throw new Error('missing module');
    });
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const hook = createAsyncHook<string>('test');
    const value = hook.run('fallback', () => hook.get());

    expect(value).toBe('fallback');
    expect(warningSpy).toHaveBeenCalledWith(
      'AsyncLocalStorage not available, using fallback context manager:',
      expect.any(Error),
    );
  });
});
