import { readFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { createAxiomApiClient } from '../api/client';
import { withCliContext } from '../withCliContext';
import { formatJson, formatMcp } from '../format/formatters';
import {
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  UNLIMITED_MAX_CELLS,
  type OutputFormat,
} from '../format/output';
import { getColumnsFromRows } from '../format/shape';
import { buildJsonMeta } from '../format/meta';
import { toQueryRows } from './queryRows';

const readStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk).toString('utf8'));
  }
  return chunks.join('');
};

type QueryRunOptions = {
  apl?: string;
  file?: string;
  stdin?: boolean;
  maxBinAutoGroups?: number | string;
  since?: string;
  until?: string;
  start?: string;
  end?: string;
  edgeUrl?: string;
  apiToken?: string;
};

const flattenPositionalArgs = (values: unknown[]) => {
  const flattened: string[] = [];
  values.forEach((value) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && typeof item !== 'object') {
          flattened.push(String(item));
        }
      });
      return;
    }

    if (typeof value === 'object') {
      return;
    }

    flattened.push(String(value));
  });
  return flattened;
};

const resolveApl = async (
  options: Pick<QueryRunOptions, 'apl' | 'file' | 'stdin'>,
  positionalApl: string[],
): Promise<string> => {
  if (positionalApl.length > 0) {
    return positionalApl.join(' ');
  }

  if (options.apl) {
    return options.apl;
  }

  if (options.file) {
    return readFile(options.file, 'utf8');
  }

  if (options.stdin) {
    const content = await readStdin();
    if (content.trim().length === 0) {
      throw new Error('No APL provided on stdin');
    }
    return content;
  }

  throw new Error('Missing APL input. Provide a query string, --file, or --stdin.');
};

const write = (stdout: string, stderr = '') => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

const QUERY_TABLE_WIDTH_NOTE =
  'note: table values were truncated to fit terminal width. rerun with --format [csv,json,jsonl] for complete values.';
const TABLE_WIDTH_NOTE_MATCH = QUERY_TABLE_WIDTH_NOTE;
const QUERY_PROJECT_NOTE =
  'tip: use APL project to select only the fields you need (for example: | project _time, message).';

const withQueryProjectNote = (stderr: string) => {
  if (!stderr.includes(TABLE_WIDTH_NOTE_MATCH)) {
    return stderr;
  }

  const trimmed = stderr.trimEnd();
  if (trimmed.includes(QUERY_PROJECT_NOTE)) {
    return `${trimmed}\n`;
  }

  return `${trimmed}\n${QUERY_PROJECT_NOTE}\n`;
};

const renderQuerySectionsTable = (
  timeseriesRows: Record<string, unknown>[],
  timeseriesColumns: string[],
  totalsRows: Record<string, unknown>[],
  totalsColumns: string[],
  quiet = false,
) => {
  const sections: string[] = [];
  const stderrLines: string[] = [];

  if (timeseriesRows.length > 0) {
    const timeseriesResult = renderTabular(timeseriesRows, timeseriesColumns, {
      format: 'table',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet,
      widthTruncationFooter: QUERY_TABLE_WIDTH_NOTE,
    });
    const table = timeseriesResult.stdout.trimEnd();
    if (table.length > 0) {
      sections.push(`Timeseries\n${table}`);
    }
    const stderr = timeseriesResult.stderr.trimEnd();
    if (stderr.length > 0) {
      stderrLines.push(stderr);
    }
  }

  if (totalsRows.length > 0) {
    const totalsResult = renderTabular(totalsRows, totalsColumns, {
      format: 'table',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet,
      widthTruncationFooter: QUERY_TABLE_WIDTH_NOTE,
    });
    const table = totalsResult.stdout.trimEnd();
    if (table.length > 0) {
      sections.push(`Totals\n${table}`);
    }
    const stderr = totalsResult.stderr.trimEnd();
    if (stderr.length > 0) {
      stderrLines.push(stderr);
    }
  }

  if (sections.length === 0) {
    return { stdout: '', stderr: '' };
  }

  const uniqueStderr = Array.from(new Set(stderrLines));
  return {
    stdout: `${sections.join('\n\n')}\n`,
    stderr: uniqueStderr.length > 0 ? `${uniqueStderr.join('\n')}\n` : '',
  };
};

