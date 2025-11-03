import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';

import { getAxiomConfig } from './context/storage';
import { findEvaluationCases } from './eval.service';
import type { Evaluation, EvaluationReport, MetaWithCase, MetaWithEval } from './eval.types';
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
    if (_testSuite.state() === 'skipped' || !meta?.evaluation) {
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
    // test suite won't have any meta because its skipped or failed before setup
    if (testSuite.state() === 'skipped' || !meta?.evaluation) {
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
      registrationStatus: meta.evaluation.registrationStatus,
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

    const registrationStatus = this._suiteData.map((suite) => ({
      name: suite.name,
      registered: suite.registrationStatus?.status === 'success',
      error:
        suite.registrationStatus?.status === 'failed' ? suite.registrationStatus.error : undefined,
    }));

    printFinalReport({
      suiteData: this._suiteData,
      registrationStatus,
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
   * End-of-suite config summary (console only)
   */
  private printConfigEnd(configEnd: EvaluationReport['configEnd']) {
    printConfigHeader();
    maybePrintFlags(configEnd);
  }
}
