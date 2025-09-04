import { Command } from 'commander';
import { runEvaluation } from 'src/evals/runner';

export const loadEvalCommand = (program: Command) => {
  return program.addCommand(
    new Command('eval')
      .description('run evals locally')
      .argument('step', 'name of step to evaluate')
      // .option('-w, --watch true', 'keep server running and watch for changes', false)
      .option('-t, --token <TOKEN>', 'axiom token', process.env.AXIOM_TOKEN)
      .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
      .option('-u, --url <AXIOM URL>', 'axiom url', process.env.AXIOM_URL ?? 'https://api.axiom.co')
      // .option('-b, --baseline <BASELINE ID>', 'id of baseline evaluation to compare against')
      .action(async (stepName: string, options) => {
        if (!options.token || !options.dataset) {
          throw new Error('AXIOM_TOKEN, and AXIOM_DATASET must be set');
        }

        await runEvaluation(stepName);
      }),
  );
};
