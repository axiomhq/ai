import { Command, InvalidArgumentError, Option } from 'commander';
import { cliCommandSpec, type CommandSpec, type OptionSpec } from './commandSpec';
import { createExplainContext, emitExplainToStderr } from './explain/context';
import { resolveCliConfig } from './config/resolve';
import { datasetGet, datasetList, datasetSample, datasetSchema } from './commands/datasets';
import { ingestRun } from './commands/ingest';
import { queryRun } from './commands/queryRun';
import { monitorGet, monitorHistory, monitorList } from './commands/monitors';
import { traceGet } from './commands/tracesGet';

const POSITIVE_INTEGER_OPTION_NAMES = new Set<OptionSpec['name']>([
  'limit',
  'maxCells',
  'maxBinAutoGroups',
]);

const parsePositiveInteger = (value: string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('must be a positive integer');
  }
  return parsed;
};

const addOptions = (command: Command, options: OptionSpec[] = []) => {
  options.forEach((option) => {
    const commanderOption = new Option(option.flags, option.description);
    if (POSITIVE_INTEGER_OPTION_NAMES.has(option.name)) {
      commanderOption.argParser(parsePositiveInteger);
    }
    if (option.hidden) {
      commanderOption.hideHelp();
    }
    command.addOption(commanderOption);
  });
};

const applyHelpText = (command: Command, helpText?: string) => {
  if (!helpText) {
    return;
  }
  command.configureHelp({
    formatHelp: () => helpText,
  });
};

const formatSpecRows = (rows: Array<{ term: string; description: string }>) => {
  if (rows.length === 0) {
    return '';
  }

  const width = rows.reduce((max, row) => Math.max(max, row.term.length), 0);
  return rows.map((row) => `  ${`${row.term}:`.padEnd(width + 2)} ${row.description}`).join('\n');
};

const formatOptionRows = (options: OptionSpec[]) => {
  if (options.length === 0) {
    return '';
  }

  const visibleOptions = options.filter((option) => !option.hidden);
  if (visibleOptions.length === 0) {
    return '';
  }

  const width = visibleOptions.reduce((max, option) => Math.max(max, option.flags.length), 0);
  return visibleOptions
    .map((option) => `  ${option.flags.padEnd(width)}   ${option.description}`)
    .join('\n');
};

const formatCommandHelp = (spec: CommandSpec) => {
  const subcommands = (spec.subcommands ?? []).filter((subcommand) => !subcommand.hidden);
  const commandRows = subcommands.map((subcommand) => ({
    term: `${subcommand.name}${subcommand.args ? ` ${subcommand.args}` : ''}`,
    description: subcommand.description,
  }));

  const inheritedFlags = cliCommandSpec.globalOptions.filter((option) => !option.hidden);
  const commandFlags = spec.options?.filter((option) => !option.hidden) ?? [];

  if (commandRows.length === 0) {
    return [
      spec.description,
      '',
      'USAGE',
      `  axiom ${spec.name}${spec.args ? ` ${spec.args}` : ''} [flags]`,
      '',
      'FLAGS',
      formatOptionRows([...commandFlags, ...inheritedFlags]),
      '',
      'LEARN MORE',
      `  Use \`axiom ${spec.name} --help\` for more information about this command.`,
      '',
    ].join('\n');
  }

  return [
    spec.description,
    '',
    'USAGE',
    `  axiom ${spec.name} <command> [flags]`,
    '',
    'AVAILABLE COMMANDS',
    formatSpecRows(commandRows),
    '',
    'INHERITED FLAGS',
    formatOptionRows(inheritedFlags),
    '',
    'LEARN MORE',
    `  Use \`axiom ${spec.name} <command> --help\` for more information about a command.`,
    '',
  ].join('\n');
};

const notImplemented = (...args: unknown[]) => {
  const command = args[args.length - 1] as Command | undefined;
  const options = typeof command?.optsWithGlobals === 'function' ? command.optsWithGlobals() : {};
  const config = resolveCliConfig(options);

  if (config.explain) {
    const explainContext = createExplainContext();
    emitExplainToStderr(explainContext);
  }

  process.stdout.write('not implemented\n');
  process.exitCode = 2;
};

const resolveHandler = (path: string) => {
  switch (path) {
    case 'datasets list':
      return datasetList;
    case 'datasets get':
      return datasetGet;
    case 'datasets schema':
      return datasetSchema;
    case 'datasets sample':
      return datasetSample;
    case 'query':
      return queryRun;
    case 'ingest':
      return ingestRun;
    case 'monitors list':
      return monitorList;
    case 'monitors get':
      return monitorGet;
    case 'monitors history':
      return monitorHistory;
    case 'traces get':
      return traceGet;
    default:
      return notImplemented;
  }
};

const registerSubcommands = (parent: Command, spec: CommandSpec, parentPath: string) => {
  if (!spec.subcommands) {
    return;
  }

  spec.subcommands.forEach((subcommandSpec) => {
    const path = `${parentPath} ${subcommandSpec.name}`.trim();
    const subcommand = new Command(subcommandSpec.name)
      .description(subcommandSpec.description)
      .helpOption('-h, --help', 'display help for command')
      .action(resolveHandler(path));

    if (subcommandSpec.args) {
      subcommand.arguments(subcommandSpec.args);
    }

    addOptions(subcommand, subcommandSpec.options);
    if (subcommandSpec.hidden) {
      (subcommand as Command & { hidden?: boolean }).hidden = true;
    }
    applyHelpText(subcommand, subcommandSpec.help);
    parent.addCommand(subcommand);

    registerSubcommands(subcommand, subcommandSpec, path);
  });
};

export const registerCliCommands = (program: Command) => {
  cliCommandSpec.commands.forEach((spec) => {
    const command = new Command(spec.name)
      .description(spec.description)
      .helpOption('-h, --help', 'display help for command');

    if (spec.args) {
      command.arguments(spec.args);
    }

    if (spec.actionPath) {
      command.action(resolveHandler(spec.actionPath));
    }

    applyHelpText(command, formatCommandHelp(spec));
    addOptions(command, [...cliCommandSpec.globalOptions, ...(spec.options ?? [])]);
    registerSubcommands(command, spec, spec.name);

    program.addCommand(command);
  });
};
