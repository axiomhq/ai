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

    // Print summary
    this.printSummary();
  }

  /**
   * Print a single suite section
   */
  private printSuiteSection(suite: SuiteData) {
    // Suite header
    console.log(c.bgGreen(c.black(' ' + suite.name + ' ')));
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
    // for (const caseData of suite.cases) {
    for (let i = 0; i < suite.cases.length; i++) {
      const _isLast = i === suite.cases.length - 1;

      const caseData = suite.cases[i];
      console.log(`   └─ CS-${caseData.index.toString().padStart(2, '0')}`);

      // Show out-of-scope flags if present
      if (caseData.outOfScopeFlags && caseData.outOfScopeFlags.length > 0) {
        // For now, show just the first flag
        const flag = caseData.outOfScopeFlags[0];
        console.log(`      ⚠ Out-of-scope flag: ${flag.flagPath}`);
        if (flag.stackTrace && flag.stackTrace.length > 0) {
          console.log(`        at: ${flag.stackTrace[0]}`);
        }
      }

      // Print scores with baseline comparison if available
      const scoreNames = Object.keys(caseData.scores);
      for (let j = 0; j < scoreNames.length; j++) {
        const scoreName = scoreNames[j];
        const score = caseData.scores[scoreName];
        const isLast = j === scoreNames.length - 1;
        const firstChar = _isLast ? ' ' : '│';
        const prefix = isLast ? `   ${firstChar}  └─` : `   ${firstChar}  ├─`;

        const currentValue = ((score.score || 0) * 100).toFixed(2) + '%';

        // Check if baseline has this case and score
        const baselineScore = suite.baseline?.cases[caseData.index]?.scores[scoreName];
        if (baselineScore) {
          const baselineValue = (baselineScore.value * 100).toFixed(2) + '%';
          const diff = (score.score || 0) - baselineScore.value;
          const diffText = (diff >= 0 ? '+' : '') + (diff * 100).toFixed(2) + '%';
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
   * Print summary section with cross-suite statistics
   */
  private printSummary() {
    console.log(c.bgGreen(c.black(' Summary ')));

    // Calculate totals
    const totalSuites = this._suiteData.length;
    const totalCases = this._suiteData.reduce((sum, suite) => sum + suite.cases.length, 0);
    const totalScores = this._suiteData.reduce((sum, suite) => {
      return sum + suite.cases.reduce((caseSum, c) => caseSum + Object.keys(c.scores).length, 0);
    }, 0);

    console.log(
      `├─ ${totalSuites} suite${totalSuites !== 1 ? 's' : ''} | ${totalCases} case${totalCases !== 1 ? 's' : ''} | ${totalScores} score${totalScores !== 1 ? 's' : ''} evaluated`,
    );
    console.log('│');

    // Print per-suite averages
    this._suiteData.forEach((suite, index) => {
      const isLast = index === this._suiteData.length - 1;
      const prefix = isLast ? '└─' : '├─';

      console.log(`${prefix} ${suite.name}`);

      // Calculate per-scorer averages for this suite
      const scorerAverages = this.calculateScorerAverages(suite);
      const scorerNames = Object.keys(scorerAverages);

      scorerNames.forEach((scorerName, scorerIndex) => {
        const avg = scorerAverages[scorerName];
        const isLastScorer = scorerIndex === scorerNames.length - 1;
        // If suite is not last, use │ to continue the vertical line
        const scorerPrefix = isLast
          ? isLastScorer
            ? '   └─'
            : '   ├─'
          : isLastScorer
            ? '│  └─'
            : '│  ├─';

        // Check if baseline has this scorer
        if (suite.baseline) {
          const baselineAvg = this.calculateBaselineScorerAverage(suite.baseline, scorerName);
          if (baselineAvg !== null) {
            const diff = avg - baselineAvg;
            const diffText = (diff >= 0 ? '+' : '') + (diff * 100).toFixed(2) + '%';
            const diffColor = diff > 0 ? c.green : diff < 0 ? c.red : c.dim;

            console.log(
              `${scorerPrefix} ${scorerName}: ${(baselineAvg * 100).toFixed(2)}% → ${(avg * 100).toFixed(2)}% (${diffColor(diffText)})`,
            );
          } else {
            console.log(`${scorerPrefix} ${scorerName}: ${(avg * 100).toFixed(2)}%`);
          }
        } else {
          console.log(`${scorerPrefix} ${scorerName}: ${(avg * 100).toFixed(2)}%`);
        }
      });

      if (!isLast) {
        console.log('│');
      }
    });

    console.log('');
    console.log('View full report:');
    console.log('https://app.axiom.co/evaluations/run/<run-id>');
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
   * End-of-suite config summary (console only)
   */
  private printConfigEnd(configEnd: EvaluationReport['configEnd']) {
    printConfigHeader();
    maybePrintFlags(configEnd);
  }
}
