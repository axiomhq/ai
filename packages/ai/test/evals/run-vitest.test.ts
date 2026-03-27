import { writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedAxiomConfig } from '../../src/config/index';

const mocks = vi.hoisted(() => ({
  createVitest: vi.fn(),
  registerConsoleShortcuts: vi.fn(),
  flush: vi.fn(),
  initInstrumentation: vi.fn(),
  setAxiomConfig: vi.fn(),
}));

vi.mock('vitest/node', () => ({
  createVitest: mocks.createVitest,
  registerConsoleShortcuts: mocks.registerConsoleShortcuts,
}));

vi.mock('../../src/evals/instrument', () => ({
  flush: mocks.flush,
  initInstrumentation: mocks.initInstrumentation,
}));

vi.mock('../../src/evals/context/storage', () => ({
  setAxiomConfig: mocks.setAxiomConfig,
}));

import { runVitest } from '../../src/evals/run-vitest';

type MockTestModule = {
  ok: () => boolean;
  state: () => string;
};

type MockVitestInstance = {
  collect: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  shouldKeepServer: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  config: {
    dangerouslyIgnoreUnhandledErrors: boolean;
  };
  state: {
    getCountOfFailedTests: ReturnType<typeof vi.fn>;
  };
};

const resolvedConfig: ResolvedAxiomConfig = {
  eval: {
    url: 'https://api.axiom.co',
    edgeUrl: 'https://api.axiom.co',
    token: 'axiom-token',
    dataset: 'axiom-dataset',
    orgId: '',
    flagSchema: null,
    instrumentation: null,
    timeoutMs: 60_000,
    include: ['**/*.eval.ts'],
    exclude: ['**/node_modules/**'],
  },
};

const baseOptions = {
  watch: false,
  include: ['**/*.eval.ts'],
  config: resolvedConfig,
  runId: 'RUNVITESTTEST',
};

const createTestModule = (state = 'passed', ok = true): MockTestModule => ({
  ok: () => ok,
  state: () => state,
});

const createVitestInstance = ({
  failedTests = 0,
  shouldKeepServer = false,
  dangerouslyIgnoreUnhandledErrors = false,
  startResult = {
    testModules: [createTestModule()],
    unhandledErrors: [],
  },
  collectResult = {
    testModules: [],
    unhandledErrors: [],
  },
}: {
  failedTests?: number;
  shouldKeepServer?: boolean;
  dangerouslyIgnoreUnhandledErrors?: boolean;
  startResult?: {
    testModules: MockTestModule[];
    unhandledErrors: unknown[];
  };
  collectResult?: {
    testModules: MockTestModule[];
    unhandledErrors: unknown[];
  };
} = {}): MockVitestInstance => ({
  collect: vi.fn().mockResolvedValue(collectResult),
  close: vi.fn().mockResolvedValue(undefined),
  shouldKeepServer: vi.fn(() => shouldKeepServer),
  start: vi.fn().mockResolvedValue(startResult),
  config: {
    dangerouslyIgnoreUnhandledErrors,
  },
  state: {
    getCountOfFailedTests: vi.fn(() => failedTests),
  },
});

