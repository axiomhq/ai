#!/usr/bin/env node
import { Command } from 'commander';
import { loadEvalCommand } from './cli/commands/eval.command';
import { loadAuthCommand } from './cli/commands/auth.command';
import { extractOverrides } from './cli/utils/parse-flag-overrides';
import { setupGlobalAuth } from './cli/auth/global-auth';

// Load environment variables using @next/env
import pkg from '@next/env';
import { loadVersionCommand } from './cli/commands/version.command';
const { loadEnvConfig } = pkg;

// Load .env files from the current working directory
loadEnvConfig(process.cwd());

const { cleanedArgv, overrides } = extractOverrides(process.argv.slice(2));

export const program = new Command();

program
  .name('axiom')
  .description("Axiom's CLI to manage your objects and run evals")
  .version(__SDK_VERSION__);

// Global auth hook - runs before all commands except auth commands
program.hook('preAction', async (_, actionCommand: Command) => {
  // Skip auth setup for auth commands and version command
  // Check both the command name and parent command name for nested commands
  const commandName = actionCommand.name();
  const parentCommand = actionCommand.parent;
  const parentName = parentCommand?.name();

  if (commandName === 'auth' || parentName === 'auth' || commandName === 'version') {
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

// Parse cleaned argv (without --flag.* arguments)
program.parse(['node', 'axiom', ...cleanedArgv]);
