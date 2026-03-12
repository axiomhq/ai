import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetContextManagerForTests, createAsyncHook } from '../../../src/evals/context/manager';

type BuiltinModuleLoader = ((id: string) => unknown) | undefined;
type NodeRequireLike = ((id: string) => unknown) | undefined;

type ProcessRef = {
  getBuiltinModule?: BuiltinModuleLoader;
  mainModule?: {
    require?: NodeRequireLike;
  };
};

const processRef = (globalThis as any).process as ProcessRef;

const originalGetBuiltinModule = processRef.getBuiltinModule;
const originalMainModule = processRef.mainModule;
const originalGlobalRequire = (globalThis as any).require as NodeRequireLike;

describe('eval context manager', () => {
  beforeEach(() => {
    __resetContextManagerForTests();
  });

  afterEach(() => {
    processRef.getBuiltinModule = originalGetBuiltinModule;
    processRef.mainModule = originalMainModule;
    (globalThis as any).require = originalGlobalRequire;
    __resetContextManagerForTests();
    vi.restoreAllMocks();
  });

  it('uses AsyncLocalStorage when getBuiltinModule is available', async () => {
    processRef.getBuiltinModule = vi.fn((id: string) => {
      if (id === 'node:async_hooks') {
        return { AsyncLocalStorage };
      }
      return undefined;
    });

    const hook = createAsyncHook<{ requestId: string }>('test-context');

    await hook.run({ requestId: 'req-123' }, async () => {
      await Promise.resolve();
      expect(hook.get()).toEqual({ requestId: 'req-123' });
    });

    expect(hook.get()).toBeUndefined();
  });

  it('uses legacy require fallback when getBuiltinModule is unavailable', async () => {
    processRef.getBuiltinModule = undefined;
    (globalThis as any).require = vi.fn((id: string) => {
      if (id === 'node:async_hooks') {
        throw new Error('MODULE_NOT_FOUND');
      }
      if (id === 'async_hooks') {
        return { AsyncLocalStorage };
      }
      return undefined;
    });

    const fallbackWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    await hook.run({ requestId: 'req-legacy' }, async () => {
      await Promise.resolve();
      expect(hook.get()).toEqual({ requestId: 'req-legacy' });
    });

    expect(fallbackWarn).not.toHaveBeenCalledWith(
      'AsyncLocalStorage not available, using fallback context manager',
    );
  });

  it('falls back when AsyncLocalStorage is unavailable', async () => {
    processRef.getBuiltinModule = vi.fn(() => undefined);
    (globalThis as any).require = undefined;
    processRef.mainModule = { require: undefined };

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    await hook.run({ requestId: 'req-456' }, async () => {
      await Promise.resolve();
      expect(hook.get()).toEqual({ requestId: 'req-456' });
    });

    expect(hook.get()).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'AsyncLocalStorage not available, using fallback context manager',
    );
  });

  it('handles thenables without a finally method in fallback mode', async () => {
    processRef.getBuiltinModule = vi.fn(() => undefined);
    (globalThis as any).require = undefined;
    processRef.mainModule = { require: undefined };

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    const thenable = {
      then(onFulfilled: (value: string) => void) {
        onFulfilled('ok');
      },
    };

    const result = hook.run(
      { requestId: 'req-thenable' },
      () => thenable as any,
    ) as unknown as Promise<string>;

    await expect(result).resolves.toBe('ok');
    expect(hook.get()).toBeUndefined();
  });

  it('rejects nested runs while a fallback run is active', async () => {
    processRef.getBuiltinModule = vi.fn(() => undefined);
    (globalThis as any).require = undefined;
    processRef.mainModule = { require: undefined };

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    let releaseFirst: (() => void) | undefined;
    const firstRun = hook.run({ requestId: 'first' }, async () => {
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      expect(hook.get()).toEqual({ requestId: 'first' });
    });

    await Promise.resolve();

    const secondRun = vi.fn(async () => {
      await Promise.resolve();
    });

    expect(() => {
      hook.run({ requestId: 'second' }, secondRun);
    }).toThrowError('AsyncLocalStorage fallback does not support concurrent async contexts');

    expect(secondRun).not.toHaveBeenCalled();

    releaseFirst?.();
    await firstRun;
  });

  it('blocks nested async runs before they can leak context', async () => {
    processRef.getBuiltinModule = vi.fn(() => undefined);
    (globalThis as any).require = undefined;
    processRef.mainModule = { require: undefined };

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    expect(() => {
      hook.run({ requestId: 'outer' }, () => {
        return hook.run({ requestId: 'inner' }, async () => {
          await Promise.resolve();
          return 'ok';
        });
      });
    }).toThrowError('AsyncLocalStorage fallback does not support concurrent async contexts');

    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(hook.get()).toBeUndefined();
  });

  it('allows nested synchronous runs when no async fallback run is active', () => {
    processRef.getBuiltinModule = vi.fn(() => undefined);
    (globalThis as any).require = undefined;
    processRef.mainModule = { require: undefined };

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    hook.run({ requestId: 'outer' }, () => {
      const nested = hook.run({ requestId: 'inner' }, () => hook.get());
      expect(nested).toEqual({ requestId: 'inner' });
      expect(hook.get()).toEqual({ requestId: 'outer' });
    });

    expect(hook.get()).toBeUndefined();
  });

  it('detects and prevents context leakage in fallback mode', async () => {
    processRef.getBuiltinModule = vi.fn(() => undefined);
    (globalThis as any).require = undefined;
    processRef.mainModule = { require: undefined };

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hook = createAsyncHook<{ requestId: string }>('test-context');

    let resolveInner: (v: any) => void = () => {};
    const innerPromise = new Promise((r) => {
      resolveInner = r;
    });

    hook.run({ requestId: 'outer' }, () => {
      // Start an async run but don't return it
      hook.run({ requestId: 'inner' }, () => innerPromise);
    });

    // Outer run finished synchronously. Context should be restored to undefined.
    expect(hook.get()).toBeUndefined();

    resolveInner(null);
    await innerPromise;
    await new Promise((resolve) => setTimeout(resolve, 0)); // Ensure finally runs

    // After inner promise finished, context should still be undefined, not 'outer'.
    expect(hook.get()).toBeUndefined();
  });
});
