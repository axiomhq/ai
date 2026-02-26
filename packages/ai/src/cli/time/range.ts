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

export const resolveTimeRange = (
  input: TimeRangeInput,
  _now: Date = new Date(),
  defaultSince = '30m',
  defaultUntil = '0m',
): TimeRange => {
  return {
    start: input.since ?? input.start ?? defaultSince,
    end: input.until ?? input.end ?? defaultUntil,
  };
};
