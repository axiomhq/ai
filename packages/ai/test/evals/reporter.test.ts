import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AxiomReporter } from '../../src/evals/reporter';
import { calculateScorerAverages } from '../../src/evals/reporter.console-utils';
import type { TestSuite, TestCase } from 'vitest/node.js';
import type { EvaluationReport, EvalCaseReport } from '../../src/evals/eval.types';
import { ConsoleCapture, createMockBaseline } from '../helpers/eval-test-setup';
import type { ResolvedAxiomConfig } from '../../src/config/index';

describe('AxiomReporter', () => {
  let reporter: AxiomReporter;
  let consoleCapture: ConsoleCapture;
  let mockConfig: ResolvedAxiomConfig;

  beforeEach(async () => {
    reporter = new AxiomReporter();
    consoleCapture = new ConsoleCapture();
    consoleCapture.start();

    mockConfig = {
      eval: {
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset',
        instrumentation: null,
        include: [],
        exclude: [],
        timeoutMs: 60_000,
      },
    } as ResolvedAxiomConfig;

    // Mock context storage
    const storage = await import('../../src/evals/context/storage');
    vi.spyOn(storage, 'getAxiomConfig').mockReturnValue(mockConfig);
    vi.spyOn(storage, 'getConfigScope').mockReturnValue({
      getAllDefaultFlags: () => ({}),
    } as any);

    // Mock global flags
    const flags = await import('../../src/evals/context/global-flags');
    vi.spyOn(flags, 'getGlobalFlagOverrides').mockReturnValue({});
  });

  afterEach(() => {
    consoleCapture.stop();
    vi.restoreAllMocks();
  });

  describe('onTestRunStart', () => {
    it('initializes timing', () => {
      reporter.onTestRunStart();

      expect(reporter.start).toBeGreaterThan(0);
      expect(reporter.startTime).toBeGreaterThan(0);
    });
  });

  describe('onTestSuiteReady', () => {
    it('loads baseline when specified', async () => {
      const mockBaseline = createMockBaseline('test-eval', 'baseline-123', 2);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBaseline,
      });

      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-456',
            name: 'test-eval',
            version: 'v2',
            baseline: { id: 'baseline-123', name: 'test-eval', version: 'v1' },
            registrationStatus: { status: 'success' },
          } as EvaluationReport,
        },
      });

      await reporter.onTestSuiteReady(mockSuite);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('_apl'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('skips baseline loading for skipped suites', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const mockSuite = createMockTestSuite({
        state: 'skipped',
      });

      await reporter.onTestSuiteReady(mockSuite);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('captures end-of-run config snapshot', async () => {
      const configEnd = {
        flags: { model: { temperature: 0.7 } },
        pickedFlags: ['model'],
        overrides: { 'model.temperature': 0.8 },
      };

      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            baseline: undefined,
            id: 'eval-789',
            name: 'config-test',
            version: 'v1',
            registrationStatus: { status: 'success' },
            configEnd,
          } as EvaluationReport,
        },
      });

      await reporter.onTestSuiteReady(mockSuite);

      expect((reporter as any)._endOfRunConfigEnd).toEqual(configEnd);
    });

    it('prints flag overrides when present', async () => {
      const configEnd = {
        flags: { model: { temperature: 0.7 } },
        pickedFlags: ['model'],
        overrides: { 'model.temperature': 0.8 },
      };

      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            baseline: undefined,
            id: 'eval-override',
            name: 'override-test',
            version: 'v1',
            registrationStatus: { status: 'success' },
            configEnd,
          } as EvaluationReport,
        },
      });

      await reporter.onTestSuiteReady(mockSuite);

      const output = consoleCapture.getOutput();
      expect(output).toContain('Flag overrides');
    });
  });

  describe('onTestSuiteResult', () => {
    it('prints suite information and case results', async () => {
      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-123',
            name: 'Print Test',
            version: 'v1',
            registrationStatus: { status: 'success' },
          } as EvaluationReport,
        },
        children: [
          createMockTestCase({
            meta: {
              case: {
                index: 0,
                name: 'Print Test',
                input: 'test input',
                output: 'test output',
                expected: 'test output',
                scores: {
                  accuracy: { name: 'accuracy', score: 1.0, metadata: {} },
                },
                status: 'success',
                errors: [],
                duration: 100,
                startedAt: Date.now(),
              } as EvalCaseReport,
            },
            ok: true,
          }),
        ],
      });

      reporter.start = performance.now() - 1000; // 1 second ago
      reporter.startTime = Date.now() - 1000;

      await reporter.onTestSuiteResult(mockSuite);

      const output = consoleCapture.getOutput();

      expect(output).toContain('Print Test');
      expect(output).toContain('case 0');
      expect(output).toContain('accuracy');
      expect(output).toContain('100.00%');
    });

    it('displays baseline comparison when available', async () => {
      const mockBaseline = createMockBaseline('Baseline Test', 'baseline-123', 1);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBaseline,
      });

      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-999',
            name: 'Baseline Test',
            version: 'v2',
            baseline: { id: 'baseline-123', name: 'Baseline Test', version: 'v1' },
            registrationStatus: { status: 'success' },
          } as EvaluationReport,
        },
        children: [
          createMockTestCase({
            meta: {
              case: {
                index: 0,
                name: 'Baseline Test',
                input: 'test',
                output: 'test',
                expected: 'test',
                scores: {
                  accuracy: { name: 'accuracy', score: 0.95, metadata: {} },
                },
                status: 'success',
                errors: [],
                duration: 100,
                startedAt: Date.now(),
              } as EvalCaseReport,
            },
            ok: true,
          }),
        ],
      });

      // Load baseline first
      await reporter.onTestSuiteReady(mockSuite);

      reporter.start = performance.now() - 1000;
      reporter.startTime = Date.now() - 1000;

      await reporter.onTestSuiteResult(mockSuite);

      const output = consoleCapture.getOutput();

      expect(output).toContain('baseline');
      expect(output).toContain('Baseline Test');
      // Check that both scores are displayed (current and comparison)
      expect(output).toContain('accuracy');
    });

    it('shows runtime flags when present', async () => {
      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-flags',
            name: 'Flag Test',
            version: 'v1',
            registrationStatus: { status: 'success' },
          } as EvaluationReport,
        },
        children: [
          createMockTestCase({
            meta: {
              case: {
                index: 0,
                name: 'Flag Test',
                input: 'test',
                output: 'test',
                expected: 'test',
                scores: {},
                status: 'success',
                errors: [],
                duration: 100,
                startedAt: Date.now(),
                runtimeFlags: {
                  'model.temperature': {
                    kind: 'replaced',
                    value: 0.9,
                    default: 0.7,
                  },
                },
              } as EvalCaseReport,
            },
            ok: true,
          }),
        ],
      });

      reporter.start = performance.now();
      reporter.startTime = Date.now();

      await reporter.onTestSuiteResult(mockSuite);

      const output = consoleCapture.getOutput();

      expect(output).toContain('runtime flags');
      expect(output).toContain('model.temperature');
      expect(output).toContain('0.9');
      expect(output).toContain('default: 0.7');
    });

    it('shows out-of-scope flags warnings', async () => {
      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-oos',
            name: 'OOS Test',
            version: 'v1',
            registrationStatus: { status: 'success' },
          } as EvaluationReport,
        },
        children: [
          createMockTestCase({
            meta: {
              case: {
                index: 0,
                name: 'OOS Test',
                input: 'test',
                output: 'test',
                expected: 'test',
                scores: {},
                status: 'success',
                errors: [],
                duration: 100,
                startedAt: Date.now(),
                outOfScopeFlags: [
                  {
                    flagPath: 'unauthorized.flag',
                    accessedAt: Date.now(),
                    stackTrace: ['at task (eval.ts:100)', 'at runTask (eval.ts:50)'],
                  },
                ],
                pickedFlags: ['model'],
              } as EvalCaseReport,
            },
            ok: true,
          }),
        ],
      });

      reporter.start = performance.now();
      reporter.startTime = Date.now();

      await reporter.onTestSuiteResult(mockSuite);

      const output = consoleCapture.getOutput();

      expect(output).toContain('Out-of-scope flags');
      expect(output).toContain('unauthorized.flag');
      expect(output).toContain("picked: 'model'");
    });
  });

  describe('onTestRunEnd', () => {
    it('prints final report with aggregated scores', async () => {
      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-final',
            name: 'Final Test',
            version: 'v1',
            registrationStatus: { status: 'success' },
          } as EvaluationReport,
        },
        children: [
          createMockTestCase({
            meta: {
              case: {
                index: 0,
                name: 'Final Test',
                input: 'test1',
                output: 'test1',
                expected: 'test1',
                scores: {
                  accuracy: { name: 'accuracy', score: 0.9, metadata: {} },
                  quality: { name: 'quality', score: 0.85, metadata: {} },
                },
                status: 'success',
                errors: [],
                duration: 100,
                startedAt: Date.now(),
              } as EvalCaseReport,
            },
            ok: true,
          }),
          createMockTestCase({
            meta: {
              case: {
                index: 1,
                name: 'Final Test',
                input: 'test2',
                output: 'test2',
                expected: 'test2',
                scores: {
                  accuracy: { name: 'accuracy', score: 0.95, metadata: {} },
                  quality: { name: 'quality', score: 0.9, metadata: {} },
                },
                status: 'success',
                errors: [],
                duration: 100,
                startedAt: Date.now(),
              } as EvalCaseReport,
            },
            ok: true,
          }),
        ],
      });

      reporter.start = performance.now();
      reporter.startTime = Date.now();

      await reporter.onTestSuiteResult(mockSuite);
      await reporter.onTestRunEnd([], [], 'passed');

      const output = consoleCapture.getOutput();

      expect(output).toContain('FINAL EVALUATION REPORT');
      expect(output).toContain('Final Test');
      expect(output).toContain('accuracy');
      expect(output).toContain('quality');
      // Average accuracy: (0.9 + 0.95) / 2 = 0.925 = 92.50%
      expect(output).toContain('92.50%');
      // Average quality: (0.85 + 0.9) / 2 = 0.875 = 87.50%
      expect(output).toContain('87.50%');
    });

    it('shows registration failure warning', async () => {
      const mockSuite = createMockTestSuite({
        meta: {
          evaluation: {
            id: 'eval-failed',
            name: 'Failed Test',
            version: 'v1',
            registrationStatus: {
              status: 'failed',
              error: 'Network error',
            },
          } as EvaluationReport,
        },
        children: [],
      });

      reporter.start = performance.now();
      reporter.startTime = Date.now();

      await reporter.onTestSuiteResult(mockSuite);
      await reporter.onTestRunEnd([], [], 'passed');

      const output = consoleCapture.getOutput();

      expect(output).toContain('Failed to register');
      expect(output).toContain('Network error');
      expect(output).toContain('Axiom UI');
    });
  });

  describe('calculateScorerAverages', () => {
    it('calculates correct averages across multiple cases', () => {
      const suiteData = {
        name: 'test',
        file: 'test.ts',
        duration: '1s',
        baseline: null,
        cases: [
          {
            index: 0,
            scores: {
              accuracy: { name: 'accuracy', score: 0.8, metadata: {} },
              quality: { name: 'quality', score: 0.7, metadata: {} },
            },
          },
          {
            index: 1,
            scores: {
              accuracy: { name: 'accuracy', score: 0.9, metadata: {} },
              quality: { name: 'quality', score: 0.8, metadata: {} },
            },
          },
          {
            index: 2,
            scores: {
              accuracy: { name: 'accuracy', score: 1.0, metadata: {} },
              quality: { name: 'quality', score: 0.9, metadata: {} },
            },
          },
        ],
      } as any;

      const averages = calculateScorerAverages(suiteData);

      expect(averages.accuracy).toBeCloseTo(0.9, 2);
      expect(averages.quality).toBeCloseTo(0.8, 2);
    });

    it('handles missing scorers in some cases', () => {
      const suiteData = {
        cases: [
          {
            index: 0,
            scores: {
              accuracy: { name: 'accuracy', score: 0.8, metadata: {} },
            },
          },
          {
            index: 1,
            scores: {
              accuracy: { name: 'accuracy', score: 0.9, metadata: {} },
              quality: { name: 'quality', score: 0.7, metadata: {} },
            },
          },
        ],
      } as any;

      const averages = calculateScorerAverages(suiteData);

      expect(averages.accuracy).toBeCloseTo(0.85, 2);
      expect(averages.quality).toBeCloseTo(0.7, 2);
    });
  });
});

// Test helpers
function createMockTestSuite(overrides: Partial<any> = {}): TestSuite {
  return {
    type: 'suite',
    name: 'test suite',
    state: () => overrides.state ?? 'pass',
    meta: () => overrides.meta ?? {},
    module: {
      moduleId: '/path/to/test.ts',
    },
    children: overrides.children ?? [],
    project: {
      name: 'test-project',
    },
  } as any;
}

function createMockTestCase(overrides: Partial<any> = {}): TestCase {
  return {
    type: 'test',
    name: 'test case',
    ok: () => overrides.ok ?? true,
    meta: () => overrides.meta ?? {},
  } as any;
}
