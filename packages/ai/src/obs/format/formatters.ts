import { getStdoutColumns } from './tty';
import { truncateToBudget, type ShapeResult } from './shape';

export type FormatOptions = {
  maxCells: number;
  noHeader?: boolean;
  quiet?: boolean;
  terminalWidth?: number;
};

export type FormatMeta = {
  truncated: boolean;
  rowsShown: number;
  rowsTotal: number;
  columnsShown: number;
  columnsTotal: number;
};

export type FormatResult = {
  stdout: string;
  stderr: string;
  meta: FormatMeta;
};

type McpBlock = {
  language: string;
  content: string;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const truncateString = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
};

const buildFooter = (meta: FormatMeta, maxCells: number) =>
  `truncated: showing ${meta.rowsShown}/${meta.rowsTotal} rows (max-cells=${maxCells}). rerun with --limit or --max-cells.`;

const buildMeta = (shape: ShapeResult<Record<string, unknown>>): FormatMeta => ({
  truncated: shape.truncated,
  rowsShown: shape.rowsShown,
  rowsTotal: shape.rowsTotal,
  columnsShown: shape.columnsShown,
  columnsTotal: shape.columnsTotal,
});

const csvEscape = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const formatTable = (
  rows: Record<string, unknown>[],
  columns: string[],
  options: FormatOptions,
): FormatResult => {
  const shape = truncateToBudget(rows, columns, options.maxCells);
  const meta = buildMeta(shape);
  const terminalWidth = options.terminalWidth ?? getStdoutColumns();
  const separatorWidth = Math.max(0, shape.columns.length - 1) * 2;
  const availableWidth = Math.max(10, terminalWidth - separatorWidth);
  const maxColumnWidth = Math.max(3, Math.floor(availableWidth / Math.max(1, shape.columns.length)));

  const columnWidths = shape.columns.map((column) => {
    const headerLength = column.length;
    const maxCell = Math.max(
      headerLength,
      ...shape.rows.map((row) => formatValue(row[column]).length),
    );
    return Math.min(Math.max(3, maxCell), maxColumnWidth);
  });

  const formatRow = (row: Record<string, unknown>) =>
    shape.columns
      .map((column, index) => {
        const raw = formatValue(row[column]);
        const truncated = truncateString(raw, columnWidths[index]);
        return truncated.padEnd(columnWidths[index], ' ');
      })
      .join('  ');

  const lines: string[] = [];
  if (!options.noHeader) {
    const header = shape.columns
      .map((column, index) => column.padEnd(columnWidths[index], ' '))
      .join('  ');
    lines.push(header);
  }

  shape.rows.forEach((row) => {
    lines.push(formatRow(row));
  });

  const stdout = lines.length ? `${lines.join('\n')}\n` : '';
  const stderr =
    shape.truncated && !options.quiet ? `${buildFooter(meta, options.maxCells)}\n` : '';

  return { stdout, stderr, meta };
};

export const formatCsv = (
  rows: Record<string, unknown>[],
  columns: string[],
  options: FormatOptions,
): FormatResult => {
  const shape = truncateToBudget(rows, columns, options.maxCells);
  const meta = buildMeta(shape);

  const lines: string[] = [];
  if (!options.noHeader) {
    lines.push(shape.columns.map(csvEscape).join(','));
  }

  shape.rows.forEach((row) => {
    const line = shape.columns.map((column) => csvEscape(formatValue(row[column]))).join(',');
    lines.push(line);
  });

  const stdout = lines.length ? `${lines.join('\n')}\n` : '';
  const stderr =
    shape.truncated && !options.quiet ? `${buildFooter(meta, options.maxCells)}\n` : '';

  return { stdout, stderr, meta };
};

export const formatJson = (meta: Record<string, unknown>, data: unknown) =>
  `${JSON.stringify({ meta, data }, null, 2)}\n`;

export const formatNdjson = (rows: Record<string, unknown>[]) => {
  if (rows.length === 0) {
    return '';
  }
  return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
};

export const formatMcp = (markdownHeader: string, blocks: McpBlock[]) => {
  const header = markdownHeader.trimEnd();
  const blockOutput = blocks
    .map((block) => {
      const body = block.content.trimEnd();
      return ['```' + block.language, body, '```'].join('\n');
    })
    .join('\n\n');

  if (!header && !blockOutput) {
    return '';
  }

  if (!header) {
    return `${blockOutput}\n`;
  }

  if (!blockOutput) {
    return `${header}\n`;
  }

  return `${header}\n\n${blockOutput}\n`;
};
