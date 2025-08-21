#!/usr/bin/env node

// Load environment variables using @next/env
import pkg from '@next/env';

import { Command } from 'commander';

import { loadConfigAsync } from './config';
import { ConfigNotFoundError } from './config/errors';
import { loadPushCommand } from './commands/push.command';
import { loadPullCommand } from './commands/pull.command';
import { loadRunCommand } from './commands/eval.command';

const { loadEnvConfig } = pkg;

// Load .env files from the current working directory
loadEnvConfig(process.cwd());

const program = new Command();

program
  .name('axiom')
  .description("Axiom's CLI to manage your objects and run evals")
  .version(__SDK_VERSION__)
  .option('-c, --config <path>', 'Path to config directory or file');

program.hook('preAction', async (thisCommand) => {
  const opts = thisCommand.opts<{ config?: string }>();
  try {
    const result = await loadConfigAsync(opts.config);
    if (result.error) throw new ConfigNotFoundError();
    // @ts-ignore attach for subcommands
    thisCommand._axiomConfig = result.config;
  } catch (e) {
    if (e instanceof ConfigNotFoundError) {
      program.error(
        'Config file not found. Create axiom.config.{ts,mts,cts,js,mjs,cjs,json} or add "axiom" to package.json.',
      );
    }
    throw e;
  }
});

loadPushCommand(program);
loadPullCommand(program);
loadRunCommand(program);

program.parse();
