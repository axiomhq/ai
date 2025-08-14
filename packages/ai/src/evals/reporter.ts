import type { SerializedError } from 'vitest';
import type { Reporter, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';
import { Table } from 'console-table-printer';
import type { EvalReport } from './eval';

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

      // build scores array
      const scores: { name: string; score: number }[] = [];
      for (const [_, s] of Object.entries(testMeta.eval.scores)) {
        const roundedScore = Math.round(s.score * 100) / 100; // Number(s.score).toFixed(2)
        scores.push({ name: s.name, score: roundedScore });
      }

      scoreboard.addRow({
        case: testMeta.eval.order,
        ...Object.fromEntries(scores.map((s) => [s.name, s.score])),
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
