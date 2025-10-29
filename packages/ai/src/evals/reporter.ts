import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';

import { getAxiomConfig } from './context/storage';
import { findEvaluationCases } from './eval.service';
import type {
  Evaluation,
  EvaluationReport,
  FlagDiff,
  MetaWithCase,
  MetaWithEval,
} from './eval.types';
import {
  maybePrintFlags,
  printBaselineNameAndVersion,
  printConfigHeader,
  printEvalNameAndFileName,
  printFinalReport,
  printGlobalFlagOverrides,
  printOutOfScopeFlags,
  printRuntimeFlags,
  printTestCaseCountStartDuration,
  printTestCaseScores,
  printTestCaseSuccessOrFailed,
  type SuiteData,
} from './reporter.console-utils';
import { flattenObject } from '../util/dot-path';
import { AxiomCLIError } from '../cli/errors';

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
  private _printedFlagOverrides = false;

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();
  }

  async onTestSuiteReady(_testSuite: TestSuite) {
    const meta = _testSuite.meta() as MetaWithEval;
    if (_testSuite.state() === 'skipped') {
      return;
    }

    // Print flag overrides once when defaults become available
    // (we don't have them in `onTestRunStart`)
    if (!this._printedFlagOverrides) {
      const defaultsFromConfigEnd = meta.evaluation.configEnd?.flags ?? {};
      const overridesFromConfigEnd = meta.evaluation.configEnd?.overrides ?? {};

      if (Object.keys(overridesFromConfigEnd).length > 0) {
        printGlobalFlagOverrides(overridesFromConfigEnd, defaultsFromConfigEnd);
      }
      this._printedFlagOverrides = true;
    }

    const baseline = meta.evaluation.baseline;
    if (baseline) {
      // load baseline data per suite
      const config = getAxiomConfig();
      if (!config) {
        throw new AxiomCLIError('Axiom config not available in reporter');
      }
      const baselineData = await findEvaluationCases(baseline.id, config);
      this._baselines.set(meta.evaluation.name, baselineData || null);
    } else {
      this._baselines.set(meta.evaluation.name, null);
    }

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
  }

  async onTestSuiteResult(testSuite: TestSuite) {
    const meta = testSuite.meta() as MetaWithEval;
    // test suite won't have any meta because its skipped
    if (testSuite.state() === 'skipped') {
      return;
    }

    const durationSeconds = Number((performance.now() - this.start) / 1000).toFixed(2);

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

    const cwd = process.cwd();
    const relativePath = testSuite.module.moduleId.replace(cwd, '').replace(/^\//, '');

    // Collect suite data for final report
    // Ensure baseline is loaded
    let suiteBaseline = this._baselines.get(meta.evaluation.name);
    if (suiteBaseline === undefined && meta.evaluation.baseline) {
      // Baseline wasn't loaded yet, load it now
      const config = getAxiomConfig();
      if (!config) {
        throw new AxiomCLIError('Axiom config not available in reporter');
      }
      const baselineData = await findEvaluationCases(meta.evaluation.baseline.id, config);
      suiteBaseline = baselineData || null;
      this._baselines.set(meta.evaluation.name, suiteBaseline);
    }
    this._suiteData.push({
      name: meta.evaluation.name,
      file: relativePath,
      duration: durationSeconds + 's',
      baseline: suiteBaseline || null,
      configFlags: meta.evaluation.configFlags,
      flagConfig: meta.evaluation.flagConfig,
      cases,
      outOfScopeFlags: meta.evaluation.outOfScopeFlags,
    });

    printEvalNameAndFileName(testSuite, meta);
    printBaselineNameAndVersion(meta);

    printTestCaseCountStartDuration(testSuite, this.startTime, durationSeconds);

    for (const test of testSuite.children) {
      if (test.type !== 'test') continue;
      this.printCaseResult(test, suiteBaseline || null);
    }

    console.log('');
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {
    const shouldClear = !process.env.CI && process.stdout.isTTY !== false;

    if (shouldClear) {
      process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to top
    }

    printFinalReport({
      suiteData: this._suiteData,
      calculateScorerAverages: this.calculateScorerAverages.bind(this),
      calculateBaselineScorerAverage: this.calculateBaselineScorerAverage.bind(this),
      calculateFlagDiff: this.calculateFlagDiff.bind(this),
    });

    const DEBUG = process.env.AXIOM_DEBUG === 'true';
    if (DEBUG && this._endOfRunConfigEnd) {
      this.printConfigEnd(this._endOfRunConfigEnd);
    }
  }

  private printCaseResult(test: TestCase, baseline: Evaluation | null) {
    const ok = test.ok();
    const testMeta = test.meta() as MetaWithCase;

    if (!testMeta?.case) {
      return;
    }

    printTestCaseSuccessOrFailed(testMeta, ok);

    printTestCaseScores(testMeta, baseline);

    printRuntimeFlags(testMeta);

    printOutOfScopeFlags(testMeta);
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
  private calculateFlagDiff(suite: SuiteData): Array<FlagDiff> {
    if (!suite.baseline || !suite.configFlags || suite.configFlags.length === 0) {
      return [];
    }

    const diffs: Array<FlagDiff> = [];

    const currentConfig = suite.flagConfig || {};
    const baselineConfig = suite.baseline.flagConfig || {};

    const currentFlat = flattenObject(currentConfig);
    const baselineFlat = flattenObject(baselineConfig);

    const allKeys = new Set([...Object.keys(currentFlat), ...Object.keys(baselineFlat)]);

    for (const key of allKeys) {
      const isInScope = suite.configFlags.some((pattern) => key.startsWith(pattern));
      if (!isInScope) continue;

      const currentValue = currentFlat[key];
      const baselineValue = baselineFlat[key];

      if (JSON.stringify(currentValue) !== JSON.stringify(baselineValue)) {
        diffs.push({
          flag: key,
          current: currentValue ? JSON.stringify(currentValue) : undefined,
          baseline: baselineValue ? JSON.stringify(baselineValue) : undefined,
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
}
