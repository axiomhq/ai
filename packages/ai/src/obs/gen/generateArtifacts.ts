import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { obsCommandSpec, type CommandSpec, type OptionSpec } from '../cli/commandSpec';

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
  if (['dataset', 'query', 'monitor', 'service', 'trace'].includes(noun)) {
    return [...obsCommandSpec.globalOptions, ...(command.options ?? [])];
  }
  return command.options ?? [];
};

const collectTokens = () => {
  const commandPaths = walkCommands(obsCommandSpec.commands);
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

const generateSkillMarkdown = () => `# Axiom Observability CLI skill

You can use the \`axiom\` CLI to investigate Axiom datasets and OpenTelemetry traces in a read-only way.

## Output mode
Prefer MCP-friendly output for analysis:
- Use \`--format mcp\` for compact Markdown plus CSV blocks.
- Use \`--format json\` or \`--format ndjson\` when you need strict machine parsing.

If a command fails due to missing datasets or fields:
1. Run: \`axiom service detect --format mcp --explain\`
2. Re-run the command with \`--dataset <name>\` (and \`--logs-dataset <name>\` for logs).

## Authentication checks
Before running queries:
- \`axiom auth status\`
If not logged in:
- \`axiom auth login\`

## Primary investigation workflows

### 1) Find what services exist
- \`axiom service list --since 30m --format mcp\`

### 2) Get a service status summary
- \`axiom service get <service> --since 30m --format mcp\`

### 3) List operations for a service
- \`axiom service operations <service> --since 30m --format mcp\`

### 4) Find recent failing traces for a service
- \`axiom service traces <service> --since 30m --format mcp\`

### 5) Inspect a trace
- \`axiom trace get <trace-id> --format mcp\`
- If you need a table of all spans:
  - \`axiom trace spans <trace-id> --format mcp\`

### 6) Use raw APL when needed
- \`axiom query run <dataset> --apl "<APL>" --format mcp --explain\`

## Commands

### dataset
- \`axiom dataset list\`
- \`axiom dataset get <name>\`
- \`axiom dataset schema <name>\`
- \`axiom dataset sample <name>\`

### query
- \`axiom query run <dataset> --apl "<APL>"\`
- \`axiom query saved list\`
- \`axiom query saved get <id>\`
- \`axiom query saved run <id>\`

### monitor
- \`axiom monitor list\`
- \`axiom monitor get <id>\`
- \`axiom monitor history <id>\`

### service (OpenTelemetry)
- \`axiom service detect\`
- \`axiom service list\`
- \`axiom service get <service>\`
- \`axiom service operations <service>\`
- \`axiom service traces <service>\`
- \`axiom service logs <service>\`

### trace (OpenTelemetry)
- \`axiom trace list\`
- \`axiom trace get <trace-id>\`
- \`axiom trace spans <trace-id>\`

## Safety and scope
All commands in this skill are read-only. Do not attempt to create, update, or delete Axiom resources via this CLI workflow.
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
    [join(generatedDir, 'skills/axiom-obs-cli.md')]: generateSkillMarkdown(),
  };

  for (const [path, content] of Object.entries(files)) {
    writeGeneratedFile(path, content);
  }

  return files;
};

if (process.argv[1] === thisFile) {
  generateArtifacts();
}
