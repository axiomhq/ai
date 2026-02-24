import { parseDurationMs, parseRfc3339 } from './parse';
import { formatRfc3339 } from './format';

export type TimeRangeInput = {
  since?: string;
  until?: string;
  start?: string;
  end?: string;
};

export type TimeRange = {
  start: string;
  end: string;
};

const parseTimeValue = (value: string, now: Date): Date | null => {
  const durationMs = parseDurationMs(value);
  if (durationMs !== null) {
    return new Date(now.getTime() - durationMs);
  }
  return parseRfc3339(value);
};

const parseRequired = (label: string, value: string, now: Date) => {
  const parsed = parseTimeValue(value, now);
  if (!parsed) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }
  return parsed;
};

export const resolveTimeRange = (
  input: TimeRangeInput,
  now: Date = new Date(),
  defaultSince = '30m',
  defaultUntil = '0m',
): TimeRange => {
  const since = input.since ?? defaultSince;
  const until = input.until ?? defaultUntil;

  if (input.start && input.since) {
    throw new Error('Cannot use --start with --since');
  }
  if (input.end && input.until) {
    throw new Error('Cannot use --end with --until');
  }

  let startDate: Date;
  let endDate: Date;

  if (input.start) {
    startDate = parseRequired('start', input.start, now);
    endDate = input.end ? parseRequired('end', input.end, now) : now;
  } else if (input.end) {
    endDate = parseRequired('end', input.end, now);
    startDate = new Date(endDate.getTime() - parseDurationMs(defaultSince)!);
  } else {
    startDate = parseRequired('since', since, now);
    endDate = parseRequired('until', until, now);
  }

  return {
    start: formatRfc3339(startDate),
    end: formatRfc3339(endDate),
  };
};
