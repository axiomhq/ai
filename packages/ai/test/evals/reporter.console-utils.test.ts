import { describe, expect, it } from 'vitest';
import {
  formatPercentage,
  formatDiff,
  printTestCaseScores,
} from '../../src/evals/reporter.console-utils';
import type { MetaWithCase, Case } from '../../src/evals/eval.types';
import c from 'tinyrainbow';

describe('reporter.console-utils', () => {
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