describe('runVitest', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.flush.mockResolvedValue(undefined);
    mocks.initInstrumentation.mockResolvedValue(undefined);
    mocks.registerConsoleShortcuts.mockReturnValue(vi.fn());
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    delete process.env.AXIOM_EVAL;
    delete process.env.AXIOM_NAME_REGISTRY_FILE;
    delete process.env.AXIOM_ABORT_FILE;
  });

  it('marks eval runs with AXIOM_EVAL and eval mode', async () => {
    const vitest = createVitestInstance();

    mocks.createVitest.mockResolvedValue(vitest);

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:0');

    expect(process.env.AXIOM_EVAL).toBe('true');
    expect(mocks.createVitest).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        config: false,
        mode: 'eval',
        name: 'axiom:eval',
      }),
      expect.any(Object),
    );
  });

  it('exits 0 after a successful non-watch run', async () => {
    const callOrder: string[] = [];
    const dispose = vi.fn(() => {
      callOrder.push('dispose');
    });
    const vitest = createVitestInstance();

    mocks.createVitest.mockResolvedValue(vitest);
    mocks.registerConsoleShortcuts.mockReturnValue(dispose);
    mocks.flush.mockImplementation(async () => {
      callOrder.push('flush');
    });
    vitest.close.mockImplementation(async () => {
      callOrder.push('close');
    });

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:0');

    expect(vitest.start).toHaveBeenCalledTimes(1);
    expect(vitest.state.getCountOfFailedTests).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['dispose', 'flush', 'close']);
  });

  it('exits 1 when Vitest reports failed tests', async () => {
    const vitest = createVitestInstance({ failedTests: 2 });

    mocks.createVitest.mockResolvedValue(vitest);

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:1');

    expect(vitest.start).toHaveBeenCalledTimes(1);
    expect(mocks.flush).toHaveBeenCalledTimes(1);
    expect(vitest.close).toHaveBeenCalledTimes(1);
  });

  it('exits 1 when Vitest reports unhandled errors', async () => {
    const vitest = createVitestInstance({
      startResult: {
        testModules: [createTestModule()],
        unhandledErrors: [new Error('boom')],
      },
    });

    mocks.createVitest.mockResolvedValue(vitest);

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:1');

    expect(vitest.state.getCountOfFailedTests).toHaveBeenCalledTimes(1);
    expect(mocks.flush).toHaveBeenCalledTimes(1);
    expect(vitest.close).toHaveBeenCalledTimes(1);
  });

  it('exits 0 when unhandled errors are ignored by Vitest config', async () => {
    const vitest = createVitestInstance({
      dangerouslyIgnoreUnhandledErrors: true,
      startResult: {
        testModules: [createTestModule()],
        unhandledErrors: [new Error('boom')],
      },
    });

    mocks.createVitest.mockResolvedValue(vitest);

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:0');

    expect(vitest.state.getCountOfFailedTests).toHaveBeenCalledTimes(1);
    expect(mocks.flush).toHaveBeenCalledTimes(1);
    expect(vitest.close).toHaveBeenCalledTimes(1);
  });

  it('exits 1 when a test module fails outside failed test counting', async () => {
    const vitest = createVitestInstance({
      startResult: {
        testModules: [createTestModule('failed', false)],
        unhandledErrors: [],
      },
    });

    mocks.createVitest.mockResolvedValue(vitest);

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:1');

    expect(vitest.state.getCountOfFailedTests).toHaveBeenCalledTimes(1);
  });

  it('keeps list mode exiting 0 without starting tests', async () => {
    const vitest = createVitestInstance();

    mocks.createVitest.mockResolvedValue(vitest);

    await expect(runVitest('.', { ...baseOptions, list: true })).rejects.toThrow('process.exit:0');

    expect(vitest.collect).toHaveBeenCalledTimes(1);
    expect(vitest.start).not.toHaveBeenCalled();
    expect(mocks.registerConsoleShortcuts).not.toHaveBeenCalled();
    expect(mocks.flush).not.toHaveBeenCalled();
  });

  it('preserves validation abort failures with exit code 1', async () => {
    const vitest = createVitestInstance({
      startResult: {
        testModules: [createTestModule()],
        unhandledErrors: [],
      },
    });

    mocks.createVitest.mockResolvedValue(vitest);
    vitest.start.mockImplementation(async () => {
      writeFileSync(process.env.AXIOM_ABORT_FILE!, 'validation failed', 'utf8');
      return {
        testModules: [createTestModule()],
        unhandledErrors: [],
      };
    });

    await expect(runVitest('.', baseOptions)).rejects.toThrow('process.exit:1');

    expect(mocks.registerConsoleShortcuts).not.toHaveBeenCalled();
    expect(mocks.flush).not.toHaveBeenCalled();
    expect(vitest.close).toHaveBeenCalledTimes(1);
  });
});
