import { Command, Option } from 'commander';
import { obsCommandSpec, type CommandSpec, type OptionSpec } from './commandSpec';
import { createExplainContext, emitExplainToStderr } from '../explain/context';
import { resolveObsConfig } from '../config/resolve';
import { datasetGet, datasetList, datasetSample, datasetSchema } from '../commands/dataset';
import { queryRun } from '../commands/queryRun';
import { querySavedGet, querySavedList, querySavedRun } from '../commands/savedQuery';
import { monitorGet, monitorHistory, monitorList } from '../commands/monitor';
import { serviceDetect } from '../commands/serviceDetect';

const addOptions = (command: Command, options: OptionSpec[] = []) => {
  options.forEach((option) => {
    const commanderOption = new Option(option.flags, option.description);
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

const notImplemented = (...args: unknown[]) => {
  const command = args[args.length - 1] as Command | undefined;
  const options = typeof command?.optsWithGlobals === 'function' ? command.optsWithGlobals() : {};
  const config = resolveObsConfig(options);

  if (config.explain) {
    const explainContext = createExplainContext();
    emitExplainToStderr(explainContext);
  }

  process.stdout.write('not implemented\n');
  process.exitCode = 2;
};

const resolveHandler = (path: string) => {
  switch (path) {
    case 'dataset list':
      return datasetList;
    case 'dataset get':
      return datasetGet;
    case 'dataset schema':
      return datasetSchema;
    case 'dataset sample':
      return datasetSample;
    case 'query run':
      return queryRun;
    case 'query saved list':
      return querySavedList;
    case 'query saved get':
      return querySavedGet;
    case 'query saved run':
      return querySavedRun;
    case 'monitor list':
      return monitorList;
    case 'monitor get':
      return monitorGet;
    case 'monitor history':
      return monitorHistory;
    case 'service detect':
      return serviceDetect;
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
    applyHelpText(subcommand, subcommandSpec.help);
    parent.addCommand(subcommand);

    registerSubcommands(subcommand, subcommandSpec, path);
  });
};

export const registerObsCommands = (program: Command) => {
  obsCommandSpec.commands.forEach((spec) => {
    const command = new Command(spec.name)
      .description(spec.description)
      .helpOption('-h, --help', 'display help for command');

    applyHelpText(command, spec.help);
    addOptions(command, obsCommandSpec.globalOptions);
    registerSubcommands(command, spec, spec.name);

    program.addCommand(command);
  });
};
