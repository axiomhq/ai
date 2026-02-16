// TODO: BEFORE MERGE - delete this

import { Eval } from 'axiom/ai/evals';
import { Mean } from 'axiom/ai/evals/aggregations';
import { Scorer } from 'axiom/ai/evals/scorers';

/**
 * Repro for PR #236 comment (2026-02-12 13:24 UTC):
 * the failed trial span can end up with status=OK.
 *
 * Expected behavior:
 * trial 1 throws, so its span status should be ERROR.
 *
 * Buggy behavior:
 * trial 1 has `eval.trial.error` attribute but span status is OK.
 */

const AlwaysOne = Scorer('AlwaysOne', () => ({ score: 1 }), { aggregation: Mean() });

let taskCalls = 0;

Eval('Trial-Span-Status-Repro', {
  capability: 'trial-span-status-repro',
  trials: 2,
  data: () => [{ input: 'only-case', expected: 'ok' }],
  task: async () => {
    taskCalls += 1;

    // Fail only the second trial so we get one success + one failed trial.
    if (taskCalls === 2) {
      throw new Error('intentional trial failure for span-status repro');
    }

    return 'ok';
  },
  scorers: [AlwaysOne],
});
