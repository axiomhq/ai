#!/usr/bin/env node
import { Command } from 'commander';
import { loadPushCommand } from './commands/push.command';
import { loadPullCommand } from './commands/pull.command';
import { loadEvalCommand } from './commands/eval.command';

// Load environment variables using @next/env
import pkg from '@next/env';
import { loadVersionCommand } from './commands/version.command';
import { registerListCommand } from './commands/list.command';
const { loadEnvConfig } = pkg;

// Load .env files from the current working directory
loadEnvConfig(process.cwd());

export const program = new Command();

program
  .name('axiom')
  .description("Axiom's CLI to manage your objects and run evals")
  .version(__SDK_VERSION__);

loadPushCommand(program);
loadPullCommand(program);
loadEvalCommand(program);
loadVersionCommand(program);
registerListCommand(program);

program.parse();
