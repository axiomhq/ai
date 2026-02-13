import { getAuthContext } from '../../cli/auth/global-auth';
import { OBS_ENV } from './env';

export type ObsConfig = {
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

type FlagValues = Partial<Record<keyof ObsConfig, unknown>> & {
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

export const resolveObsConfig = (
  flags: FlagValues = {},
  env: NodeJS.ProcessEnv = process.env,
  authContext = getAuthContext(),
): ObsConfig => {
  const url =
    (typeof flags.url === 'string' && flags.url) ||
    env[OBS_ENV.url] ||
    authContext?.url ||
    'https://api.axiom.co';

  const orgId =
    (typeof flags.orgId === 'string' && flags.orgId) || env[OBS_ENV.orgId] || authContext?.orgId;

  const token =
    (typeof flags.token === 'string' && flags.token) || env[OBS_ENV.token] || authContext?.token;

  const format =
    (typeof flags.format === 'string' && flags.format) || env[OBS_ENV.format] || 'auto';

  const maxCells = parseNumber(flags.maxCells ?? env[OBS_ENV.maxCells], 500);

  const timeZone =
    (typeof flags.timeZone === 'string' && flags.timeZone) || env[OBS_ENV.timeZone] || 'local';

  const noColor = flags.noColor ?? parseBoolean(env.NO_COLOR);
  const quiet = parseBoolean(flags.quiet ?? env[OBS_ENV.quiet]);
  const explain = parseBoolean(flags.explain ?? env[OBS_ENV.explain]);

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
