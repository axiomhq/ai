import type { SerializedError } from 'vitest';
import type { Reporter, TestCase, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';
import c from 'tinyrainbow';

import type { Score } from './scorers';
import { findEvaluationCases, type Evaluation } from './eval.service';

/**
 * Complete report for a single evaluation case including results and metadata.
 *
 * Generated for each test case when running {@link Eval} with {@link EvalParams}.
 * Contains all {@link Score} results and execution metadata.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type EvalCaseReport = {
  /** Order/index of this case in the evaluation suite */
  index: number;
  /** Name of the evaluation */
  name: string;
  /** Input data that was provided to the {@link EvalTask} */
  input: string | Record<string, any>;
  /** Output produced by the {@link EvalTask} */
  output: string | Record<string, any>;
  /** Expected output for comparison */
  expected: string | Record<string, any>;
  /** Array of {@link Score} results from all scorers that were run */
  scores: Record<string, Score>;
  /** Any errors that occurred during evaluation */
  errors: Error[] | null;
  /** Status of the evaluation case */
  status: 'success' | 'fail' | 'pending';
  /** Duration in milliseconds for the entire case */
  duration: number | undefined;
  /** Timestamp when the case started */
  startedAt: number | undefined;
};

export type EvaluationReport = {
  id: string;
  name: string;
  version: string;
  baseline: Evaluation | undefined;
};

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

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();
  }

  async onTestSuiteReady(_testSuite: TestSuite) {
    const meta = _testSuite.meta() as TaskMeta & { evaluation: EvaluationReport };
    const baseline = meta.evaluation.baseline;
    if (baseline) {
      // load baseline data
      this.baseline = await findEvaluationCases(baseline.id);
    }
    const cwd = process.cwd();

    console.log(
      ' ',
      c.bgCyan(c.black(` ${_testSuite.project.name} `)),
      c.bgBlue(c.black(` ${meta.evaluation.name}-${meta.evaluation.version} `)),
      c.dim(`(${_testSuite.children.size} cases)`),
    );

    console.log(' ', c.dim(_testSuite.module.moduleId.replace(cwd, '')));

    // print baseline name and version if found
    if (meta.evaluation.baseline) {
      console.log(
        ' ',
        ' baseline ',
        c.bgMagenta(
          c.black(` ${meta.evaluation.baseline.name}-${meta.evaluation.baseline.version} `),
        ),
      );
    } else {
      console.log(' ', c.bgWhite(c.blackBright(' baseline: ')), 'none');
    }

    console.log('');
  }

  onTestCaseReady(test: TestCase) {
    const meta = test.meta() as TaskMeta & { case: EvalCaseReport };

    // TODO: there seem to be some cases where `meta` is undefined
    // maybe we get here to early?
    if (!meta.case) return;

    console.log(c.blue(` \u2713 evaluating case ${meta.case.index}`));
  }

  onTestSuiteResult(testSuite: TestSuite) {
    // calculate test duration in seconds
    const duration = Number((performance.now() - this.start) / 1000).toFixed(2);

    console.log(' ');
    console.log(' ', c.dim('Cases'), testSuite.children.size);
    console.log(' ', c.dim('Start at'), new Date(this.startTime).toTimeString());
    console.log(' ', c.dim('Duration'), `${duration}s`);

    const meta = testSuite.meta() as TaskMeta & { evaluation: EvaluationReport };
    const url = `https://app.axiom.co/evaluations/${meta.evaluation.name}/${meta.evaluation.id}`;

    for (const test of testSuite.children) {
      if (test.type !== 'test') return;
      this.printCaseResult(test);
    }

    console.log('');
    console.log(
      ' ',
      `see results for ${meta.evaluation.name}-${meta.evaluation.version} at ${url}`,
    );
    console.log(
      ' ',
      c.cyanBright('=== === === === === === === === === === === === === === === ==='),
    );
    console.log('');
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {}

  private printCaseResult(test: TestCase) {
    const ok = test.ok();
    const testMeta = test.meta() as TaskMeta & { case: EvalCaseReport };

    if (!testMeta || !testMeta.case) {
      return;
    }
    const index = testMeta.case.index;

    if (ok) {
      console.log(' ', c.yellow(` \u2714 case ${index}:`));
    } else {
      console.log(' ', c.red(` \u2716 case ${index}: failed`));
      for (const e of testMeta.case.errors ?? []) {
        console.log('', e.message);
      }
    }

    // print scores
    Object.keys(testMeta.case.scores).forEach((k) => {
      const v = testMeta.case.scores[k].score ? testMeta.case.scores[k].score : 0;
      const scoreValue = Number(v * 100).toFixed(2) + '%';

      if (this.baseline && this.baseline.cases[index] && this.baseline.cases[index].scores[k]) {
        const baselineScoreValue = this.baseline.cases[index].scores[k].value;
        const diff = v - baselineScoreValue;
        const diffText = Number(diff * 100).toFixed(2) + '%';
        const blScoreText = Number(baselineScoreValue * 100).toFixed(2) + '%';
        console.log(
          '   ',
          k,
          c.magentaBright(blScoreText),
          '->',
          c.blueBright(scoreValue),
          diff > 0 ? c.green('+' + diffText) : c.red(diffText),
        );
      } else {
        console.log('   ', k, c.blueBright(scoreValue));
      }

      return [k, scoreValue];
    });
  }
}
