import { experimental_Eval as Eval } from 'axiom/evals';
import { AnswerSimilarity } from 'autoevals';

Eval('feature-example', {
  data: () =>
    Promise.resolve([
      {
        input: "['nginx-access-logs'] | where status >= 500",
        expected: 'Nginx 5xx Errors',
      },
    ]),
  task: ({ input }) => {
    // TOOD: invoke a prompt using input
    return input;
  },
  scorers: [AnswerSimilarity],
  threshold: 0.6,
});
