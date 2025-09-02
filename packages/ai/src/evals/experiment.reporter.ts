import type {
  Reporter,
  SerializedError,
  TestCase,
  TestModule,
  TestRunEndReason,
  TestSuite,
} from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';

import type { Score } from '../scorers/scorer.types';
import { type Evaluation } from './eval.service';
import { formatConfigDiff, formatTable, renderLine, truncateText } from './reporter.helpers';

/**
 * Complete report for a single evaluation case including results and metadata.
 *
 * Generated for each test case when running {@link Eval} with {@link EvalParams}.
 * Contains all {@link Score} results and execution metadata.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type EvalCaseMeta = {
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

export type EvalMeta = {
  id: string;
  name: string;
  version: string;
  metadata: Record<string, any>;
};

type EvalCaseValues = {
  ok: boolean;
  index: number;
  errors: Error[];
  scorers: Record<string, Score>;
};

type EvalValues = {
  metadata: Record<string, any>;
  cases: EvalCaseValues[];
};
/**
 * Custom Vitest reporter for Axiom AI evaluations.
 *
 * This reporter collects evaluation results and scores from tests
 * and processes them for further analysis and reporting.
 *
 */
export class AxiomExperimentReporter implements Reporter {
  baseline: Evaluation | undefined | null;
  startTime: number = 0;
  start: number = 0;

  onTestRunStart() {
    this.start = performance.now();
    this.startTime = new Date().getTime();
  }

  onTestRunEnd(
    testModules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    reason: TestRunEndReason,
  ) {
    if (unhandledErrors.length) {
      console.log(unhandledErrors);
    }

    for (const mod of testModules) {
      console.log(mod.moduleId, mod.state());
      if (mod.errors.length) {
        console.log(mod.errors());
      }

      for (const testCase of mod.children.allTests()) {
        console.log(testCase.name, testCase.result());
      }
    }

    console.log(reason);
    console.log('finished');
  }

  onTestModuleEnd(testModule: TestModule) {
    console.log(testModule.errors());
    if (testModule.errors().length) {
      console.log(testModule.errors().map((e) => e.message));
      return;
    }
    // treat first module as base, second as an experiment
    // const suite = yield testModule.children.suites()
    const suites = testModule.children.suites();
    const base = suites.next();
    const experiment = suites.next();

    console.log(' ');
    console.log(base.value?.fullName, experiment.value?.fullName);
    console.log(' ');

    if (!base.value || !experiment.value) {
      throw new Error('failed to find baseline or experiment values');
    }
    const baseValues = this.prepareEvaluationValuesObject(base.value);
    const experimentValues = this.prepareEvaluationValuesObject(experiment.value);

    // render config comparison
    this.renderMetadataComparisonSection(baseValues, experimentValues);

    // render score comparison
    console.log(' ');
    renderLine();
    console.log('Score breakdown');
    renderLine();

    const scorers = baseValues?.cases.map((c) => Object.keys(c?.scorers ?? {})).flat() ?? [];
    const rows: string[][] = [];
    const headers = ['', 'case', ...(scorers ?? [])];

    for (const c of baseValues?.cases ?? []) {
      rows.push([
        '',
        c?.index.toString(),
        ...scorers.map((scorer) =>
          this.renderScore(
            c.scorers[scorer],
            experimentValues
              ? experimentValues.cases[c.index].scorers[scorer]
              : {
                  name: 'failed',
                  score: 0,
                },
          ),
        ),
      ]);
    }

    console.log(formatTable({ headers, rows }));
    renderLine();
    console.log(' ');
  }

  private renderMetadataComparisonSection(base: EvalValues, experiment: EvalValues) {
    renderLine();
    // const headers = ['', 'base', 'comparison'];
    const rows: string[][] = [];

    const allKeys = Object.keys(base.metadata).concat(Object.keys(experiment.metadata));

    for (const key of allKeys) {
      const baseValue = base.metadata[key] ? base.metadata[key] : '';
      const comparisonValue = experiment.metadata[key] ? experiment.metadata[key] : '';
      rows.push([
        key,
        truncateText(JSON.stringify(baseValue)),
        truncateText(JSON.stringify(comparisonValue)),
      ]);
    }

    // console.log(formatTable({ headers, rows }));

    const diff = formatConfigDiff(base.metadata, experiment.metadata);

    console.log(formatTable({ rows: diff.rows, headers: ['base', 'comparison'] }));
    renderLine();

    console.log(diff.summary);
  }

  private renderScore(base: Score, experiment: Score) {
    const baseScore = Number(base.score).toFixed(2);
    const experimentScore = Number(experiment.score).toFixed(2);
    const diff = experiment.score - base.score;
    const diffText = Number(diff).toFixed(2);

    return `${baseScore} -> ${experimentScore} ${diffText}%`;
  }

  private prepareEvaluationValuesObject(testSuite: TestSuite): EvalValues {
    const meta = testSuite.meta() as TaskMeta & { evaluation: EvalMeta };
    const cases = [];

    for (const test of testSuite.children) {
      if (test.type !== 'test') return { metadata: {}, cases: [] };
      cases.push(this.buildCaseValues(test));
    }

    return { metadata: meta.evaluation.metadata, cases };
  }

  private buildCaseValues(test: TestCase): EvalCaseValues {
    const ok = test.ok();
    const testMeta = test.meta() as TaskMeta & { case: EvalCaseMeta };

    if (!testMeta || !testMeta.case) {
      throw new Error('failed to find test case meta');
    }
    const index = testMeta.case.index;

    return {
      ok,
      index,
      errors: [],
      scorers: testMeta.case.scores,
    };
  }
}
