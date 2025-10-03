import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import c from 'tinyrainbow';

import { getGlobalFlagOverrides } from './context/global-flags';
import { getConfigScope } from './context/storage';
import { findEvaluationCases } from './eval.service';
import type {
  Evaluation,
  EvaluationReport,
  MetaWithCase,
  MetaWithEval,
  RuntimeFlagMap,
} from './eval.types';
import type { Score } from './scorers';
import {
  maybePrintFlags,
  printBaselineNameAndVersion,
  printConfigHeader,
  printEvalNameAndFileName,
  printOutOfScopeFlags,
  printRuntimeFlags,
  printTestCaseCountStartDuration,
  printTestCaseScores,
  printTestCaseSuccessOrFailed,
} from './reporter.console-utils';
import { flattenObject } from 'src/util/dot-path';

/**
 * Data structure for collected suite information
 */
type SuiteData = {
  name: string;
  file: string;
  duration: string;
  // TODO: BEFORE MERGE - pick undefined or null
  baseline: Evaluation | undefined | null;
  configFlags?: string[];
  flagConfig?: Record<string, any>;
  cases: Array<{
    index: number;
    scores: Record<string, Score>;
    outOfScopeFlags?: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
    errors?: Error[] | null;
    runtimeFlags?: RuntimeFlagMap;
  }>;
  outOfScopeFlags?: {
    flagPath: string;
    count: number;
    firstAccessedAt: number;
    lastAccessedAt: number;
  }[];
};

/**
 * Custom Vitest reporter for Axiom AI evaluations.
 *
 * This reporter collects evaluation results and scores from tests
 * and processes them for further analysis and reporting.
 *
 */
export class AxiomReporter implements Reporter {
  startTime: number = 0;
  start: number = 0;
  private _endOfRunConfigEnd: EvaluationReport['configEnd'] | undefined;
  private _suiteData: SuiteData[] = [];
  private _baselines: Map<string, Evaluation | null> = new Map();

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();

