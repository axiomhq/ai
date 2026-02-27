import { Command } from 'commander';
import pkg from '@next/env';
import { loadEvalCommand } from './commands/eval.command';
import { loadAuthCommand } from './commands/auth.command';
import { setupGlobalAuth } from './auth/global-auth';
import { loadVersionCommand } from './commands/version.command';
import { registerCliCommands } from './registerCliCommands';
import { loadCompletionCommand } from './commands/completion.command';

const { loadEnvConfig } = pkg;

type ProgramOptions = {
  overrides?: Record<string, string>;
};

type CommandRow = {
  name: string;
  description: string;
};

const formatRows = (rows: CommandRow[]) => {
  if (rows.length === 0) {
    return '';
  }

  const width = rows.reduce((max, row) => Math.max(max, row.name.length), 0);
  return rows.map((row) => `  ${`${row.name}:`.padEnd(width + 2)} ${row.description}`).join('\n');
};

const formatTopLevelHelp = (
  cmd: Command,
  helper: ReturnType<Command['createHelp']>,
) => {
  const description = helper.commandDescription(cmd);

  const commandRows = helper
    .visibleCommands(cmd)
    .map((entry) => ({
      name: helper.subcommandTerm(entry).split(/\s+/)[0],
      description: helper.subcommandDescription(entry),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const coreCommandNames = new Set([
    'auth',
    'datasets',
    'eval',
    'ingest',
    'monitors',
    'query',
    'traces',
  ]);

  const coreCommands = commandRows.filter((row) => coreCommandNames.has(row.name));
  const additionalCommands = commandRows.filter((row) => !coreCommandNames.has(row.name));

  const options = helper
    .visibleOptions(cmd)
    .map((option) => {
      const term = helper.optionTerm(option);
      const optionWithLong = option as { long?: string };
      if (optionWithLong.long === '--help') {
        return { term, description: 'Show help for command' };
      }
      if (optionWithLong.long === '--version') {
        return { term, description: `Show ${cmd.name()} version` };
      }
      return { term, description: helper.optionDescription(option) };
    });
  const optionWidth = options.reduce((max, option) => Math.max(max, option.term.length), 0);
  const optionLines = options
    .map((option) => `  ${option.term.padEnd(optionWidth)}   ${option.description}`)
    .join('\n');

  return [
    description,
    '',
    'USAGE',
    `  ${cmd.name()} <command> [flags]`,
    '',
    'CORE COMMANDS',
    formatRows(coreCommands),
    '',
    'ADDITIONAL COMMANDS',
    formatRows(additionalCommands),
    '',
    'FLAGS',
    optionLines,
    '',
    'LEARN MORE',
    `  Use \`${cmd.name()} <command> --help\` for more information about a command.`,
    '',
  ].join('\n');
};

export const createProgram = ({ overrides = {} }: ProgramOptions = {}): Command => {
  loadEnvConfig(process.cwd());

  const program = new Command();

  program
    .name('axiom')
    .description('Axiom CLI')
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
  registerCliCommands(program);

  return program;
};
