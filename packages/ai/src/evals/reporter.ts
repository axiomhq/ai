import type { SerializedError } from 'vitest';
import type { Reporter, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';
import { Table } from 'console-table-printer';
import type { EvalReport } from './eval.types';

const prRed = (s: string): string => `\x1b[91m ${s}\x1b[00m`;

/**
 * Custom Vitest reporter for Axiom AI evaluations.
 *
 * This reporter collects evaluation results and scores from tests
 * and processes them for further analysis and reporting.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export class AxiomReporter implements Reporter {
  onTestSuiteReady(_testSuite: TestSuite) {}

  onTestSuiteResult(testSuite: TestSuite) {
    const scoreboard = new Table({
      title: testSuite.name,
    });
    for (const test of testSuite.children.array()) {
      if (test.type !== 'test') continue;
      const testMeta = test.meta() as TaskMeta & { eval: EvalReport };

      if (!testMeta.eval) {
        return;
      }

      // round scores
      const scores = Object.keys(testMeta.eval.scores).map((k) => {
        const v = testMeta.eval.scores[k].score ? testMeta.eval.scores[k].score : 0;
        const scoreValue = Number(v * 100).toFixed(2);

        // if score is lower then threshold then print it in red
        const score =
          testMeta.eval.threshold && v < testMeta.eval.threshold
            ? prRed(scoreValue + '%')
            : scoreValue + '%';

        return [k, score];
      });

      scoreboard.addRow({
        case: testMeta.eval.index.toString(),
        ...Object.fromEntries(scores),
      });
    }

    scoreboard.printTable();
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {}
}
