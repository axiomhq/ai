import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliCommandSpec, type CommandSpec, type OptionSpec } from '../commandSpec';

type GenerateOptions = {
  rootDir?: string;
};

const thisFile = fileURLToPath(import.meta.url);
const defaultRoot = resolve(dirname(thisFile), '../../../');

type CommandPath = {
  path: string[];
  command: CommandSpec;
};

const walkCommands = (commands: CommandSpec[], prefix: string[] = []): CommandPath[] => {
  const rows: CommandPath[] = [];
  for (const command of commands) {
    const path = [...prefix, command.name];
    rows.push({ path, command });
    if (command.subcommands) {
      rows.push(...walkCommands(command.subcommands, path));
    }
  }
  return rows;
};

const collectOptions = (commandPath: string[], command: CommandSpec): OptionSpec[] => {
  const [noun] = commandPath;
  if (['datasets', 'ingest', 'query', 'monitors', 'traces'].includes(noun)) {
    return [...cliCommandSpec.globalOptions, ...(command.options ?? [])];
  }
  return command.options ?? [];
};

const collectTokens = () => {
  const commandPaths = walkCommands(cliCommandSpec.commands);
  const tokens = new Set<string>([
    'auth',
    'login',
    'logout',
    'status',
    'switch',
    'eval',
    'version',
    'completion',
    'bash',
    'zsh',
    'fish',
    'powershell',
  ]);

  for (const { path, command } of commandPaths) {
    for (const part of path) {
      tokens.add(part);
    }

    for (const option of collectOptions(path, command)) {
      const optionTokens = option.flags
        .split(/[,\s]+/)
        .filter((flag) => flag.startsWith('--'))
        .map((flag) => flag.replace(/<.*$/, ''));
      optionTokens.forEach((token) => tokens.add(token));
      option.choices?.forEach((choice) => tokens.add(choice));
    }
  }

  return [...tokens].sort((a, b) => a.localeCompare(b));
};

const generateBash = (tokens: string[]) => `# shellcheck shell=bash
_axiom_completion() {
  local current
  current="${'$'}{COMP_WORDS[COMP_CWORD]}"
  local words="${tokens.join(' ')}"
  COMPREPLY=( $(compgen -W "${'$'}words" -- "${'$'}current") )
}
complete -F _axiom_completion axiom
`;

const generateZsh = (tokens: string[]) => `#compdef axiom

_axiom_completion() {
  local -a words
  words=(${tokens.map((token) => `'${token}'`).join(' ')})
  _describe 'value' words
}

compdef _axiom_completion axiom
`;

const generateFish = (tokens: string[]) =>
  tokens.map((token) => `complete -c axiom -f -a '${token}'`).join('\n').concat('\n');

const generatePowerShell = (tokens: string[]) => `Register-ArgumentCompleter -Native -CommandName axiom -ScriptBlock {
  param(${'$'}wordToComplete, ${'$'}commandAst, ${'$'}cursorPosition)

  ${'$'}values = @(
${tokens.map((token) => `    '${token}'`).join(',\n')}
  )

  ${'$'}values |
    Where-Object { ${'$'}_ -like "${'$'}wordToComplete*" } |
    ForEach-Object {
      [System.Management.Automation.CompletionResult]::new(${'$'}_, ${'$'}_, 'ParameterValue', ${'$'}_)
    }
}
`;

const writeGeneratedFile = (path: string, content: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
};

export const generateArtifacts = (options: GenerateOptions = {}) => {
  const rootDir = options.rootDir ?? defaultRoot;
  const generatedDir = join(rootDir, 'generated');
  const tokens = collectTokens();

  const files: Record<string, string> = {
    [join(generatedDir, 'completions/axiom.bash')]: generateBash(tokens),
    [join(generatedDir, 'completions/axiom.zsh')]: generateZsh(tokens),
    [join(generatedDir, 'completions/axiom.fish')]: generateFish(tokens),
    [join(generatedDir, 'completions/axiom.ps1')]: generatePowerShell(tokens),
  };

  for (const [path, content] of Object.entries(files)) {
    writeGeneratedFile(path, content);
  }

  return files;
};

if (process.argv[1] === thisFile) {
  generateArtifacts();
}
