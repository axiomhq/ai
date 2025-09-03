import { Command } from 'commander';

export const loadVersionCommand = (program: Command) => {
  return program.addCommand(
    new Command('version').description('cli version').action(() => {
      console.log(__SDK_VERSION__);
    }),
  );
};
