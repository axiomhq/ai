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

const formatTopLevelHelp = (
  cmd: Command,
  helper: ReturnType<Command['createHelp']>,
) => {
  const usage = `Usage: ${helper.commandUsage(cmd)}`;
  const description = helper.commandDescription(cmd);
  const options = helper
    .visibleOptions(cmd)
    .map((option) => `  ${helper.optionTerm(option).padEnd(24)}  ${helper.optionDescription(option)}`)
    .join('\n');
  const commands = helper
    .visibleCommands(cmd)
    .sort((a, b) => helper.subcommandTerm(a).localeCompare(helper.subcommandTerm(b)))
    .map((entry) => ({
      term: helper.subcommandTerm(entry),
      description: helper.subcommandDescription(entry),
    }));
  const rows = commands.map((row) => {
    const [name, ...args] = row.term.split(/\s+/);
    return {
      name,
      args: args.join(' '),
      description: row.description,
    };
  });
  const nameWidth = rows.reduce((max, row) => Math.max(max, row.name.length), 0);
  const argsWidth = rows.reduce((max, row) => Math.max(max, row.args.length), 0);
  const commandLines = commands.map(
    (_, index) =>
      `  ${rows[index].name.padEnd(nameWidth)}  ${rows[index].args.padEnd(argsWidth)}  ${rows[index].description}`.trimEnd(),
  );

  return [usage, description, `Options:\n${options}`, `Commands:\n${commandLines.join('\n')}`].join('\n\n') + '\n';
};

export const createProgram = ({ overrides = {} }: ProgramOptions = {}): Command => {
  loadEnvConfig(process.cwd());

  const program = new Command();

  program
    .name('axiom')
    .description("Axiom's CLI to manage your objects and run evals")
    .version(__SDK_VERSION__);

  program.configureHelp({
    formatHelp: (cmd, helper) => {
      if (cmd.parent) {
        const defaultHelp = Object.getPrototypeOf(helper) as {
          formatHelp: (this: unknown, command: Command, help: typeof helper) => string;
        };
        return defaultHelp.formatHelp.call(helper, cmd, helper);
      }
      return formatTopLevelHelp(cmd, helper);
    },
  });

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
