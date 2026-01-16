import { pickFlags } from '@/app-scope';
import { Eval, Scorer } from 'axiom/ai/evals';
import { Mean, PassHatK } from 'axiom/ai/evals/aggregations';
import { parrotOrAntiParrot } from './example';

/**
 * 🚨 This eval is very contrived for the sake of creating a minimal example.
 *
 * For something a bit more realistic, please take a look at the kitchen-sink example.
 */

const ExactMatch = Scorer(
  'ExactMatch',
  ({ output, expected }: { output: string; expected: string }) => {
    return output === expected ? true : false;
  },
);

Eval('Minimal-Demo', {
  capability: 'minimal-demo',
  configFlags: pickFlags('minimalDemo'),
  data: () => [
    { input: 'hello', expected: 'hello' },
    { input: 'world', expected: 'world' },
  ],
  task: async ({ input }) => {
    return await parrotOrAntiParrot(input);
  },
  scorers: [ExactMatch],
});

/**
 * Example demonstrating trials for handling LLM non-determinism.
 * Each case runs 3 times, with different aggregation strategies per scorer.
 */

const ExactMatchMean = Scorer(
  'ExactMatch-Mean',
  ({ output, expected }: { output: string; expected: string }) => {
    return output === expected ? 1 : 0;
  },
  { aggregation: Mean() },
);

const ExactMatchPassAtK = Scorer(
  'ExactMatch-PassAtK',
  ({ output, expected }: { output: string; expected: string }) => {
    return output === expected ? 1 : 0;
  },
  { aggregation: PassHatK({ threshold: 1 }) },
);

Eval('Minimal-Demo-Trials', {
  capability: 'minimal-demo',
  configFlags: pickFlags('minimalDemo'),
  trials: 3,
  data: () => [
    { input: 'hello', expected: 'hello' },
    { input: 'world', expected: 'world' },
    { input: 'foo', expected: 'bar' },
  ],
  task: async ({ input }) => {
    return await parrotOrAntiParrot(input);
  },
  scorers: [ExactMatchMean, ExactMatchPassAtK],
});