    // Print global flag overrides at start
    this.printGlobalFlagOverrides();
  }

  async onTestSuiteReady(_testSuite: TestSuite) {
    const meta = _testSuite.meta() as MetaWithEval;
    if (_testSuite.state() === 'skipped') {
      return;
    }
    const baseline = meta.evaluation.baseline;
    if (baseline) {
      // load baseline data per suite
      const baselineData = await findEvaluationCases(baseline.id);
      this._baselines.set(meta.evaluation.name, baselineData || null);
    } else {
      this._baselines.set(meta.evaluation.name, null);
    }

    printEvalNameAndFileName(_testSuite, meta);

    printBaselineNameAndVersion(meta);

    // capture end-of-run config snapshot (first non-empty wins)
    if (meta.evaluation.configEnd && !this._endOfRunConfigEnd) {
      this._endOfRunConfigEnd = meta.evaluation.configEnd;
    }
  }

  onTestCaseReady(test: TestCase) {
    const meta = test.meta() as MetaWithCase;

    // TODO: there seem to be some cases where `meta` is undefined
    // maybe we get here to early?
    if (!meta.case) return;

    console.log(c.blue(` \u2713 evaluating case ${meta.case.index}`));
  }

  onTestSuiteResult(testSuite: TestSuite) {
    const meta = testSuite.meta() as MetaWithEval;
    // test suite won't have any meta because its skipped
    if (testSuite.state() === 'skipped') {
      return;
    }

    // calculate test duration in seconds
    const duration = Number((performance.now() - this.start) / 1000).toFixed(2);

    // Collect cases data
    const cases: SuiteData['cases'] = [];
    for (const test of testSuite.children) {
      if (test.type !== 'test') continue;

      const testMeta = test.meta() as MetaWithCase;
      if (!testMeta?.case) continue;

      cases.push({
        index: testMeta.case.index,
        scores: testMeta.case.scores,
        outOfScopeFlags: testMeta.case.outOfScopeFlags,
        errors: testMeta.case.errors,
        runtimeFlags: testMeta.case.runtimeFlags,
      });
    }

    // Get relative file path
    const cwd = process.cwd();
    const relativePath = testSuite.module.moduleId.replace(cwd, '').replace(/^\//, '');

    // Collect suite data for final report
    const suiteBaseline = this._baselines.get(meta.evaluation.name);
    this._suiteData.push({
      name: meta.evaluation.name,
      file: relativePath,
      duration: duration + 's',
      baseline: suiteBaseline || null,
      configFlags: meta.evaluation.configFlags,
      flagConfig: meta.evaluation.flagConfig,
      cases,
      outOfScopeFlags: meta.evaluation.outOfScopeFlags,
    });

    // Still print progress during execution (will be cleared later)
    printTestCaseCountStartDuration(testSuite, this.startTime, duration);

    for (const test of testSuite.children) {
      if (test.type !== 'test') return;
      this.printCaseResult(test);
    }

    console.log('');

    // TODO: BEFORE MERGE - decide if we need it or not
    // Skip printResultLink during progress - it will be shown in final report
    // const DEBUG = process.env.AXIOM_DEBUG === 'true';
    // const AXIOM_URL = (process.env.AXIOM_URL ?? 'https://api.axiom.co').replace('api', 'app');
    // if (!DEBUG && cases.length > 0) {
    //   // Need a MetaWithCase for printResultLink - iterate to find first test
    //   for (const test of testSuite.children) {
    //     if (test.type === 'test') {
    //       const testMeta = test.meta() as MetaWithCase;
    //       if (testMeta?.case) {
    //         printResultLink(testMeta, AXIOM_URL);
    //         break;
    //       }
    //     }
    //   }
    // }
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {
    // Clear screen before final report (but not in CI environments)
    const shouldClear =
      !process.env.CI && !process.env.AXIOM_NO_CLEAR && process.stdout.isTTY !== false; // Allow clearing even if isTTY is undefined

    if (shouldClear) {
      process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to top
    }

    // Print final report
    this.printFinalReport();

    // Print end-of-run config once (only in debug mode for now)
    const DEBUG = process.env.AXIOM_DEBUG === 'true';
    if (DEBUG && this._endOfRunConfigEnd) {
      this.printConfigEnd(this._endOfRunConfigEnd);
    }
  }

  private printCaseResult(test: TestCase) {
    const ok = test.ok();
    const testMeta = test.meta() as MetaWithCase;

    if (!testMeta?.case) {
      return;
    }

    printTestCaseSuccessOrFailed(testMeta, ok);

    // TODO: BEFORE MERGE - correct?
    printTestCaseScores(testMeta, null); // Baseline comparison shown in final report

    printRuntimeFlags(testMeta);

    printOutOfScopeFlags(testMeta);
  }

  /**
   * Print the final consolidated report
   */
  private printFinalReport() {
    console.log('');
    console.log(c.bgBlue(c.white(' FINAL EVALUATION REPORT ')));
    console.log('');

    // Print each suite in box format
    for (const suite of this._suiteData) {
      this.printSuiteBox(suite);
      console.log('');
    }

    console.log('');
    console.log('View full report:');
    console.log('https://app.axiom.co/evaluations/run/<run-id>');
  }

  /**
   * Print a single suite in box format
   */
  private printSuiteBox(suite: SuiteData) {
    console.log('┌─');
    console.log(`│  ${c.blue(suite.name)}`);
    console.log('├─');

    // Metadata with aligned labels
    console.log(`│  File:      ${suite.file}`);
    console.log(`│  Duration:  ${suite.duration}`);

    // Baseline info
    if (suite.baseline) {
      const baselineTimestamp = suite.baseline.runAt
        ? new Date(suite.baseline.runAt)
            .toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'UTC',
              timeZoneName: 'short',
            })
            .replace(', ', ' ')
        : 'unknown time';
      console.log(
        `│  Baseline:  ${suite.baseline.name}-${suite.baseline.version} (${baselineTimestamp})`,
      );
    } else {
      console.log(`│  Baseline:  (none)`);
    }

    // Flag diff section
    if (suite.baseline) {
      const flagDiff = this.calculateFlagDiff(suite);
      if (flagDiff.length > 0) {
        console.log('│');
        console.log('│  Flag diff:');
        for (const { flag, current, baseline } of flagDiff) {
          console.log(`│   • ${flag}: ${current} (baseline: ${baseline})`);
        }
      }
    }

    // Out-of-scope flags section
    if (suite.outOfScopeFlags && suite.outOfScopeFlags.length > 0) {
      const pickedFlagsText =
        suite.configFlags && suite.configFlags.length > 0
          ? suite.configFlags.map((f) => `'${f}'`).join(', ')
          : 'none';
      console.log('│');
      console.log(`│  Out-of-scope flags (picked: ${pickedFlagsText}):`);
      for (const flag of suite.outOfScopeFlags) {
        console.log(
          `│   • ${flag.flagPath} (accessed ${flag.count} time${flag.count > 1 ? 's' : ''})`,
        );
      }
    }

    console.log('│');
    console.log('│  Results:');

    // Calculate per-scorer averages
    const scorerAverages = this.calculateScorerAverages(suite);
    const scorerNames = Object.keys(scorerAverages);

    // Find max scorer name length for alignment
    const maxNameLength = Math.max(...scorerNames.map((name) => name.length));

    for (const scorerName of scorerNames) {
      const avg = scorerAverages[scorerName];
      const paddedName = scorerName.padEnd(maxNameLength);

      // Check if baseline has this scorer
      if (suite.baseline) {
        const baselineAvg = this.calculateBaselineScorerAverage(suite.baseline, scorerName);
        if (baselineAvg !== null) {
          const currentPercent = (avg * 100).toFixed(2) + '%';
          const baselinePercent = (baselineAvg * 100).toFixed(2) + '%';
          const diff = avg - baselineAvg;
          const diffText = (diff >= 0 ? '+' : '') + (diff * 100).toFixed(2) + '%';
          const diffColor = diff > 0 ? c.green : diff < 0 ? c.red : c.dim;

          console.log(
            `│   • ${paddedName}  ${c.blueBright(baselinePercent).padStart(7)} → ${c.magentaBright(currentPercent).padStart(7)}  (${diffColor(diffText)})`,
          );
        } else {
          const currentPercent = (avg * 100).toFixed(2) + '%';
          console.log(`│   • ${paddedName}  ${currentPercent}`);
        }
      } else {
        const currentPercent = (avg * 100).toFixed(2) + '%';
        console.log(`│   • ${paddedName}  ${currentPercent}`);
      }
    }

    console.log('└─');
  }

  /**
   * Calculate average scores per scorer for a suite
   */
  private calculateScorerAverages(suite: SuiteData): Record<string, number> {
    const scorerTotals: Record<string, { sum: number; count: number }> = {};

    for (const caseData of suite.cases) {
      for (const [scorerName, score] of Object.entries(caseData.scores)) {
        if (!scorerTotals[scorerName]) {
          scorerTotals[scorerName] = { sum: 0, count: 0 };
        }
        scorerTotals[scorerName].sum += score.score || 0;
        scorerTotals[scorerName].count += 1;
      }
    }

    const averages: Record<string, number> = {};
    for (const [scorerName, totals] of Object.entries(scorerTotals)) {
      averages[scorerName] = totals.count > 0 ? totals.sum / totals.count : 0;
    }

    return averages;
  }

  /**
   * Calculate average score for a specific scorer from baseline data
   */
  private calculateBaselineScorerAverage(baseline: Evaluation, scorerName: string): number | null {
    const scores: number[] = [];

    for (const caseData of baseline.cases) {
      if (caseData.scores[scorerName]) {
        scores.push(caseData.scores[scorerName].value);
      }
    }

    if (scores.length === 0) return null;

    const sum = scores.reduce((acc, val) => acc + val, 0);
    return sum / scores.length;
  }

  /**
   * Calculate flag diff between current run and baseline (filtered by configFlags)
   */
  private calculateFlagDiff(
    suite: SuiteData,
  ): Array<{ flag: string; current: string; baseline: string }> {
    if (!suite.baseline || !suite.configFlags || suite.configFlags.length === 0) {
      return [];
    }

    const diffs: Array<{ flag: string; current: string; baseline: string }> = [];

    const currentConfig = suite.flagConfig || {};
    const baselineConfig = suite.baseline.flagConfig || {};

    // Flatten both configs to dot notation for comparison
    const currentFlat = flattenObject(currentConfig);
    const baselineFlat = flattenObject(baselineConfig);

    // Get all keys from both configs
    const allKeys = new Set([...Object.keys(currentFlat), ...Object.keys(baselineFlat)]);

    for (const key of allKeys) {
      // Check if this flag is in scope
      const isInScope = suite.configFlags.some((pattern) => key.startsWith(pattern));
      if (!isInScope) continue;

      const currentValue = currentFlat[key];
      const baselineValue = baselineFlat[key];

      // Only show if values differ
      if (JSON.stringify(currentValue) !== JSON.stringify(baselineValue)) {
        diffs.push({
          flag: key,
          current: JSON.stringify(currentValue ?? '(not set)'),
          baseline: JSON.stringify(baselineValue ?? '(not set)'),
        });
      }
    }

    return diffs;
  }

  /**
   * End-of-suite config summary (console only)
   */
  private printConfigEnd(configEnd: EvaluationReport['configEnd']) {
    printConfigHeader();
    maybePrintFlags(configEnd);
  }

  /**
   * Print global flag overrides at the start of the run
   */
  private printGlobalFlagOverrides() {
    const overrides = getGlobalFlagOverrides();
    const defaults = getConfigScope()?.getAllDefaultFlags?.() ?? {};

    if (Object.keys(overrides).length === 0) {
      console.log('');
      console.log(c.dim('Flag overrides: (none)'));
      console.log('');
      return;
    }

    console.log('');
    console.log('Flag overrides:');
    for (const [key, value] of Object.entries(overrides)) {
      const defaultValue = defaults[key];
      const valueStr = JSON.stringify(value);
      const defaultStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : 'none';
      console.log(`  • ${key}: ${valueStr} ${c.dim(`(default: ${defaultStr})`)}`);
    }
    console.log('');
  }
}
