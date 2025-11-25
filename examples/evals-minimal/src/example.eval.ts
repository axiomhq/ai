import { flag } from '@/app-scope';
import { Eval, Scorer } from 'axiom/ai/evals';

const ExactMatch = Scorer(
  'ExactMatch',
  ({ output, expected }: { output: string; expected: string }) => {
    return output === expected ? 1 : 0;
  },
);

Eval('Minimal-Demo', {
  capability: 'minimal-demo',
  data: () => [
    { input: 'hello', expected: 'hello' },
    { input: 'world', expected: 'world' },
  ],
  task: async ({ input }) => {
    // in your task function you would usually call code from your application

    const strategy = flag('minimalDemo.strategy');

    if (strategy === 'smart') {
      return input;
    }

    return 'something else';
  },
  scorers: [ExactMatch],
});
