import { Argument, Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Shell = 'bash' | 'zsh' | 'fish' | 'powershell';
const SUPPORTED_SHELLS: Shell[] = ['bash', 'zsh', 'fish', 'powershell'];

const currentFile = fileURLToPath(import.meta.url);
const resolvePackageRoot = () => {
  const currentDir = dirname(currentFile);
  const candidates = [resolve(currentDir, '../../../'), resolve(currentDir, '..')];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'generated/completions/axiom.bash'))) {
      return candidate;
    }
  }

  return candidates[0];
};

const packageRoot = resolvePackageRoot();

const completionFiles: Record<Shell, string> = {
  bash: resolve(packageRoot, 'generated/completions/axiom.bash'),
  zsh: resolve(packageRoot, 'generated/completions/axiom.zsh'),
  fish: resolve(packageRoot, 'generated/completions/axiom.fish'),
  powershell: resolve(packageRoot, 'generated/completions/axiom.ps1'),
};

const readCompletion = (shell: Shell) => {
  const path = completionFiles[shell];
  return readFileSync(path, 'utf8');
};

export const loadCompletionCommand = (program: Command) => {
  const command = new Command('completion')
    .description('Print shell completion script')
    .addArgument(new Argument('<shell>', 'Shell type').choices(SUPPORTED_SHELLS))
    .action((shell: Shell) => {
      process.stdout.write(readCompletion(shell));
    });

  program.addCommand(command);
};
