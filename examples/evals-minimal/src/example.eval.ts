import { pickFlags } from '@/app-scope';
import { Eval, Scorer } from 'axiom/ai/evals';
import { parrotOrAntiParrot } from './example';

/**
 * 🚨 This eval is very contrived for the sake of creating a minimal example.
 *
 * For something a bit more realistic, please take a look at the kitchen-sink example.
 */

const ExactMatch = Scorer(
  'ExactMatch',
  ({ output, expected }: { output: string; expected: string }) => {
    return output === expected ? 1 : 0;
  },
);

Eval('Minimal-Demo', {
  capability: 'minimal-demo',
  configFlags: pickFlags('minimalDemo'),
  data: [
    { input: 'hello', expected: 'hello' },
    { input: 'world', expected: 'world' },
  ],
  task: async ({ input }) => {
    return await parrotOrAntiParrot(input);
  },
  scorers: [ExactMatch],
});
