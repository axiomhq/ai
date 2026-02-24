import type { Command } from 'commander';
import { createExplainContext, emitExplainToStderr, type ExplainContext } from './explain/context';
import { resolveCliConfig, type CliConfig } from './config/resolve';
import { AxiomApiError } from './api/http';

export type CliContext = {
  config: CliConfig;
  explain: ExplainContext;
};

export type CliHandler<TArgs extends unknown[] = unknown[]> = (
  context: CliContext,
  ...args: TArgs
) => Promise<void> | void;

const decodePathValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const singularize = (value: string) => {
  if (value.endsWith('ies') && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith('s') && value.length > 1) {
    return value.slice(0, -1);
  }
  return value;
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const parseNotFoundTarget = (path: string) => {
  const [pathname, query = ''] = path.split('?');

  const monitorMatch = pathname.match(/^\/v2\/monitors\/([^/]+)(?:\/history)?$/);
  if (monitorMatch) {
    return {
      resource: 'monitor',
      id: decodePathValue(monitorMatch[1]),
    };
  }

  const datasetMatch = pathname.match(/^\/v2\/datasets\/([^/]+)(?:\/fields)?$/);
  if (datasetMatch) {
    return {
      resource: 'dataset',
      id: decodePathValue(datasetMatch[1]),
    };
  }

  if (pathname === '/api/internal/monitors/history') {
    const params = new URLSearchParams(query);
    const monitorIds = params
      .get('monitorIds')
      ?.split(',')
      .map((id) => decodePathValue(id.trim()))
      .filter((id) => id.length > 0);
    if (monitorIds && monitorIds.length === 1) {
      return {
        resource: 'monitor',
        id: monitorIds[0],
      };
    }
  }

  const genericMatch = pathname.match(/^\/v[0-9]+\/([^/]+)\/([^/]+)$/);
  if (genericMatch) {
    return {
      resource: singularize(genericMatch[1]),
      id: decodePathValue(genericMatch[2]),
    };
  }

  return null;
};

const formatApiError = (error: AxiomApiError) => {
  if (error.status === 404) {
    const target = parseNotFoundTarget(error.path);
    if (target?.id) {
      return `${titleCase(target.resource)} '${target.id}' was not found.`;
    }
    if (target?.resource) {
      return `${titleCase(target.resource)} was not found.`;
    }
    return 'Requested resource was not found.';
  }

  if (error.status === 401) {
    return 'Authentication failed. Run `axiom auth login`.';
  }

  if (error.status === 403) {
    return 'Permission denied for this action.';
  }

  if (error.status === 400 || error.status === 422) {
    if (error.detail) {
      return error.detail;
    }
    return 'Request validation failed.';
  }

  if (error.status >= 500) {
    if (error.detail) {
      return `Axiom API error (${error.status}): ${error.detail}`;
    }
    return `Axiom API error (${error.status}).`;
  }

  if (error.detail) {
    return error.detail;
  }

  return `Request failed with status ${error.status}.`;
};

export const withCliContext = <TArgs extends unknown[]>(handler: CliHandler<TArgs>) =>
  async (...args: TArgs) => {
  const command = args[args.length - 1] as Command | undefined;
  const flags = typeof command?.optsWithGlobals === 'function' ? command.optsWithGlobals() : {};
  const config = resolveCliConfig(flags);
  const explain = createExplainContext();

  try {
    await handler({ config, explain }, ...args);
  } catch (error) {
    const message =
      error instanceof AxiomApiError
        ? formatApiError(error)
        : error instanceof Error
          ? error.message
          : String(error);
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
