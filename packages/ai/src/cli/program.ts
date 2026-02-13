import { Command } from 'commander';
import pkg from '@next/env';
import { loadEvalCommand } from './commands/eval.command';
import { loadAuthCommand } from './commands/auth.command';
import { setupGlobalAuth } from './auth/global-auth';
import { loadVersionCommand } from './commands/version.command';
import { registerObsCommands } from '../obs/cli/registerObsCommands';
import { loadCompletionCommand } from './commands/completion.command';

const { loadEnvConfig } = pkg;

type ProgramOptions = {
  overrides?: Record<string, string>;
};

export const createProgram = ({ overrides = {} }: ProgramOptions = {}): Command => {
  loadEnvConfig(process.cwd());

  const program = new Command();

  program
    .name('axiom')
    .description("Axiom's CLI to manage your objects and run evals")
    .version(__SDK_VERSION__);

  program.hook('preAction', async (_, actionCommand: Command) => {
    const commandName = actionCommand.name();
    const parentCommand = actionCommand.parent;
    const parentName = parentCommand?.name();

    if (
      commandName === 'auth' ||
      parentName === 'auth' ||
      commandName === 'version' ||
      commandName === 'completion' ||
      parentName === 'completion'
    ) {
      return;
    }

    try {
      await setupGlobalAuth();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ ${error.message}\n`);
      } else {
        console.error(`\n❌ Unexpected error: ${String(error)}\n`);
      }
      process.exit(1);
    }
  });

  loadAuthCommand(program);
  loadEvalCommand(program, overrides);
  loadVersionCommand(program);
  loadCompletionCommand(program);
  registerObsCommands(program);

  return program;
};
