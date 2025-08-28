#!/usr/bin/env node
import { Command } from 'commander';
import { loadPushCommand } from './cli/commands/push.command';
import { loadPullCommand } from './cli/commands/pull.command';
import { loadEvalCommand } from './cli/commands/eval.command';

// Load environment variables using @next/env
import pkg from '@next/env';
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
export const evalcmd = loadEvalCommand(program);

program.parse();
