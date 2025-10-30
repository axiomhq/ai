#!/usr/bin/env node
import { Command } from 'commander';
import { loadPushCommand } from './cli/commands/push.command';
import { loadPullCommand } from './cli/commands/pull.command';
import { loadEvalCommand } from './cli/commands/eval.command';
import { loadAuthCommand } from './cli/commands/auth.command';
import { extractOverrides } from './cli/utils/parse-flag-overrides';

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

loadAuthCommand(program);
loadPushCommand(program);
loadPullCommand(program);
loadEvalCommand(program, overrides);
loadVersionCommand(program);

// Parse cleaned argv (without --flag.* arguments)
program.parse(['node', 'axiom', ...cleanedArgv]);
