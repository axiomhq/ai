import type { SerializedError } from 'vitest';
import type { Reporter, TestModule, TestRunEndReason, TestSuite } from 'vitest/node.js';
import type { TaskMeta } from 'vitest/index.cjs';
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
    for (const test of testSuite.children.array()) {
      if (test.type !== 'test') continue;
      const testMeta = test.meta() as TaskMeta & { eval: EvalReport };

      if (!testMeta.eval) {
        return;
      }

      // build scores array
      const scores: { name: string; score: number }[] = [];
      for (const s of Object.entries(testMeta.eval.scores)) {
        scores.push({ name: s[1].name, score: s[1].score });
      }
    }
  }

  async onTestRunEnd(
    _testModules: ReadonlyArray<TestModule>,
    _errors: ReadonlyArray<SerializedError>,
    _reason: TestRunEndReason,
  ) {}
}
