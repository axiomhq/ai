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
    expect(warn).toHaveBeenCalledWith('AsyncLocalStorage not available, using fallback context manager');
  });
});
