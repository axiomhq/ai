import { getAuthContext } from '../../cli/auth/global-auth';
import { CLI_ENV } from './env';

export type CliConfig = {
  url: string;
  orgId?: string;
  token?: string;
  format: string;
  maxCells: number;
  timeZone: string;
  noColor: boolean;
  quiet: boolean;
  explain: boolean;
};

type FlagValues = Partial<Record<keyof CliConfig, unknown>> & {
  orgId?: string;
  maxCells?: number | string;
  noColor?: boolean;
};

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return false;
};

const parseNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

export const resolveCliConfig = (
  flags: FlagValues = {},
  env: NodeJS.ProcessEnv = process.env,
  authContext = getAuthContext(),
): CliConfig => {
  const url =
    (typeof flags.url === 'string' && flags.url) ||
    env[CLI_ENV.url] ||
    authContext?.url ||
    'https://api.axiom.co';

  const orgId =
    (typeof flags.orgId === 'string' && flags.orgId) || env[CLI_ENV.orgId] || authContext?.orgId;

  const token =
    (typeof flags.token === 'string' && flags.token) || env[CLI_ENV.token] || authContext?.token;

  const format =
    (typeof flags.format === 'string' && flags.format) || env[CLI_ENV.format] || 'auto';

  const maxCells = parseNumber(flags.maxCells ?? env[CLI_ENV.maxCells], 500);

  const timeZone =
    (typeof flags.timeZone === 'string' && flags.timeZone) || env[CLI_ENV.timeZone] || 'local';

  const noColor = flags.noColor ?? parseBoolean(env.NO_COLOR);
  const quiet = parseBoolean(flags.quiet ?? env[CLI_ENV.quiet]);
  const explain = parseBoolean(flags.explain ?? env[CLI_ENV.explain]);

  return {
    url,
    orgId,
    token,
    format,
    maxCells,
    timeZone,
    noColor,
    quiet,
    explain,
  };
};
