import type { FormatMeta } from './formatters';

export type TimeRangeMeta = {
  start: string;
  end: string;
};

export type MetaInput = {
  command: string;
  timeRange?: TimeRangeMeta;
  meta?: FormatMeta;
};

export const buildJsonMeta = ({ command, timeRange, meta }: MetaInput) => ({
  command,
  generated_at: new Date().toISOString(),
  truncated: meta?.truncated ?? false,
  rows_shown: meta?.rowsShown ?? 0,
  rows_total: meta?.rowsTotal ?? 0,
  time_range: timeRange,
});
