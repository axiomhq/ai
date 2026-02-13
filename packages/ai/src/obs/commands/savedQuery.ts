import type { Command } from 'commander';
import { createObsApiClient } from '../api/client';
import { withObsContext } from '../cli/withObsContext';
import { formatJson, formatMcp } from '../format/formatters';
import {
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  type OutputFormat,
} from '../format/output';
import { getColumnsFromRows } from '../format/shape';
import { buildJsonMeta } from '../format/meta';

type SavedQueryRecord = {
  id?: string;
  name?: string;
  description?: string | null;
  query?: string;
  apl?: string;
  dataset?: string;
};

const requireAuth = (orgId?: string, token?: string) => {
  if (!orgId || !token) {
    throw new Error('Missing Axiom credentials. Run `axiom auth login`.');
  }
};

const write = (stdout: string, stderr = '') => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

const normalizeSavedQuery = (query: SavedQueryRecord) => ({
  id: query.id ?? '',
  name: query.name ?? '',
  description: query.description ?? null,
  dataset: query.dataset ?? null,
  query: query.query ?? query.apl ?? '',
});

const toRows = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) {
    return data.filter((row): row is Record<string, unknown> => typeof row === 'object' && !!row);
  }

  if (typeof data === 'object' && data) {
    const payload = data as { matches?: unknown; rows?: unknown };
    if (Array.isArray(payload.matches)) {
      return payload.matches.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && !!row,
      );
    }
    if (Array.isArray(payload.rows)) {
      return payload.rows.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && !!row,
      );
    }
  }

  return [];
};

const renderSavedRunOutput = (params: {
  dataset: string;
  query: string;
  rows: Record<string, unknown>[];
  config: { format: string; maxCells: number; quiet: boolean };
  columnsOverride?: string;
}) => {
  const columns = getColumnsFromRows(params.rows);
  const format = resolveOutputFormat(
    params.config.format as OutputFormat,
    'query',
    columns.length > 0,
  );

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom query saved run',
      meta: {
        truncated: false,
        rowsShown: params.rows.length,
        rowsTotal: params.rows.length,
        columnsShown: columns.length,
        columnsTotal: columns.length,
      },
    });

    write(
      formatJson(
        {
          ...meta,
          dataset: params.dataset,
          apl: params.query,
        },
        { rows: params.rows },
      ),
    );
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(params.rows, columns, {
      format,
      maxCells: params.config.maxCells,
      columnsOverride: params.columnsOverride,
    });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(params.rows, columns, {
      format: 'csv',
      maxCells: params.config.maxCells,
      quiet: true,
      columnsOverride: params.columnsOverride,
    });
    const headerLines = [
      '# Saved Query Result',
      `Dataset: ${params.dataset}`,
      'APL:',
      '```apl',
      params.query,
      '```',
    ];
    if (csvResult.meta.truncated) {
      headerLines.push(
        `Truncated to ${csvResult.meta.rowsShown}/${csvResult.meta.rowsTotal} rows (max-cells=${params.config.maxCells}).`,
      );
    }

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

  const result = renderTabular(params.rows, columns, {
    format,
    maxCells: params.config.maxCells,
    quiet: params.config.quiet,
    columnsOverride: params.columnsOverride,
  });
  write(result.stdout, result.stderr);
};

export const querySavedList = withObsContext(async ({ config, explain }) => {
  requireAuth(config.orgId, config.token);

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.listSavedQueries<SavedQueryRecord[] | { saved_queries: SavedQueryRecord[] }>();
  const rawQueries = Array.isArray(response.data)
    ? response.data
    : response.data.saved_queries ?? [];

  const rows = rawQueries.map(normalizeSavedQuery);
  const columns = ['id', 'name', 'description', 'dataset'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom query saved list',
      meta: {
        truncated: false,
        rowsShown: rows.length,
        rowsTotal: rows.length,
        columnsShown: columns.length,
        columnsTotal: columns.length,
      },
    });
    write(formatJson(meta, rows));
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, { format, maxCells: config.maxCells });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(rows, columns, {
      format: 'csv',
      maxCells: config.maxCells,
      quiet: true,
    });
    write(
      formatMcp('# Saved Queries', [
        {
          language: 'csv',
          content: csvResult.stdout.trimEnd(),
        },
      ]),
    );
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});

export const querySavedGet = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);
  const id = String(args[0] ?? '');

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getSavedQuery<SavedQueryRecord>(id);
  const row = normalizeSavedQuery(response.data);
  const columns = ['id', 'name', 'description', 'dataset', 'query'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'get', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom query saved get',
      meta: {
        truncated: false,
        rowsShown: 1,
        rowsTotal: 1,
        columnsShown: columns.length,
        columnsTotal: columns.length,
      },
    });
    write(formatJson(meta, row));
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson([row], columns, { format, maxCells: config.maxCells });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular([row], columns, {
      format: 'csv',
      maxCells: config.maxCells,
      quiet: true,
    });
    write(
      formatMcp(`# Saved Query ${id}`, [
        {
          language: 'csv',
          content: csvResult.stdout.trimEnd(),
        },
      ]),
    );
    return;
  }

  const result = renderTabular([row], columns, {
    format,
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});

export const querySavedRun = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const id = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as { columns?: string; limit?: number | string };

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const savedQueryResponse = await client.getSavedQuery<SavedQueryRecord>(id);
  const saved = normalizeSavedQuery(savedQueryResponse.data);
  const savedQueryText = saved.query.trim();

  if (!saved.dataset) {
    throw new Error(`Saved query ${id} is missing dataset`);
  }
  if (!savedQueryText) {
    throw new Error(`Saved query ${id} is missing query text`);
  }

  const queryResponse = await client.queryApl(saved.dataset, savedQueryText, {
    maxBinAutoGroups: 40,
  });

  let rows = toRows(queryResponse.data);
  const limit = options.limit !== undefined ? Number(options.limit) : undefined;
  if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
    rows = rows.slice(0, limit);
  }

  renderSavedRunOutput({
    dataset: saved.dataset,
    query: savedQueryText,
    rows,
    columnsOverride: options.columns,
    config: {
      format: config.format,
      maxCells: config.maxCells,
      quiet: config.quiet,
    },
  });
});
