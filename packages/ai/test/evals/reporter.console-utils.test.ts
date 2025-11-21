import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  printSuiteBox,
  calculateScorerAverages,
  calculateBaselineScorerAverage,
  type SuiteData,
} from '../../src/eval-runner/reporter.console-utils';
import type { Evaluation, FlagDiff } from '../../src/evals/eval.types';

describe('printSuiteBox', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const createMockSuite = (overrides?: Partial<SuiteData>): SuiteData => ({
    name: 'Test Evaluation',
    file: '/path/to/test/evaluation.eval.ts',
    duration: '5.23s',
    baseline: null,
    runId: 'test-run-id',
    cases: [
      {
        index: 0,
        scores: {
          accuracy: {
            score: 0.85,
            metadata: { duration: 100, startedAt: 0, error: null },
          },
          relevance: {
            score: 0.92,
            metadata: { duration: 150, startedAt: 0, error: null },
          },
        },
      },
      {
        index: 1,
        scores: {
          accuracy: {
            score: 0.78,
            metadata: { duration: 120, startedAt: 0, error: null },
          },
          relevance: {
            score: 0.88,
            metadata: { duration: 140, startedAt: 0, error: null },
          },
        },
      },
    ],
    ...overrides,
  });

  const createMockBaseline = (overrides?: Partial<Evaluation>): Evaluation => ({
    id: 'baseline-123',
    name: 'Test Evaluation',
    version: 'v1',
    type: 'regression',
    baseline: { id: undefined, name: undefined },
    collection: { name: 'test-collection', size: 2 },
    prompt: { model: 'test-model', params: {} },
    duration: 5000,
    status: 'ok',
    traceId: 'trace-123',
    runAt: new Date('2025-10-01T12:00:00Z').toISOString(),
    tags: [],
    user: { name: 'Test User', email: 'test@example.com' },
    cases: [
      {
        index: 0,
        input: 'test input 0',
        output: 'test output 0',
        expected: 'test expected 0',
        duration: '2.50s',
        status: 'ok',
        scores: {
          accuracy: { name: 'accuracy', value: 0.8, metadata: {} },
          relevance: { name: 'relevance', value: 0.9, metadata: {} },
        },
        runAt: new Date('2025-10-01T12:00:00Z').toISOString(),
        spanId: 'span-0',
        traceId: 'trace-123',
      },
      {
        index: 1,
        input: 'test input 1',
        output: 'test output 1',
        expected: 'test expected 1',
        duration: '2.73s',
        status: 'ok',
        scores: {
          accuracy: { name: 'accuracy', value: 0.75, metadata: {} },
          relevance: { name: 'relevance', value: 0.85, metadata: {} },
        },
        runAt: new Date('2025-10-01T12:00:00Z').toISOString(),
        spanId: 'span-1',
        traceId: 'trace-123',
      },
    ],
    ...overrides,
  });

  describe('successful run with no baseline', () => {
    it('should print suite name and file', () => {
      const suite = createMockSuite();
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test Evaluation'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('evaluation.eval.ts'));
    });

    it('should print scorer averages without baseline comparison', () => {
      const suite = createMockSuite();
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      // Should show scores but no diff (no → or baseline values)
      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const accuracyLine = calls.find((line) => line.includes('accuracy'));
      const relevanceLine = calls.find((line) => line.includes('relevance'));

      expect(accuracyLine).toBeTruthy();
      expect(relevanceLine).toBeTruthy();
      expect(accuracyLine).toContain('81.50%'); // (0.85 + 0.78) / 2 = 0.815
      expect(relevanceLine).toContain('90.00%'); // (0.92 + 0.88) / 2 = 0.90
    });

    it('should indicate no baseline', () => {
      const suite = createMockSuite();
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const baselineLine = calls.find((line) => line.includes('Baseline:'));

      expect(baselineLine).toBeTruthy();
      expect(baselineLine).toContain('(none)');
    });
  });

  describe('successful run with baseline', () => {
    it('should print scorer averages with baseline comparison', () => {
      const baseline = createMockBaseline();
      const suite = createMockSuite({ baseline });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const accuracyLine = calls.find((line) => line.includes('accuracy'));
      const relevanceLine = calls.find((line) => line.includes('relevance'));

      // Should show baseline → current with diff
      expect(accuracyLine).toContain('→'); // Arrow indicates comparison
      expect(relevanceLine).toContain('→');
    });

    it('should calculate and display score diffs correctly', () => {
      const baseline = createMockBaseline();
      const suite = createMockSuite({ baseline });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const accuracyLine = calls.find((line) => line.includes('accuracy'));

      // Baseline accuracy: (0.80 + 0.75) / 2 = 0.775 = 77.50%
      // Current accuracy: (0.85 + 0.78) / 2 = 0.815 = 81.50%
      // Diff: +4.00%
      expect(accuracyLine).toContain('77.50%');
      expect(accuracyLine).toContain('81.50%');
      expect(accuracyLine).toContain('+4.00%');
    });

    it('should display baseline name and timestamp', () => {
      const baseline = createMockBaseline();
      const suite = createMockSuite({ baseline });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const baselineLine = calls.find((line) => line.includes('Baseline:'));

      expect(baselineLine).toContain('Test Evaluation-v1');
      expect(baselineLine).toContain('2025-10-01');
    });
  });

  describe('run where all cases failed for a scorer', () => {
    it('should display N/A when all cases failed for a scorer', () => {
      const suite = createMockSuite({
        cases: [
          {
            index: 0,
            scores: {
              accuracy: {
                score: 0,
                metadata: { duration: 100, startedAt: 0, error: 'Task execution failed' },
              },
              relevance: {
                score: 0.92,
                metadata: { duration: 150, startedAt: 0, error: null },
              },
            },
          },
          {
            index: 1,
            scores: {
              accuracy: {
                score: 0,
                metadata: { duration: 120, startedAt: 0, error: 'Task execution failed' },
              },
              relevance: {
                score: 0.88,
                metadata: { duration: 140, startedAt: 0, error: null },
              },
            },
          },
        ],
      });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const accuracyLine = calls.find((line) => line.includes('accuracy'));

      expect(accuracyLine).toContain('N/A');
      expect(accuracyLine).toContain('(all cases failed)');
    });

    it('should display N/A with baseline when all cases failed', () => {
      const baseline = createMockBaseline();
      const suite = createMockSuite({
        baseline,
        cases: [
          {
            index: 0,
            scores: {
              accuracy: {
                score: 0,
                metadata: { duration: 100, startedAt: 0, error: 'Task execution failed' },
              },
            },
          },
          {
            index: 1,
            scores: {
              accuracy: {
                score: 0,
                metadata: { duration: 120, startedAt: 0, error: 'Task execution failed' },
              },
            },
          },
        ],
      });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const accuracyLine = calls.find((line) => line.includes('accuracy'));

      expect(accuracyLine).toContain('N/A');
      expect(accuracyLine).toContain('(all cases failed)');
      expect(accuracyLine).toContain('→'); // Still shows comparison
    });
  });

  describe('run with flag differences', () => {
    it('should display flag diffs when baseline exists', () => {
      const baseline = createMockBaseline();
      const suite = createMockSuite({ baseline });
      const scorerAverages = calculateScorerAverages(suite);
      const flagDiff: FlagDiff[] = [
        { flag: 'model.temperature', current: '0.7', baseline: '0.5' },
        { flag: 'model.maxTokens', current: '2000', baseline: '1000' },
      ];

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff,
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const configChangesLine = calls.find((line) => line.includes('Config changes:'));
      const temperatureLine = calls.find((line) => line.includes('model.temperature'));
      const maxTokensLine = calls.find((line) => line.includes('model.maxTokens'));

      expect(configChangesLine).toBeTruthy();
      expect(temperatureLine).toContain('0.7');
      expect(temperatureLine).toContain('0.5');
      expect(maxTokensLine).toContain('2000');
      expect(maxTokensLine).toContain('1000');
    });

    it('should indicate no config changes when flagDiff is empty', () => {
      const baseline = createMockBaseline();
      const suite = createMockSuite({ baseline });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const configChangesLine = calls.find((line) => line.includes('Config changes:'));

      expect(configChangesLine).toContain('(none)');
    });
  });

  describe('out-of-scope flags', () => {
    it('should display out-of-scope flags warning when present', () => {
      const suite = createMockSuite({
        configFlags: ['model'],
        outOfScopeFlags: [
          {
            flagPath: 'database.connectionString',
            count: 1,
            firstAccessedAt: Date.now(),
            lastAccessedAt: Date.now(),
            stackTrace: ['at evaluateTask (task.ts:45)', 'at runEvaluation (eval.ts:123)'],
          },
        ],
      });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const outOfScopeLine = calls.find((line) => line.includes('Out-of-scope flags'));
      const flagLine = calls.find((line) => line.includes('database.connectionString'));

      expect(outOfScopeLine).toBeTruthy();
      expect(outOfScopeLine).toContain("picked: 'model'");
      expect(flagLine).toBeTruthy();
    });

    it('should not display out-of-scope warning when no flags are out of scope', () => {
      const suite = createMockSuite({
        configFlags: ['model'],
        outOfScopeFlags: [],
      });
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const outOfScopeLine = calls.find((line) => line.includes('Out-of-scope flags'));

      expect(outOfScopeLine).toBeUndefined();
    });
  });

  describe('box structure', () => {
    it('should print box borders correctly', () => {
      const suite = createMockSuite();
      const scorerAverages = calculateScorerAverages(suite);

      printSuiteBox({
        suite,
        scorerAverages,
        calculateBaselineScorerAverage,
        flagDiff: [],
      });

      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);

      expect(calls[0]).toBe('┌─');
      expect(calls[calls.length - 1]).toBe('└─');
      expect(calls.filter((call) => call === '├─').length).toBeGreaterThan(0);
    });
  });
});
