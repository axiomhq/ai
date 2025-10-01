import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import c from 'tinyrainbow';

import { findEvaluationCases } from './eval.service';
import type { Evaluation, EvaluationReport, MetaWithCase, MetaWithEval } from './eval.types';
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

/**
 * Data structure for collected suite information
 */
type SuiteData = {
  name: string;
  file: string;
  duration: string;
  // TODO: BEFORE MERGE - pick undefined or null
  baseline: Evaluation | undefined | null;
  cases: Array<{
    index: number;
    scores: Record<string, Score>;
    outOfScopeFlags?: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
    errors?: Error[] | null;
  }>;
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
      cases,
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
    console.log(c.bgGreen(c.black(' FINAL EVALUATION REPORT ')));
    console.log('');

    // Print each suite's detailed results
    for (const suite of this._suiteData) {
      this.printSuiteSection(suite);
      console.log('');
    }
  }

  /**
   * Print a single suite section
   */
  private printSuiteSection(suite: SuiteData) {
    // Suite header
    console.log(suite.name);
    console.log(`├─ File: ${suite.file}`);
    console.log(`├─ Duration: ${suite.duration}`);

    // Baseline info
    if (suite.baseline) {
      const baselineTimestamp = suite.baseline.runAt
        ? new Date(suite.baseline.runAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
            timeZoneName: 'short',
          })
        : 'unknown time';
      console.log(
        `├─ Baseline: ${suite.baseline.name}-${suite.baseline.version} (${baselineTimestamp})`,
      );
    } else {
      console.log(`├─ Baseline: (none)`);
    }

    console.log(`└─ Results:`);

    // Print cases
    for (const caseData of suite.cases) {
      console.log(`   • C-${caseData.index.toString().padStart(2, '0')}:`);

      // Show out-of-scope flags if present
      if (caseData.outOfScopeFlags && caseData.outOfScopeFlags.length > 0) {
        // For now, show just the first flag
        const flag = caseData.outOfScopeFlags[0];
        console.log(`     ⚠ Out-of-scope flag: ${flag.flagPath}`);
        if (flag.stackTrace && flag.stackTrace.length > 0) {
          console.log(`       at: ${flag.stackTrace[0]}`);
        }
      }

      // Print scores with baseline comparison if available
      const scoreNames = Object.keys(caseData.scores);
      for (let i = 0; i < scoreNames.length; i++) {
        const scoreName = scoreNames[i];
        const score = caseData.scores[scoreName];
        const isLast = i === scoreNames.length - 1;
        const prefix = isLast ? '     └─' : '     ├─';

        const currentValue = (score.score || 0).toFixed(4);

        // Check if baseline has this case and score
        const baselineScore = suite.baseline?.cases[caseData.index]?.scores[scoreName];
        if (baselineScore) {
          const baselineValue = baselineScore.value.toFixed(4);
          const diff = (score.score || 0) - baselineScore.value;
          const diffText = (diff >= 0 ? '+' : '') + diff.toFixed(4);
          const diffColor = diff > 0 ? c.green : diff < 0 ? c.red : c.dim;

          console.log(
            `${prefix} ${scoreName}: ${baselineValue} → ${currentValue} (${diffColor(diffText)})`,
          );
        } else {
          console.log(`${prefix} ${scoreName}: ${currentValue}`);
        }
      }
    }
  }

  /**
   * End-of-suite config summary (console only)
   */
  private printConfigEnd(configEnd: EvaluationReport['configEnd']) {
    printConfigHeader();
    maybePrintFlags(configEnd);
  }
}
