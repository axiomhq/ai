import {
  formatCsv,
  formatJson,
  formatMcp,
  formatNdjson,
  formatTable,
  type FormatMeta,
} from './formatters';
import { applyColumnsOverride, pickColumns, truncateToBudget } from './shape';
import type { TimeRangeMeta } from './meta';
import { buildJsonMeta } from './meta';
import { isStdoutTty } from './tty';

export type OutputFormat = 'auto' | 'table' | 'csv' | 'json' | 'ndjson' | 'mcp';
export type OutputKind = 'list' | 'get' | 'query';

export type OutputOptions = {
  format: OutputFormat;
  maxCells: number;
  quiet?: boolean;
  noHeader?: boolean;
  columnsOverride?: string;
};

export type RenderResult = {
  stdout: string;
  stderr: string;
  meta: FormatMeta;
};

export const resolveOutputFormat = (
  format: OutputFormat,
  kind: OutputKind,
  isTabular: boolean,
): OutputFormat => {
  if (format !== 'auto') {
    return format;
  }
  if (isStdoutTty()) {
    return 'table';
  }
  if (kind === 'list') {
    return 'ndjson';
  }
  if (kind === 'get') {
    return 'json';
  }
  return isTabular ? 'csv' : 'ndjson';
};

export const renderTabular = (
  rows: Record<string, unknown>[],
  columns: string[],
  options: OutputOptions,
): RenderResult => {
  const selectedColumns = applyColumnsOverride(columns, options.columnsOverride);
  if (options.format === 'csv') {
    const result = formatCsv(rows, selectedColumns, {
      maxCells: options.maxCells,
      quiet: options.quiet,
      noHeader: options.noHeader,
    });
    return result;
  }

  const result = formatTable(rows, selectedColumns, {
    maxCells: options.maxCells,
    quiet: options.quiet,
    noHeader: options.noHeader,
  });
  return result;
};

export const renderJson = (
  command: string,
  rows: Record<string, unknown>[],
  columns: string[],
  options: OutputOptions,
  timeRange?: TimeRangeMeta,
) => {
  const selectedColumns = applyColumnsOverride(columns, options.columnsOverride);
  const shape = truncateToBudget(rows, selectedColumns, options.maxCells);
  const shapedRows = pickColumns(shape.rows, shape.columns);
  const meta = buildJsonMeta({
    command,
    timeRange,
    meta: {
      truncated: shape.truncated,
      rowsShown: shape.rowsShown,
      rowsTotal: shape.rowsTotal,
      columnsShown: shape.columnsShown,
      columnsTotal: shape.columnsTotal,
    },
  });
  return {
    stdout: formatJson(meta, shapedRows),
    meta: shape,
  };
};

export const renderNdjson = (
  rows: Record<string, unknown>[],
  columns: string[],
  options: OutputOptions,
) => {
  const selectedColumns = applyColumnsOverride(columns, options.columnsOverride);
  const shape = truncateToBudget(rows, selectedColumns, options.maxCells);
  const shapedRows = pickColumns(shape.rows, shape.columns);
  return {
    stdout: formatNdjson(shapedRows),
    meta: shape,
  };
};

export const renderMcp = (header: string, blocks: { language: string; content: string }[]) => ({
  stdout: formatMcp(header, blocks),
});
