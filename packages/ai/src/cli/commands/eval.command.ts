import { Command, Argument } from 'commander';
import { runVitest } from '../../evals/run-vitest';

export const loadEvalCommand = (program: Command) => {
  return program.addCommand(
    new Command('eval')
      .description('run evals locally')
      .addArgument(
        new Argument(
          '[path]',
          'path to an eval test file, should be in the form of *.eval.ts',
        ).default('.', 'any eval file in current directory'),
      )
      .option('-w, --watch true', 'keep server running and watch for changes', false)
      .option('-t, --token <TOKEN>', 'axiom token', process.env.AXIOM_TOKEN)
      .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
      .option('-u, --url <AXIOM URL>', 'axiom url', process.env.AXIOM_URL ?? 'https://api.axiom.co')
      .option('-b, --baseline <BASELINE ID>', 'id of baseline evaluation to compare against')
      .action(async (path: string, options) => {
        if (!options.token || !options.dataset) {
          throw new Error('AXIOM_TOKEN, and AXIOM_DATASET must be set');
        }
        await runVitest(path, {
          watch: options.watch,
          baseline: options.baseline,
        });
      }),
  );
};
