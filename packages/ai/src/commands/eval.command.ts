import { Command } from 'commander';
import { runVitest } from '../evals/run-vitest';

export const loadRunCommand = (program: Command) => {
  return program.addCommand(
    new Command('eval')
      .description('run evals locally')
      .argument('<path>', 'Path to an eval test file, should be in the form of *.eval.ts')
      .option('-w, --watch true', 'keep server running and watch for changes', false)
      .option('-t, --token <TOKEN>', 'axiom token', process.env.AXIOM_TOKEN)
      .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
      .option('-u, --url <AXIOM URL>', 'axiom url', process.env.AXIOM_URL ?? 'https://api.axiom.co')
      .action(async (file: string, options) => {
        if (!options.token || !options.dataset) {
          throw new Error('AXIOM_TOKEN, and AXIOM_DATASET must be set');
        }
        await runVitest(file, {
          watch: options.watch
        });
      }),
  );
};
