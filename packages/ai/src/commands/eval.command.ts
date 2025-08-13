import { Command } from 'commander';
import { runVitest } from '../evals/run-vitest';

export const loadRunCommand = (program: Command) => {
  return program.addCommand(
    new Command('eval')
      .description('run evals locally')
      .argument('<path>', 'Path to an eval test file, should be in the form of *.eval.ts')
      .action(async (file: string) => {
        if (!process.env.AXIOM_URL || !process.env.AXIOM_TOKEN || !process.env.AXIOM_DATASET) {
          throw new Error('AXIOM_URL, AXIOM_TOKEN, and AXIOM_DATASET must be set');
        }
        await runVitest(file);
      }),
  );
};
