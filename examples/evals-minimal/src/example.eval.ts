import { flag, pickFlags } from '@/app-scope';
import { Eval, Scorer } from 'axiom/ai/evals';
import { parrotOrAntiParrot } from './example';

const ExactMatch = Scorer(
  'ExactMatch',
  ({ output, expected }: { output: string; expected: string }) => {
    return output === expected ? 1 : 0;
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
