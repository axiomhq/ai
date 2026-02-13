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
  started_at?: string;
  duration_ms?: number | null;
  state?: string;
  triggered?: boolean;
  message?: string | null;
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

const normalizeMonitor = (monitor: MonitorRecord) => ({
  id: monitor.id ?? '',
  name: monitor.name ?? '',
  dataset: monitor.dataset ?? '',
  enabled: monitor.enabled ?? false,
  schedule: monitor.schedule ?? '',
  last_run_at: monitor.last_run_at ?? null,
  last_state: monitor.last_state ?? 'unknown',
});

const truncateMessage = (message?: string | null) => {
  if (!message) {
    return '';
  }
  if (message.length <= 22) {
    return message;
  }
  return `${message.slice(0, 19)}...`;
};

const normalizeHistory = (row: MonitorHistoryRecord) => ({
  started_at: row.started_at ?? '',
  duration_ms: row.duration_ms ?? null,
  state: row.state ?? 'unknown',
  triggered: row.triggered ?? false,
  message: truncateMessage(row.message),
});

export const monitorList = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as { limit?: number | string };
  const limit = options.limit !== undefined ? Number(options.limit) : 100;

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.listMonitors<MonitorRecord[] | { monitors: MonitorRecord[] }>();
  const monitors = Array.isArray(response.data) ? response.data : response.data.monitors ?? [];
  const rows = monitors.slice(0, limit).map(normalizeMonitor);
  const columns = ['id', 'name', 'dataset', 'enabled', 'schedule', 'last_run_at', 'last_state'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom monitor list',
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
    maxCells: config.maxCells,
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
      command: 'axiom monitor get',
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
    maxCells: config.maxCells,
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

  const response = await client.getMonitorHistory<MonitorHistoryRecord[] | { history: MonitorHistoryRecord[] }>(
    id,
    {
      start: timeRange.start,
      end: timeRange.end,
    },
  );

  const history = Array.isArray(response.data) ? response.data : response.data.history ?? [];
  const rows = history.map(normalizeHistory);
  const columns = ['started_at', 'duration_ms', 'state', 'triggered', 'message'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom monitor history',
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
    maxCells: config.maxCells,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});
