import type { Command } from 'commander';
import { createObsApiClient } from '../api/client';
import { renderJson, renderMcp, renderNdjson, renderTabular, resolveOutputFormat } from '../format/output';
import { formatCsv } from '../format/formatters';
import { withObsContext } from '../cli/withObsContext';
import { resolveTimeRange } from '../time/range';

type DatasetRecord = {
  name?: string;
  description?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  modified_at?: string | null;
  modifiedAt?: string | null;
};

type DatasetSchemaField = {
  field?: string;
  name?: string;
  type?: string;
  nullable?: boolean;
  description?: string | null;
};

const normalizeDataset = (dataset: DatasetRecord) => ({
  name: dataset.name ?? '',
  description: dataset.description ?? null,
  created_at: dataset.created_at ?? dataset.createdAt ?? null,
  modified_at: dataset.modified_at ?? dataset.modifiedAt ?? null,
});

const normalizeSchemaField = (field: DatasetSchemaField) => ({
  field: field.field ?? field.name ?? '',
  type: field.type ?? '',
  nullable: field.nullable ?? false,
  description: field.description ?? null,
});

const requireAuth = (orgId?: string, token?: string) => {
  if (!orgId || !token) {
    throw new Error('Missing Axiom credentials. Run `axiom auth login`.');
  }
};

const writeOutput = (stdout: string, stderr?: string) => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

const buildMcpHeader = (title: string, meta: { rowsShown: number; rowsTotal: number }, maxCells: number) => {
  const lines = [`# ${title}`, `Showing ${meta.rowsShown} rows.`];
  if (meta.rowsShown < meta.rowsTotal) {
    lines[1] = `Showing ${meta.rowsShown}/${meta.rowsTotal} rows. Truncated (max-cells=${maxCells}).`;
  }
  return lines.join('\n');
};

const pickSampleColumns = (rows: Record<string, unknown>[]) => {
  const preferred = [
    'service.name',
    'message',
    'level',
    'status',
    'method',
    'path',
    'trace_id',
  ];

  const presentFields = new Set<string>();
  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        presentFields.add(key);
      }
    });
  });

  const columns: string[] = [];
  if (presentFields.has('_time')) {
    columns.push('_time');
    presentFields.delete('_time');
  }

  preferred.forEach((field) => {
    if (presentFields.has(field) && columns.length < 7) {
      columns.push(field);
      presentFields.delete(field);
    }
  });

  const remaining = [...presentFields].sort();
  while (columns.length < 7 && remaining.length > 0) {
    const field = remaining.shift();
    if (field) {
      columns.push(field);
    }
  }

  return columns;
};

export const datasetList = withObsContext(async ({ config, explain }, _args, command: Command) => {
  requireAuth(config.orgId, config.token);
  const options = command.optsWithGlobals();
  const limit = Number(options.limit ?? 100);

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.listDatasets<DatasetRecord[] | { datasets: DatasetRecord[] }>();
  const datasets = Array.isArray(response.data)
    ? response.data
    : response.data.datasets ?? [];

  const rows = datasets.slice(0, limit).map(normalizeDataset);
  const columns = ['name', 'description', 'created_at', 'modified_at'];
  const format = resolveOutputFormat(config.format as any, 'list', true);

  if (format === 'json') {
    const result = renderJson('axiom dataset list', rows, columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, { maxCells: config.maxCells, quiet: true });
    const header = buildMcpHeader('Datasets', csvResult.meta, config.maxCells);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});

export const datasetGet = withObsContext(async ({ config, explain }, name: string) => {
  requireAuth(config.orgId, config.token);
  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getDataset<DatasetRecord>(name);
  const row = normalizeDataset(response.data);
  const columns = ['name', 'description', 'created_at', 'modified_at'];
  const format = resolveOutputFormat(config.format as any, 'get', true);

  if (format === 'json') {
    const result = renderJson('axiom dataset get', [row], columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson([row], columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv([row], columns, { maxCells: config.maxCells, quiet: true });
    const header = buildMcpHeader(`Dataset ${name}`, csvResult.meta, config.maxCells);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular([row], columns, {
    format,
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});

export const datasetSchema = withObsContext(async ({ config, explain }, name: string) => {
  requireAuth(config.orgId, config.token);
  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getDatasetSchema<DatasetSchemaField[] | { fields: DatasetSchemaField[] }>(
    name,
  );
  const fields = Array.isArray(response.data) ? response.data : response.data.fields ?? [];
  const rows = fields.map(normalizeSchemaField);
  const columns = ['field', 'type', 'nullable', 'description'];
  const format = resolveOutputFormat(config.format as any, 'list', true);

  if (format === 'json') {
    const result = renderJson('axiom dataset schema', rows, columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, { maxCells: config.maxCells, quiet: true });
    const header = buildMcpHeader(`Dataset ${name} schema`, csvResult.meta, config.maxCells);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});

export const datasetSample = withObsContext(async ({ config, explain }, name: string, command: Command) => {
  requireAuth(config.orgId, config.token);
  const options = command.optsWithGlobals();
  const limit = Number(options.limit ?? 20);
  const since = options.since ?? '15m';

  const timeRange = resolveTimeRange({ since }, new Date(), since, '0m');

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const apl = `range ${timeRange.start} to ${timeRange.end}\n| limit ${limit}`;
  const response = await client.queryApl<{ matches: Record<string, unknown>[] }>(name, apl, {
    startTime: timeRange.start,
    endTime: timeRange.end,
  });

  const rows = response.data.matches ?? [];
  const columns = pickSampleColumns(rows);
  const format = resolveOutputFormat(config.format as any, 'list', true);

  if (format === 'json') {
    const result = renderJson('axiom dataset sample', rows, columns, {
      format,
      maxCells: config.maxCells,
    }, timeRange);
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: config.maxCells,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, { maxCells: config.maxCells, quiet: true });
    const header = buildMcpHeader(`Dataset ${name} sample`, csvResult.meta, config.maxCells);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});
