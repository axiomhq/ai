#!/usr/bin/env node

// Load environment variables using @next/env
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

// Load .env files from the current working directory
loadEnvConfig(process.cwd());

import { Command } from 'commander';
import { loadPushCommand } from './commands/push';
import { loadPullCommand } from './commands/pull';
import { loadRunCommand } from './commands/run';

const program = new Command();

program
  .name('axiom')
  .description("Axiom's CLI to manage your objects and run evals")
  .version('1.0.0');

loadPushCommand(program);
loadPullCommand(program);
loadRunCommand(program);

program.parse();
