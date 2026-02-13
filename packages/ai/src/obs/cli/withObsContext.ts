import type { Command } from 'commander';
import { createExplainContext, emitExplainToStderr, type ExplainContext } from '../explain/context';
import { resolveObsConfig, type ObsConfig } from '../config/resolve';

export type ObsContext = {
  config: ObsConfig;
  explain: ExplainContext;
};

export type ObsHandler = (context: ObsContext, ...args: unknown[]) => Promise<void> | void;

export const withObsContext = (handler: ObsHandler) => async (...args: unknown[]) => {
  const command = args[args.length - 1] as Command | undefined;
  const flags = typeof command?.optsWithGlobals === 'function' ? command.optsWithGlobals() : {};
  const config = resolveObsConfig(flags);
  const explain = createExplainContext();

  await handler({ config, explain }, ...args);

  if (config.explain) {
    emitExplainToStderr(explain);
  }
};
