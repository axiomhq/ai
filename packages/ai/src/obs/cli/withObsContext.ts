import type { Command } from 'commander';
import { createExplainContext, emitExplainToStderr, type ExplainContext } from '../explain/context';
import { resolveObsConfig, type ObsConfig } from '../config/resolve';

export type ObsContext = {
  config: ObsConfig;
  explain: ExplainContext;
};

export type ObsHandler<TArgs extends unknown[] = unknown[]> = (
  context: ObsContext,
  ...args: TArgs
) => Promise<void> | void;

export const withObsContext = <TArgs extends unknown[]>(handler: ObsHandler<TArgs>) =>
  async (...args: TArgs) => {
  const command = args[args.length - 1] as Command | undefined;
  const flags = typeof command?.optsWithGlobals === 'function' ? command.optsWithGlobals() : {};
  const config = resolveObsConfig(flags);
  const explain = createExplainContext();

  try {
    await handler({ config, explain }, ...args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    if (!process.exitCode || process.exitCode === 0) {
      process.exitCode = 1;
    }
  } finally {
    if (config.explain) {
      emitExplainToStderr(explain);
    }
  }
};
