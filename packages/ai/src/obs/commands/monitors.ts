import type { Command } from 'commander';
import { createObsApiClient } from '../api/client';
import { ObsApiError } from '../api/http';
import { withObsContext } from '../cli/withObsContext';
import { formatJson, formatMcp } from '../format/formatters';
import {
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  UNLIMITED_MAX_CELLS,
  type OutputFormat,
} from '../format/output';
import { buildJsonMeta } from '../format/meta';
import { resolveTimeRange } from '../time/range';

type MonitorRecord = {
  id?: string;
  name?: string;
  dataset?: string;
  enabled?: boolean;
  schedule?: string;
  last_run_at?: string | null;
  last_state?: string | null;
};

type MonitorHistoryRecord = {
  checkId?: string;
  check_id?: string;
  name?: string | null;
  message?: string | null;
  timestamp?: string;
  duration_ms?: number | null;
  state?: string;
  triggered?: boolean;
  started_at?: string;
};

type MonitorHistoryResponse = MonitorHistoryRecord[] | { history: MonitorHistoryRecord[] };

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

const normalizeMonitor = (monitor: MonitorRecord) => ({
  id: monitor.id ?? '',
  name: monitor.name ?? '',
  dataset: monitor.dataset ?? '',
  enabled: monitor.enabled ?? false,
  schedule: monitor.schedule ?? '',
  last_run_at: monitor.last_run_at ?? null,
  last_state: monitor.last_state ?? 'unknown',
});

const normalizeHistory = (row: MonitorHistoryRecord) => {
  const normalized: Record<string, unknown> = {};
  if (row.checkId !== undefined) {
    normalized.checkId = row.checkId;
  } else if (row.check_id !== undefined) {
    normalized.checkId = row.check_id;
  }
  if (row.name !== undefined) {
    normalized.name = row.name;
  }
  if (row.state !== undefined) {
    normalized.state = row.state;
  }
  if (row.timestamp !== undefined) {
    normalized.timestamp = row.timestamp;
  } else if (row.started_at !== undefined) {
    normalized.timestamp = row.started_at;
  }
  if (row.duration_ms !== undefined) {
    normalized.duration_ms = row.duration_ms;
  }
  if (row.message !== undefined) {
    normalized.message = row.message;
  }
  if (row.triggered !== undefined) {
    normalized.triggered = row.triggered;
  }
  return normalized;
};

const formatMonitorHistoryValidationError = (error: ObsApiError) => {
  if (error.detail) {
    return `Monitor history request validation failed: ${error.detail}`;
  }
  return 'Monitor history request validation failed. Check --since/--until or --start/--end values.';
};

export const monitorList = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.listMonitors<MonitorRecord[] | { monitors: MonitorRecord[] }>();
  const monitors = Array.isArray(response.data) ? response.data : response.data.monitors ?? [];
  const rows = monitors.map(normalizeMonitor);
  const columns = ['id', 'name', 'dataset', 'enabled', 'schedule', 'last_run_at', 'last_state'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom monitors list',
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
    const result = renderNdjson(rows, columns, { format, maxCells: UNLIMITED_MAX_CELLS });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(rows, columns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });
    write(
      formatMcp('# Monitors', [
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
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});

export const monitorGet = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);
  const id = String(args[0] ?? '');

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getMonitor<MonitorRecord>(id);
  const row = normalizeMonitor(response.data);
  const columns = ['id', 'name', 'dataset', 'enabled', 'schedule', 'last_run_at', 'last_state'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'get', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom monitors get',
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
    const result = renderNdjson([row], columns, { format, maxCells: UNLIMITED_MAX_CELLS });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular([row], columns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });
    write(
      formatMcp(`# Monitor ${id}`, [
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
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});

export const monitorHistory = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const id = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    since?: string;
    until?: string;
    start?: string;
    end?: string;
  };

  const timeRange = resolveTimeRange(
    {
      since: options.since,
      until: options.until,
      start: options.start,
      end: options.end,
    },
    new Date(),
    '7d',
    '0m',
  );

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  let response: { data: MonitorHistoryResponse };
  try {
    response = await client.getMonitorHistory<MonitorHistoryResponse>(id, {
      start: timeRange.start,
      end: timeRange.end,
    });
  } catch (error) {
    if (error instanceof ObsApiError && error.status === 422) {
      process.stderr.write(`${formatMonitorHistoryValidationError(error)}\n`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const history = Array.isArray(response.data) ? response.data : response.data.history ?? [];
  const rows = history.map(normalizeHistory);
  const preferredColumns = [
    'checkId',
    'name',
    'state',
    'timestamp',
    'duration_ms',
    'message',
    'triggered',
  ];
  const columns = preferredColumns.filter((column) =>
    rows.some((row) => Object.prototype.hasOwnProperty.call(row, column)),
  );
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom monitors history',
      timeRange,
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
    const result = renderNdjson(rows, columns, { format, maxCells: UNLIMITED_MAX_CELLS });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(rows, columns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });
    write(
      formatMcp(`# Monitor ${id} History`, [
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
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});
