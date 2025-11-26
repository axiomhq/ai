import { describe, expect, it } from 'vitest';
import {
  formatPercentage,
  formatDiff,
  printTestCaseScores,
  truncate,
  stringify,
  getCaseFingerprint,
  reporterDate,
  calculateScorerAverages,
  calculateBaselineScorerAverage,
  calculateFlagDiff,
  printOrphanedBaselineCases,
  printConfigEnd,
  printCaseResult,
  printRuntimeFlags,
  printOutOfScopeFlags,
  printTestCaseSuccessOrFailed,
  type SuiteData,
} from '../../src/evals/reporter.console-utils';
import type { MetaWithCase, Case, Evaluation } from '../../src/evals/eval.types';
import type { TestCase } from 'vitest/node';
import c from 'tinyrainbow';

describe('reporter.console-utils', () => {
  // Helper to capture logs
  const createMockLogger = () => {
    const lines: string[] = [];
    const logger = (msg?: any, ...args: any[]) => {
      lines.push([msg, ...args].filter(Boolean).join(' '));
    };
    const getOutput = () => lines.join('\n');
    const getLines = () => lines;
    const clear = () => {
      lines.length = 0;
    };
    return { logger, getOutput, getLines, clear };
  };

  // Helper to strip ansi codes
  const stripAnsi = (str: string) => str.replace(/\u001b\[\d+m/g, '');

  describe('formatPercentage', () => {
    it('formats number as percentage with 2 decimals', () => {
      expect(formatPercentage(0.123456)).toBe('12.35%');
      expect(formatPercentage(1)).toBe('100.00%');
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('handles non-finite numbers', () => {
      expect(formatPercentage(NaN)).toBe('N/A');
      expect(formatPercentage(Infinity)).toBe('N/A');
      expect(formatPercentage(-Infinity)).toBe('N/A');
    });
  });

  describe('formatDiff', () => {
    it('formats positive diff correctly', () => {
      const { text, color } = formatDiff(0.5, 0.4);
      expect(text).toBe('+10.00%');
      expect(color).toBe(c.green);
    });

    it('formats negative diff correctly', () => {
      const { text, color } = formatDiff(0.4, 0.5);
      expect(text).toBe('-10.00%');
      expect(color).toBe(c.red);
    });

    it('formats zero diff correctly', () => {
      const { text, color } = formatDiff(0.5, 0.5);
      expect(text).toBe('+0.00%');
      expect(color).toBe(c.dim);
    });

    it('handles non-finite numbers', () => {
      const testCases = [
        [NaN, 0.5],
        [0.5, NaN],
        [Infinity, 0.5],
        [0.5, Infinity],
        [-Infinity, 0.5],
        [0.5, -Infinity],
      ];

      for (const [current, baseline] of testCases) {
        const { text, color } = formatDiff(current, baseline);
        expect(text).toBe('N/A');
        expect(color).toBe(c.dim);
      }
    });
  });

  describe('truncate', () => {
    it('returns original string if length <= max', () => {
      expect(truncate('hello', 10)).toBe('hello');
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('truncates string with ellipsis if length > max', () => {
      expect(truncate('hello world', 5)).toBe('hello…');
    });
  });

  describe('stringify', () => {
    it('returns string as-is', () => {
      expect(stringify('hello')).toBe('hello');
    });

    it('stringifies objects', () => {
      expect(stringify({ a: 1 })).toBe('{"a":1}');
    });

    it('stringifies primitives', () => {
      expect(stringify(123)).toBe('123');
      expect(stringify(true)).toBe('true');
      expect(stringify(null)).toBe('null');
    });

    it('handles circular references gracefully', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      expect(stringify(obj)).toBe('[object Object]');
    });
  });

  describe('getCaseFingerprint', () => {
    it('stringifies inputs correctly', () => {
      const fp = getCaseFingerprint('input', 'expected');
      expect(fp).toBe(JSON.stringify({ input: 'input', expected: 'expected' }));
    });

    it('handles object inputs', () => {
      const fp = getCaseFingerprint({ a: 1 }, { b: 2 });
      expect(fp).toBe(
        JSON.stringify({ input: JSON.stringify({ a: 1 }), expected: JSON.stringify({ b: 2 }) }),
      );
    });
  });

  describe('reporterDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-01-01T12:30:00Z');
      expect(reporterDate(date)).toBe('2023-01-01, 12:30 UTC');
    });
  });

  describe('calculateScorerAverages', () => {
    it('calculates averages correctly', () => {
      const suite = {
        cases: [
          { scores: { accuracy: { score: 1 } } },
          { scores: { accuracy: { score: 0.5 } } },
          { scores: { accuracy: { score: 0 } } },
        ],
      } as unknown as SuiteData;

      const averages = calculateScorerAverages(suite);
      expect(averages.accuracy).toBeCloseTo(0.5);
    });

    it('ignores errored scores', () => {
      const suite = {
        cases: [
          { scores: { accuracy: { score: 1 } } },
          { scores: { accuracy: { score: 0, metadata: { error: 'fail' } } } },
        ],
      } as unknown as SuiteData;

      const averages = calculateScorerAverages(suite);
      expect(averages.accuracy).toBe(1);
    });

    it('returns 0 if no valid scores', () => {
      const suite = { cases: [] } as unknown as SuiteData;
      expect(calculateScorerAverages(suite)).toEqual({});
    });
  });

  describe('calculateBaselineScorerAverage', () => {
    it('calculates baseline average', () => {
      const baseline = {
        cases: [{ scores: { accuracy: { value: 1 } } }, { scores: { accuracy: { value: 0.5 } } }],
      } as unknown as Evaluation;

      expect(calculateBaselineScorerAverage(baseline, 'accuracy')).toBe(0.75);
    });

    it('returns null if scorer missing in baseline', () => {
      const baseline = { cases: [] } as unknown as Evaluation;
      expect(calculateBaselineScorerAverage(baseline, 'accuracy')).toBeNull();
    });
  });

  describe('calculateFlagDiff', () => {
    it('returns empty if no baseline or flags', () => {
      const suite = { baseline: null } as unknown as SuiteData;
      expect(calculateFlagDiff(suite)).toEqual([]);
    });

    it('detects changes in scoped flags', () => {
      const suite = {
        configFlags: ['feature'],
        flagConfig: { 'feature.enabled': true, 'other.flag': true },
        baseline: {
          flagConfig: { 'feature.enabled': false, 'other.flag': false },
        },
      } as unknown as SuiteData;

      const diff = calculateFlagDiff(suite);
      expect(diff).toHaveLength(1);
      expect(diff[0]).toEqual({
        flag: 'feature.enabled',
        current: 'true',
        baseline: 'false',
      });
    });

    it('ignores changes outside configFlags scope', () => {
      const suite = {
        configFlags: ['feature'],
        flagConfig: { 'other.flag': true },
        baseline: {
          flagConfig: { 'other.flag': false },
        },
      } as unknown as SuiteData;

      expect(calculateFlagDiff(suite)).toEqual([]);
    });
  });

  describe('printOrphanedBaselineCases', () => {
    it('prints nothing if no orphaned cases', () => {
      const { logger, getOutput } = createMockLogger();
      const baseline = { cases: [] } as unknown as Evaluation;
      printOrphanedBaselineCases(baseline, new Set(), logger);
      expect(getOutput()).toBe('');
    });

    it('prints orphaned cases', () => {
      const { logger, getOutput } = createMockLogger();
      const baseline = {
        cases: [
          {
            index: 1,
            input: 'test input',
            scores: { accuracy: { value: 0.8 } },
          },
        ],
      } as unknown as Evaluation;

      printOrphanedBaselineCases(baseline, new Set(), logger);
      const output = stripAnsi(getOutput());

      expect(output).toContain('Orphaned baseline cases:');
      expect(output).toContain('case 1: test input (score: {"accuracy":{"value":0.8}})');
      expect(output).toContain('accuracy   80.00%');
    });
  });

  describe('printConfigEnd', () => {
    it('prints config header and flags', () => {
      const { logger, getOutput } = createMockLogger();
      const configEnd = {
        flags: { 'flag.a': true },
        overrides: {},
      };

      printConfigEnd(configEnd, logger);
      const output = stripAnsi(getOutput());

      expect(output).toContain('Config');
      expect(output).toContain('flag.a: true');
    });
  });

  describe('printRuntimeFlags', () => {
    it('prints runtime flags', () => {
      const { logger, getOutput } = createMockLogger();
      const testMeta = {
        case: {
          runtimeFlags: {
            'flag.a': { kind: 'replaced', value: true, default: false },
            'flag.b': { kind: 'introduced', value: 'val' },
          },
        },
      } as unknown as MetaWithCase;

      printRuntimeFlags(testMeta, logger);
      const output = stripAnsi(getOutput());

      expect(output).toContain('runtime flags');
      expect(output).toContain('flag.a: true (default: false)');
      expect(output).toContain('flag.b: val (no default)');
    });
  });

  describe('printOutOfScopeFlags', () => {
    it('prints out of scope flags', () => {
      const { logger, getOutput } = createMockLogger();
      const testMeta = {
        case: {
          pickedFlags: ['scope.a'],
          outOfScopeFlags: [
            {
              flagPath: 'other.flag',
              accessedAt: new Date().toISOString(),
              stackTrace: ['at function (file.ts:1:1)'],
            },
          ],
        },
      } as unknown as MetaWithCase;

      printOutOfScopeFlags(testMeta, logger);
      const output = stripAnsi(getOutput());

      expect(output).toContain("Out-of-scope flags: (picked: 'scope.a')");
      expect(output).toContain('other.flag');
      expect(output).toContain('at function (file.ts:1:1)');
    });
  });

  describe('printTestCaseSuccessOrFailed', () => {
    it('prints success', () => {
      const { logger, getOutput } = createMockLogger();
      const testMeta = { case: { index: 1 } } as unknown as MetaWithCase;

      printTestCaseSuccessOrFailed(testMeta, true, logger);
      const output = stripAnsi(getOutput());
      expect(output).toContain('case 1:');
      expect(output).toContain('✔');
    });

    it('prints failure with errors', () => {
      const { logger, getOutput } = createMockLogger();
      const testMeta = {
        case: {
          index: 1,
          errors: [{ message: 'Some error' }],
        },
      } as unknown as MetaWithCase;

      printTestCaseSuccessOrFailed(testMeta, false, logger);
      const output = stripAnsi(getOutput());
      expect(output).toContain('case 1: failed');
      expect(output).toContain('Some error');
      expect(output).toContain('✖');
    });
  });

  describe('printCaseResult', () => {
    it('orchestrates printing of a case result', () => {
      const { logger, getOutput } = createMockLogger();

      const testMeta = {
        case: {
          index: 1,
          input: 'in',
          expected: 'out',
          scores: { accuracy: { score: 1 } },
          runtimeFlags: {},
          outOfScopeFlags: [],
        },
      } as unknown as MetaWithCase;

      const test = {
        ok: () => true,
        meta: () => testMeta,
      } as unknown as TestCase;

      const baselineCases = new Map();
      const matchedIndices = new Set<number>();

      printCaseResult(test, baselineCases, matchedIndices, logger);

      const output = stripAnsi(getOutput());
      expect(output).toContain('case 1');
      expect(output).toContain('accuracy  100.00%');
    });

    it('matches and marks baseline case', () => {
      const { logger } = createMockLogger();

      const input = 'in';
      const expected = 'out';
      const fingerprint = getCaseFingerprint(input, expected);

      const baselineCase = {
        index: 10,
        scores: { accuracy: { value: 0.5 } },
      } as unknown as Case;

      const baselineCases = new Map([[fingerprint, [baselineCase]]]);
      const matchedIndices = new Set<number>();

      const testMeta = {
        case: {
          index: 1,
          input,
          expected,
          scores: { accuracy: { score: 0.5 } },
        },
      } as unknown as MetaWithCase;

      const test = {
        ok: () => true,
        meta: () => testMeta,
      } as unknown as TestCase;

      printCaseResult(test, baselineCases, matchedIndices, logger);

      expect(matchedIndices.has(10)).toBe(true);
    });
  });

  describe('printTestCaseScores', () => {
    it('prints aligned scores correctly', () => {
      const lines: string[] = [];
      const logger = (msg?: any, ...args: any[]) => {
        lines.push([msg, ...args].join(' '));
      };

      const testMeta = {
        case: {
          scores: {
            short: { score: 0.5, metadata: {} },
            'very-long-name': { score: 0.75, metadata: {} },
          },
        },
      } as unknown as MetaWithCase;

      printTestCaseScores(testMeta, null, logger);

      expect(lines.length).toBe(2);

      // Strip ansi codes for easier assertion
      const stripAnsi = (str: string) => str.replace(/\u001b\[\d+m/g, '');

      const line1 = stripAnsi(lines[0]);
      const line2 = stripAnsi(lines[1]);

      // Check padding
      // "short" should be padded to length of "very-long-name" (14 chars)
      // 4 spaces indent + 14 chars name + 2 spaces + 7 chars score = 27 chars approx

      expect(line1).toContain('short         '); // 14 chars
      expect(line1).toContain(' 50.00%');

      expect(line2).toContain('very-long-name');
      expect(line2).toContain(' 75.00%');
    });

    it('prints aligned scores with baseline comparison', () => {
      const lines: string[] = [];
      const logger = (msg?: any, ...args: any[]) => {
        lines.push([msg, ...args].join(' '));
      };

      const testMeta = {
        case: {
          scores: {
            accuracy: { score: 0.8, metadata: {} },
          },
        },
      } as unknown as MetaWithCase;

      const baselineCase = {
        scores: {
          accuracy: { value: 0.6, metadata: {} },
        },
      } as unknown as Case;

      printTestCaseScores(testMeta, baselineCase, logger);

      const stripAnsi = (str: string) => str.replace(/\u001b\[\d+m/g, '');
      const line = stripAnsi(lines[0]);

      expect(line).toContain('accuracy');
      // 60.00% -> 80.00% (+20.00%)
      expect(line).toContain('60.00%');
      expect(line).toContain('→');
      expect(line).toContain('80.00%');
      // Padded with space because +20.00% is 7 chars and we pad to 8
      expect(line).toContain('( +20.00%)');
    });

    it('handles error scores', () => {
      const lines: string[] = [];
      const logger = (msg?: any, ...args: any[]) => {
        lines.push([msg, ...args].join(' '));
      };

      const testMeta = {
        case: {
          scores: {
            accuracy: { score: 0, metadata: { error: 'Some error' } },
          },
        },
      } as unknown as MetaWithCase;

      printTestCaseScores(testMeta, null, logger);

      const stripAnsi = (str: string) => str.replace(/\u001b\[\d+m/g, '');
      const line = stripAnsi(lines[0]);

      expect(line).toContain('accuracy');
      expect(line).toContain('N/A');
      expect(line).toContain('(scorer not run)');
    });
  });
});
