import { Command, Option } from 'commander';
import { obsCommandSpec, type CommandSpec, type OptionSpec } from './commandSpec';
import { createExplainContext, emitExplainToStderr } from '../explain/context';

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

  if (options.explain) {
    const explainContext = createExplainContext();
    emitExplainToStderr(explainContext);
  }

  process.stdout.write('not implemented\n');
  process.exitCode = 2;
};

const registerSubcommands = (parent: Command, spec: CommandSpec) => {
  if (!spec.subcommands) {
    return;
  }

  spec.subcommands.forEach((subcommandSpec) => {
    const subcommand = new Command(subcommandSpec.name)
      .description(subcommandSpec.description)
      .helpOption('-h, --help', 'display help for command')
      .action(notImplemented);

    if (subcommandSpec.args) {
      subcommand.arguments(subcommandSpec.args);
    }

    addOptions(subcommand, subcommandSpec.options);
    applyHelpText(subcommand, subcommandSpec.help);
    parent.addCommand(subcommand);

    registerSubcommands(subcommand, subcommandSpec);
  });
};

export const registerObsCommands = (program: Command) => {
  obsCommandSpec.commands.forEach((spec) => {
    const command = new Command(spec.name)
      .description(spec.description)
      .helpOption('-h, --help', 'display help for command');

    applyHelpText(command, spec.help);
    addOptions(command, obsCommandSpec.globalOptions);
    registerSubcommands(command, spec);

    program.addCommand(command);
  });
};
