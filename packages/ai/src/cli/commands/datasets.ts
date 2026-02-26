import type { Command } from 'commander';
import { createAxiomApiClient } from '../api/client';
import { normalizeDataset, normalizeDatasetFields, normalizeDatasetList } from '../api/binding';
import {
  renderJson,
  renderMcp,
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  UNLIMITED_MAX_CELLS,
} from '../format/output';
import { formatCsv } from '../format/formatters';
import { withCliContext } from '../withCliContext';
import { resolveTimeRange } from '../time/range';

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

export const datasetList = withCliContext(async ({ config, explain }, _args, _command: Command) => {
  requireAuth(config.orgId, config.token);

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client
    .listInternalDatasets()
    .catch(() => client.listDatasets());
  const rows = normalizeDatasetList(response.data);
  const hasRegionColumn = rows.some((row) => Object.prototype.hasOwnProperty.call(row, 'region'));
  const columns = hasRegionColumn
    ? ['name', 'region', 'created_at', 'description']
    : ['name', 'created_at', 'description'];
  const format = resolveOutputFormat(config.format as any, 'list', true);

  if (format === 'json') {
    const result = renderJson('axiom datasets list', rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, { maxCells: UNLIMITED_MAX_CELLS, quiet: true });
    const header = buildMcpHeader('Datasets', csvResult.meta, UNLIMITED_MAX_CELLS);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});

export const datasetGet = withCliContext(async ({ config, explain }, name: string) => {
  requireAuth(config.orgId, config.token);
  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getDataset<Record<string, unknown>>(name);
  const row = normalizeDataset(response.data);
  const columns = ['name', 'description', 'created_at'];
  const format = resolveOutputFormat(config.format as any, 'get', true);

  if (format === 'json') {
    const result = renderJson('axiom datasets get', [row], columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson([row], columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv([row], columns, { maxCells: UNLIMITED_MAX_CELLS, quiet: true });
    const header = buildMcpHeader(`Dataset ${name}`, csvResult.meta, UNLIMITED_MAX_CELLS);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular([row], columns, {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});

export const datasetSchema = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);
  const name = String(args[0] ?? '');

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getDatasetFields(name);
  const rows = normalizeDatasetFields(response.data).map((field) => {
    const row: Record<string, unknown> = {
      name: field.name,
      type: field.type,
    };
    if (Object.prototype.hasOwnProperty.call(field, 'unit')) {
      row.unit = field.unit ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(field, 'description')) {
      row.description = field.description ?? null;
    }
    return row;
  });
  const columns = ['name', 'type', 'unit', 'description'].filter((column) =>
    rows.some((row) => Object.prototype.hasOwnProperty.call(row, column)),
  );
  const format = resolveOutputFormat(config.format as any, 'list', true);

  if (format === 'json') {
    const result = renderJson('axiom datasets schema', rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, { maxCells: UNLIMITED_MAX_CELLS, quiet: true });
    const header = buildMcpHeader(`Dataset ${name} schema`, csvResult.meta, UNLIMITED_MAX_CELLS);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});

export const datasetSample = withCliContext(
  async ({ config, explain }, name: string, _options: unknown, command: Command) => {
  requireAuth(config.orgId, config.token);
  const options = command.optsWithGlobals();
  const since = options.since ?? '15m';
  const sampleSize = 20;

  const timeRange = resolveTimeRange({ since }, new Date(), since, '0m');

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const apl = `limit ${sampleSize}`;
  const response = await client.queryApl<{ matches: Record<string, unknown>[] }>(name, apl, {
    startTime: timeRange.start,
    endTime: timeRange.end,
  });

  const rows = response.data.matches ?? [];
  const columns = pickSampleColumns(rows);
  const format = resolveOutputFormat(config.format as any, 'list', true);

  if (format === 'json') {
    const result = renderJson('axiom datasets sample', rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    }, timeRange);
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, { maxCells: UNLIMITED_MAX_CELLS, quiet: true });
    const header = buildMcpHeader(`Dataset ${name} sample`, csvResult.meta, UNLIMITED_MAX_CELLS);
    const output = renderMcp(header, [{ language: 'csv', content: csvResult.stdout.trimEnd() }]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
  },
);
