import { Command } from 'commander';
import { runVitest } from '../evals/run-vitest';
import { loadConfigAsync, printConfigWarning } from '../config';
import { CONFIG_FILE_NOT_FOUND } from 'src/config/errors';

export const loadRunCommand = (program: Command) => {
  return program.addCommand(
    new Command('run')
      .description('run evals locally')
      .argument('<path>', 'Path to an eval test file, should be in the form of name.eval.ts')
      .action(async (file: string) => {
        const { config, error } = await loadConfigAsync();

        if (!config || error) {
          if (error === CONFIG_FILE_NOT_FOUND) {
            printConfigWarning();
          } else {
            console.error(error);
          }
          // abort run
          return;
        }

        await runVitest(config, file);
      }),
  );
};
