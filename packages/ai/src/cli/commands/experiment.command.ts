import { Command, Argument } from 'commander';
import { runVitest } from '../../evals/run-vitest';

const runCommand = () =>
  new Command('run')
    .addArgument(new Argument('name', 'experiment name. only *.experiment.ts files allowed.'))
    .option('-w, --watch true', 'keep server running and watch for changes', false)
    .option('-t, --token <TOKEN>', 'axiom token', process.env.AXIOM_TOKEN)
    .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
    .option('-u, --url <AXIOM URL>', 'axiom url', process.env.AXIOM_URL ?? 'https://api.axiom.co')
    .action(async (experimentName: string, options) => {
      if (!options.token || !options.dataset) {
        throw new Error('AXIOM_TOKEN, and AXIOM_DATASET must be set');
      }

      try {
        // 1. Look for experiment file
        const experimentFile = `${experimentName}.experiment.ts`;
        console.log(`Looking for experiment file: ${experimentFile}`);

        await runVitest('.', {
          watch: options.watch,
          include: [`**/${experimentFile}`],
        });
      } catch (error) {
        console.error(`Failed to run experiment ${experimentName}:`, error);
        throw error;
      }
    });

export const loadExperimentCommand = (program: Command) => {
  return program.addCommand(
    new Command('experiment').description('run experiments locally').addCommand(runCommand()),
  );
};
