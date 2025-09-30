import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import c from 'tinyrainbow';

import { findEvaluationCases } from './eval.service';
import type { Evaluation, EvaluationReport, MetaWithCase, MetaWithEval } from './eval.types';
import {
  maybePrintFlags,
  printBaselineNameAndVersion,
  printConfigHeader,
  printDivider,
  printEvalNameAndFileName,
  printOutOfScopeFlags,
  printResultLink,
  printRuntimeFlags,
  printTestCaseCountStartDuration,
  printTestCaseScores,
  printTestCaseSuccessOrFailed,
} from './reporter.console-utils';

/**
 * Custom Vitest reporter for Axiom AI evaluations.
 *
 * This reporter collects evaluation results and scores from tests
 * and processes them for further analysis and reporting.
 *
 */
export class AxiomReporter implements Reporter {
  baseline: Evaluation | undefined | null;
  startTime: number = 0;
  start: number = 0;
  private _endOfRunConfigEnd: EvaluationReport['configEnd'] | undefined;

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();
  }

  async onTestSuiteReady(_testSuite: TestSuite) {
    const meta = _testSuite.meta() as MetaWithEval;
    if (_testSuite.state() === 'skipped') {
      return;
    }
    const baseline = meta.evaluation.baseline;
    if (baseline) {
      // load baseline data
      this.baseline = await findEvaluationCases(baseline.id);
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
    const meta = testSuite.meta() as MetaWithCase;
    // test suite won't have any meta because its skipped
    if (testSuite.state() === 'skipped') {
      return;
    }

    // calculate test duration in seconds
    const duration = Number((performance.now() - this.start) / 1000).toFixed(2);

    printTestCaseCountStartDuration(testSuite, this.startTime, duration);

    for (const test of testSuite.children) {
      if (test.type !== 'test') return;
      this.printCaseResult(test);
    }

    console.log('');

    const DEBUG = process.env.AXIOM_DEBUG === 'true';
    const AXIOM_URL = (process.env.AXIOM_URL ?? 'https://api.axiom.co').replace('api', 'app');
    if (!DEBUG) {
      printResultLink(meta, AXIOM_URL);
    }

    printDivider();
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {
    // Print end-of-run config once
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

    printTestCaseScores(testMeta, this.baseline);

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
