// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../../src/app-scope';
import type { ResolvedAxiomConfig } from '../../src/config/index';

type MockTask = { meta: Record<string, any> };
type MockSuite = {
  name: string;
  file: string;
  meta: Record<string, any>;
  tasks: MockTask[];
};

const createConfig = (): ResolvedAxiomConfig =>
  ({
    eval: {
      url: 'https://example.com',
      edgeUrl: 'https://example.com',
      token: 'token-123',
      dataset: 'dataset-123',
      orgId: 'org-123',
      instrumentation: null,
      flagSchema: z.object({}).loose(),
      include: [],
      exclude: [],
      timeoutMs: 10_000,
    },
  }) as ResolvedAxiomConfig;

describe.sequential('eval trial metadata capture', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock('vitest');
  });

  it('uses failed trial context for runtime flags and out-of-scope flags instead of stale prior case state', async () => {
    (globalThis as any).__SDK_VERSION__ = 'test-version';
    vi.spyOn(console, 'log').mockImplementation(() => {});

    let resolveDone: (() => void) | undefined;
    let rejectDone: ((error: unknown) => void) | undefined;
    const done = new Promise<void>((resolve, reject) => {
      resolveDone = resolve;
      rejectDone = reject;
    });
    const state: { suite: MockSuite | undefined } = { suite: undefined };

    vi.doMock('vitest', () => {
      let beforeAllHook: ((suite: MockSuite) => Promise<void> | void) | undefined;
      let afterAllHook: ((suite: MockSuite) => Promise<void> | void) | undefined;
      const testFns: Array<(suite: MockSuite) => Promise<void> | void> = [];

      const itMock = Object.assign(
        (_name: string, _fn: (task: MockTask) => Promise<void> | void) => {},
        {
          concurrent: {
            for: <T>(items: T[]) =>
              (_name: string, fn: (data: T, context: { task: MockTask }) => Promise<void> | void) => {
                for (const item of items) {
                  testFns.push(async (suite: MockSuite) => {
                    const task: MockTask = { meta: {} };
                    suite.tasks.push(task);
                    try {
                      await fn(item, { task });
                    } catch {
                      // Expected for intentionally failed cases.
                    }
                  });
                }
              },
          },
        },
      );

      return {
        beforeAll: (fn: typeof beforeAllHook) => {
          beforeAllHook = fn;
        },
        afterAll: (fn: typeof afterAllHook) => {
          afterAllHook = fn;
        },
        it: itMock,
        inject: (key: string) => {
          const provided = {
            baseline: undefined,
            debug: true,
            list: false,
            overrides: {},
            axiomConfig: createConfig(),
            runId: 'run-123',
            consoleUrl: undefined,
          } as Record<string, unknown>;
          return provided[key];
        },
        describe: async (name: string, fn: () => Promise<void>) => {
          const suite: MockSuite = {
            name,
            file: 'mock.eval.ts',
            meta: {},
            tasks: [],
          };
          state.suite = suite;

          try {
            await fn();
            if (beforeAllHook) {
              await beforeAllHook(suite);
            }

            for (const testFn of testFns) {
              await testFn(suite);
            }

            if (afterAllHook) {
              await afterAllHook(suite);
            }
            resolveDone?.();
          } catch (error) {
            rejectDone?.(error);
          }
        },
      };
    });

    const { Eval } = await import('../../src/evals/eval');

    Eval('stale-metadata-regression', {
      capability: 'my-capability',
      configFlags: ['feature.a'],
      trials: 1,
      data: [
        { input: 'case-1', expected: 'ok' },
        { input: 'case-2', expected: 'throws' },
      ],
      task: async ({ input }) => {
        const scope = createAppScope({
          flagSchema: z.object({
            feature: z.object({
              a: z.boolean().default(false),
              b: z.boolean().default(false),
            }),
          }),
        });

        if (input === 'case-1') {
          scope.overrideFlags({ 'feature.a': true });
          scope.flag('feature.a');
          return 'ok';
        }

        scope.overrideFlags({ 'feature.b': true });
        scope.flag('feature.b');
        throw new Error('forced failure');
      },
      scorers: [async () => ({ score: 1 })],
    });

    await done;

    const case1 = state.suite?.tasks[0].meta.case;
    const case2 = state.suite?.tasks[1].meta.case;

    expect(case1.status).toBe('success');
    expect(case1.runtimeFlags).toHaveProperty('feature.a');

    expect(case2.status).toBe('fail');
    expect(case2.runtimeFlags).toHaveProperty('feature.b');
    expect(case2.runtimeFlags).not.toHaveProperty('feature.a');
    expect(case2.outOfScopeFlags?.some((f: { flagPath: string }) => f.flagPath === 'feature.b')).toBe(
      true,
    );
  });
});