export const queryRun = withCliContext(
  async ({ config, explain }, ...args: unknown[]) => {
    const positionalArgs = args.slice(0, -1);
    const command = args[args.length - 1] as Command;
    const options = command.optsWithGlobals() as QueryRunOptions;
    const apiToken = options.apiToken?.trim();
    const token = apiToken || config.token;
    if (!token) {
      throw new Error('Missing API token. Provide --token or --api-token.');
    }
    const positionalApl = flattenPositionalArgs(positionalArgs);
    const looksLikeLegacyQueryRun =
      positionalApl[0] === 'run' && Boolean(options.apl || options.file || options.stdin);
    if (looksLikeLegacyQueryRun) {
      throw new Error('`axiom query run` was removed. Use `axiom query "<APL>"`.');
    }

    const apl = (await resolveApl(options, positionalApl)).trim();
    const maxBinAutoGroups =
      options.maxBinAutoGroups !== undefined ? Number(options.maxBinAutoGroups) : 40;

    const startTime = options.since ?? options.start;
    const endTime = options.until ?? options.end;

    const queryOptions: {
      maxBinAutoGroups: number;
      startTime?: string;
      endTime?: string;
    } = {
      maxBinAutoGroups,
      startTime,
      endTime,
    };

    const client = createAxiomApiClient({
      url: config.url,
      orgId: config.orgId,
      token,
      explain,
    });

    const response = await client.queryApl(undefined, apl, {
      ...queryOptions,
      edgeUrl: options.edgeUrl,
      apiToken,
    });
    const normalizedRows = toQueryRows(response.data);
    const rows = normalizedRows.rows;
    const timeseriesRows = normalizedRows.timeseries;
    const totalsRows = normalizedRows.totals;
    const hasTimeseriesAndTotals = timeseriesRows.length > 0 && totalsRows.length > 0;

    const columns = getColumnsFromRows(rows);
    const timeseriesColumns = getColumnsFromRows(timeseriesRows);
    const totalsColumns = getColumnsFromRows(totalsRows);
    const resolvedFormat = resolveOutputFormat(
      config.format as OutputFormat,
      'query',
      columns.length > 0,
    );
    const format = resolvedFormat;
    const timeRange = startTime && endTime ? { start: startTime, end: endTime } : undefined;

    if (format === 'json') {
      const meta = buildJsonMeta({
        command: 'axiom query',
        timeRange,
        meta: {
          truncated: false,
          rowsShown: rows.length,
          rowsTotal: rows.length,
          columnsShown: columns.length,
          columnsTotal: columns.length,
        },
      });

      write(
        formatJson(
          {
            ...meta,
            apl,
          },
          hasTimeseriesAndTotals ? { rows, timeseries: timeseriesRows, totals: totalsRows } : { rows },
        ),
      );
      return;
    }

    if (format === 'ndjson') {
      const jsonlRows = hasTimeseriesAndTotals
        ? [
            ...timeseriesRows.map((row) => ({ section: 'timeseries', row })),
            ...totalsRows.map((row) => ({ section: 'totals', row })),
          ]
        : rows;
      const jsonlColumns = getColumnsFromRows(jsonlRows);
      const result = renderNdjson(jsonlRows, jsonlColumns, {
        format,
        maxCells: UNLIMITED_MAX_CELLS,
      });
      write(result.stdout);
      return;
    }

    if (format === 'mcp') {
      const csvRows = timeseriesRows.length > 0 ? timeseriesRows : rows;
      const csvColumns = getColumnsFromRows(csvRows);
      const csvResult = renderTabular(csvRows, csvColumns, {
        format: 'csv',
        maxCells: UNLIMITED_MAX_CELLS,
        quiet: true,
      });

      const headerLines = [
        '# Query Result',
        'APL:',
        '```apl',
        apl,
        '```',
      ];

      write(
        formatMcp(headerLines.join('\n'), [
          {
            language: 'csv',
            content: csvResult.stdout.trimEnd(),
          },
        ]),
      );
      return;
    }

    if (format === 'table' && hasTimeseriesAndTotals) {
      const rendered = renderQuerySectionsTable(
        timeseriesRows,
        timeseriesColumns,
        totalsRows,
        totalsColumns,
        Boolean(config.quiet),
      );
      write(rendered.stdout, withQueryProjectNote(rendered.stderr));
      return;
    }

    const tabularRows = format === 'csv' && timeseriesRows.length > 0 ? timeseriesRows : rows;
    const tabularColumns =
      format === 'csv' && timeseriesRows.length > 0 ? timeseriesColumns : columns;
    const result = renderTabular(tabularRows, tabularColumns, {
      format: format === 'table' ? 'table' : 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: format === 'table' ? Boolean(config.quiet) : true,
      widthTruncationFooter: format === 'table' ? QUERY_TABLE_WIDTH_NOTE : undefined,
    });
    write(result.stdout, withQueryProjectNote(result.stderr));
  },
);
