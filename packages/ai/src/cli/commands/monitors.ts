import type { Command } from 'commander';
import { createAxiomApiClient, type AxiomApiClient } from '../api/client';
import { AxiomApiError } from '../api/http';
import { withCliContext } from '../withCliContext';
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
  enabled?: boolean;
  type?: string;
  kind?: string;
  monitor_type?: string;
  dataset?: string;
  dataset_name?: string;
  datasets?: unknown;
  schedule?: string;
  frequency?: string;
  frequencyMinutes?: number;
  frequency_minutes?: number;
  cron?: string;
  notifiers?: unknown;
  notifications?: unknown;
  channels?: unknown;
  query?: unknown;
  config?: unknown;
  monitor?: unknown;
  spec?: unknown;
  definition?: unknown;
  last_run_at?: string | null;
  last_state?: string | null;
};

type MonitorHistoryRecord = {
  monitorId?: string;
  monitor_id?: string;
  id?: string;
  checkId?: string;
  check_id?: string;
  name?: string | null;
  message?: string | null;
  timestamp?: string;
  run_at?: string;
  runAt?: string;
  last_run_at?: string;
  lastRunAt?: string;
  created_at?: string;
  createdAt?: string;
  duration_ms?: number | null;
  state?: string;
  status?: string;
  triggered?: boolean;
  started_at?: string;
  startedAt?: string;
};

type MonitorHistoryResponse = MonitorHistoryRecord[] | { history: MonitorHistoryRecord[] };

type MonitorStatusSummary = {
  last_run_at: string | null;
  last_state: string;
};

const INTERNAL_HISTORY_PREFERRED_COLUMNS = [
  'run_time',
  'alert_state',
  'matching_value',
  'group_values',
  'error',
  'notified',
  'notification_failed',
  'notification_error',
  'run_id',
  'query.startTime',
  'query.endTime',
  '_time',
];

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

const normalizeState = (state: string | null | undefined) => {
  const trimmed = state?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'unknown';
};

const collectMonitorRecords = (monitor: MonitorRecord) => {
  const root = asRecord(monitor);
  if (!root) {
    return [];
  }

  const records: Record<string, unknown>[] = [root];
  const nestedCandidates = [root.config, root.monitor, root.spec, root.definition];
  nestedCandidates.forEach((candidate) => {
    const nestedRecord = asRecord(candidate);
    if (nestedRecord && !records.includes(nestedRecord)) {
      records.push(nestedRecord);
    }
  });

  return records;
};

const pickFirstStringFromRecords = (records: Record<string, unknown>[], keys: string[]) => {
  for (const record of records) {
    const value = pickString(record, keys);
    if (value) {
      return value;
    }
  }
  return '';
};

const stringifyNotifier = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  return (
    pickString(record, ['name', 'label', 'id']) ??
    pickString(record, ['type', 'kind', 'channel', 'provider'])
  );
};

const pickNotifiers = (records: Record<string, unknown>[]) => {
  const keys = ['notifiers', 'notifications', 'channels'];

  for (const record of records) {
    for (const key of keys) {
      const value = record[key];

      if (Array.isArray(value)) {
        const labels = value
          .map((entry) => stringifyNotifier(entry))
          .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
        if (labels.length > 0) {
          return labels.join(', ');
        }
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      } else if (typeof value === 'number') {
        return String(value);
      }
    }
  }

  return '';
};

const pickDatasets = (records: Record<string, unknown>[]) => {
  for (const record of records) {
    const datasets = record.datasets;
    if (Array.isArray(datasets)) {
      const names = datasets
        .filter((dataset): dataset is string => typeof dataset === 'string')
        .map((dataset) => dataset.trim())
        .filter((dataset) => dataset.length > 0);
      if (names.length > 0) {
        return names.join(', ');
      }
    } else if (typeof datasets === 'string') {
      const trimmed = datasets.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    const query = asRecord(record.query);
    const queryOptions = asRecord(query?.queryOptions);
    const queryDatasets =
      (typeof queryOptions?.datasets === 'string' && queryOptions.datasets) ||
      (typeof query?.datasets === 'string' && query.datasets);
    if (queryDatasets) {
      const trimmed = queryDatasets.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return pickFirstStringFromRecords(records, ['dataset', 'dataset_name']);
};

const pickNumber = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
};

const formatFrequencyMinutes = (minutes: number) => {
  if (Number.isInteger(minutes)) {
    return `${minutes}m`;
  }
  return `${minutes.toFixed(2).replace(/\.?0+$/, '')}m`;
};

const pickFrequency = (records: Record<string, unknown>[]) => {
  const explicit = pickFirstStringFromRecords(records, ['frequency', 'schedule', 'cron']);
  if (explicit) {
    return explicit;
  }

  for (const record of records) {
    const frequencyMinutes = pickNumber(record, ['frequencyMinutes', 'frequency_minutes']);
    if (frequencyMinutes !== undefined) {
      return formatFrequencyMinutes(frequencyMinutes);
    }
  }

  return '';
};

const normalizeMonitor = (monitor: MonitorRecord) => {
  const records = collectMonitorRecords(monitor);
  return {
    id: pickFirstStringFromRecords(records, ['id']),
    name: pickFirstStringFromRecords(records, ['name']),
    enabled: Boolean((records[0]?.enabled as boolean | undefined) ?? false),
    status: normalizeState(pickFirstStringFromRecords(records, ['last_state', 'status'])),
    recent_run:
      pickFirstStringFromRecords(records, [
        'last_run_at',
        'lastRunAt',
        'started_at',
        'startedAt',
        'timestamp',
      ]) || null,
    type: pickFirstStringFromRecords(records, ['type', 'monitor_type', 'kind']),
    dataset: pickDatasets(records),
    frequency: pickFrequency(records),
    notifiers: pickNotifiers(records),
  };
};

const normalizeMonitorHistoryRows = (payload: MonitorHistoryResponse) =>
  Array.isArray(payload) ? payload : payload.history ?? [];

const resolveHistoryTimestamp = (row: MonitorHistoryRecord) =>
  row.timestamp ??
  row.started_at ??
  row.startedAt ??
  row.run_at ??
  row.runAt ??
  row.last_run_at ??
  row.lastRunAt ??
  row.created_at ??
  row.createdAt ??
  null;

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as Record<string, unknown>;
};

const asHistoryRows = (value: unknown): MonitorHistoryRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && !!entry)
    .map((entry) => entry as MonitorHistoryRecord);
};

const pickString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const pickMonitorId = (record: Record<string, unknown>) =>
  pickString(record, ['monitorId', 'monitor_id', 'id', 'checkId', 'check_id']);

const parseTimestampMs = (value: string | null) => {
  if (!value) {
    return Number.NaN;
  }
  return Date.parse(value);
};

const pickColumnString = (column: unknown[], index: number) => {
  const value = column[index];
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const firstColumnString = (column: unknown[]) => {
  for (let index = 0; index < column.length; index += 1) {
    const value = pickColumnString(column, index);
    if (value) {
      return value;
    }
  }
  return null;
};

const collectColumnStrings = (column: unknown[]) => {
  const values: string[] = [];
  column.forEach((_, index) => {
    const value = pickColumnString(column, index);
    if (value) {
      values.push(value);
    }
  });
  return values;
};

const ALERTING_STATES = new Set(['open', 'alerting', 'triggered', 'firing', 'error', 'failed']);
const HEALTHY_STATES = new Set(['closed', 'ok', 'healthy', 'normal', 'resolved', 'success']);

const summarizeAlertStates = (states: string[]) => {
  const normalized = states.map((state) => state.trim()).filter((state) => state.length > 0);
  if (normalized.length === 0) {
    return 'unknown';
  }

  const originalByKey = new Map<string, string>();
  normalized.forEach((state) => {
    const key = state.toLowerCase();
    if (!originalByKey.has(key)) {
      originalByKey.set(key, state);
    }
  });

  for (const [key, value] of originalByKey.entries()) {
    if (ALERTING_STATES.has(key)) {
      return value;
    }
  }

  for (const [key, value] of originalByKey.entries()) {
    if (HEALTHY_STATES.has(key)) {
      return value;
    }
  }

  return normalized[0];
};

const getColumn = (columns: unknown[], index: number | undefined) => {
  if (index === undefined || index < 0 || index >= columns.length) {
    return [];
  }
  const value = columns[index];
  return Array.isArray(value) ? value : [];
};

const buildFieldIndex = (value: unknown) => {
  const index = new Map<string, number>();
  if (!Array.isArray(value)) {
    return index;
  }

  value.forEach((entry, fieldIndex) => {
    if (typeof entry === 'string' && !index.has(entry)) {
      index.set(entry, fieldIndex);
    }
  });

  return index;
};

const extractFieldNames = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const extractColumnarMonitorSummaries = (payload: unknown, monitorIds: string[]) => {
  const summaries = new Map<string, MonitorStatusSummary>();
  const requestedIds = new Set(monitorIds);

  const root = asRecord(payload);
  if (!root) {
    return summaries;
  }

  const fieldIndexes = buildFieldIndex(root.fields);
  const data = asRecord(root.data);
  if (!data || fieldIndexes.size === 0) {
    return summaries;
  }
  const timeColumnIndex = fieldIndexes.get('_time');
  const runTimeColumnIndex = fieldIndexes.get('run_time');
  const alertStateColumnIndex = fieldIndexes.get('alert_state');

  Object.entries(data).forEach(([monitorId, rawColumns]) => {
    if (!requestedIds.has(monitorId) || !Array.isArray(rawColumns)) {
      return;
    }

    const timeColumn = getColumn(rawColumns, timeColumnIndex);
    const runTimeColumn = getColumn(rawColumns, runTimeColumnIndex);
    const alertStateColumn = getColumn(rawColumns, alertStateColumnIndex);

    const rowCount = rawColumns.reduce(
      (max, column) => Math.max(max, Array.isArray(column) ? column.length : 0),
      0,
    );
    if (rowCount === 0) {
      return;
    }

    let latestTimestampMs = Number.NaN;
    let latestRunAt: string | null = null;
    let latestStates: string[] = [];

    for (let index = 0; index < rowCount; index += 1) {
      const runAt = pickColumnString(runTimeColumn, index) ?? pickColumnString(timeColumn, index);
      const state = pickColumnString(alertStateColumn, index);
      const timestampMs = parseTimestampMs(runAt);

      if (Number.isNaN(timestampMs)) {
        continue;
      }

      if (Number.isNaN(latestTimestampMs) || timestampMs > latestTimestampMs) {
        latestTimestampMs = timestampMs;
        latestRunAt = runAt;
        latestStates = state ? [state] : [];
        continue;
      }

      if (timestampMs === latestTimestampMs) {
        if (!latestRunAt) {
          latestRunAt = runAt;
        }
        if (state) {
          latestStates.push(state);
        }
      }
    }

    if (Number.isNaN(latestTimestampMs)) {
      const fallbackRunAt = firstColumnString(runTimeColumn) ?? firstColumnString(timeColumn);
      const fallbackStates = collectColumnStrings(alertStateColumn);
      const fallbackState = summarizeAlertStates(fallbackStates);

      if (fallbackRunAt || fallbackState !== 'unknown') {
        summaries.set(monitorId, {
          last_run_at: fallbackRunAt,
          last_state: fallbackState,
        });
      }
      return;
    }

    summaries.set(monitorId, {
      last_run_at: latestRunAt,
      last_state: summarizeAlertStates(latestStates),
    });
  });

  return summaries;
};

const extractInternalHistoryRows = (payload: unknown, monitorId: string) => {
  const root = asRecord(payload);
  if (!root) {
    return [];
  }

  const fields = extractFieldNames(root.fields);
  const data = asRecord(root.data);
  if (!data || fields.length === 0) {
    return [];
  }

  const rawColumns = data[monitorId];
  if (!Array.isArray(rawColumns)) {
    return [];
  }

  const rowCount = rawColumns.reduce(
    (max, column) => Math.max(max, Array.isArray(column) ? column.length : 0),
    0,
  );
  const rows: Record<string, unknown>[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row: Record<string, unknown> = {};

    fields.forEach((field, fieldIndex) => {
      const column = rawColumns[fieldIndex];
      if (!Array.isArray(column) || rowIndex >= column.length) {
        return;
      }

      const value = column[rowIndex];
      if (value === undefined || value === null || value === '') {
        return;
      }
      row[field] = value;
    });

    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }

  return rows;
};

const summarizeLatestMonitorHistory = (
  history: MonitorHistoryRecord[],
): MonitorStatusSummary | undefined => {
  if (history.length === 0) {
    return undefined;
  }

  let latestRow = history[0];
  let latestTimestampMs = parseTimestampMs(resolveHistoryTimestamp(latestRow));

  for (let index = 1; index < history.length; index += 1) {
    const row = history[index];
    const timestampMs = parseTimestampMs(resolveHistoryTimestamp(row));
    if (!Number.isNaN(timestampMs) && (Number.isNaN(latestTimestampMs) || timestampMs >= latestTimestampMs)) {
      latestRow = row;
      latestTimestampMs = timestampMs;
    }
  }

  return {
    last_run_at: resolveHistoryTimestamp(latestRow),
    last_state: normalizeState(latestRow.state ?? latestRow.status),
  };
};

const summarizeStatusRow = (record: Record<string, unknown>) => ({
  last_run_at:
    pickString(record, ['last_run_at', 'lastRunAt', 'timestamp', 'started_at', 'startedAt']) ??
    null,
  last_state: normalizeState(pickString(record, ['last_state', 'lastState', 'state', 'status'])),
});

const mergeSummaries = (
  target: Map<string, MonitorStatusSummary>,
  monitorId: string,
  next: MonitorStatusSummary,
) => {
  const current = target.get(monitorId);
  if (!current) {
    target.set(monitorId, next);
    return;
  }

  const currentTs = parseTimestampMs(current.last_run_at);
  const nextTs = parseTimestampMs(next.last_run_at);

  if (!Number.isNaN(nextTs) && (Number.isNaN(currentTs) || nextTs >= currentTs)) {
    target.set(monitorId, next);
    return;
  }

  if (Number.isNaN(currentTs) && Number.isNaN(nextTs)) {
    target.set(monitorId, {
      last_run_at: current.last_run_at ?? next.last_run_at,
      last_state: current.last_state !== 'unknown' ? current.last_state : next.last_state,
    });
  }
};

const extractBatchMonitorSummaries = (payload: unknown, monitorIds: string[]) => {
  const summaries = extractColumnarMonitorSummaries(payload, monitorIds);
  const requestedIds = new Set(monitorIds);

  const visited = new WeakSet<object>();

  const summarizeRowsById = (rows: MonitorHistoryRecord[]) => {
    const grouped = new Map<string, MonitorHistoryRecord[]>();
    rows.forEach((row) => {
      const monitorId =
        row.monitorId ?? row.monitor_id ?? row.checkId ?? row.check_id ?? row.id;
      if (!monitorId || !requestedIds.has(monitorId)) {
        return;
      }

      const existing = grouped.get(monitorId);
      if (existing) {
        existing.push(row);
        return;
      }
      grouped.set(monitorId, [row]);
    });

    grouped.forEach((group, monitorId) => {
      const summary = summarizeLatestMonitorHistory(group);
      if (summary) {
        mergeSummaries(summaries, monitorId, summary);
      }
    });
  };

  const walk = (node: unknown, hintedMonitorId?: string) => {
    if (node === null || node === undefined) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((entry) => walk(entry, hintedMonitorId));
      return;
    }

    const record = asRecord(node);
    if (!record) {
      return;
    }

    if (visited.has(record)) {
      return;
    }
    visited.add(record);

    const monitorId = hintedMonitorId ?? pickMonitorId(record);
    const hasRequestedMonitorId = Boolean(monitorId && requestedIds.has(monitorId));

    if (hasRequestedMonitorId && monitorId) {
      const summary = summarizeStatusRow(record);
      if (summary.last_run_at || summary.last_state !== 'unknown') {
        mergeSummaries(summaries, monitorId, summary);
      }
    }

    const historyKeys = ['history', 'histories', 'events', 'runs', 'checks'];
    historyKeys.forEach((key) => {
      const history = record[key];
      if (!Array.isArray(history)) {
        return;
      }

      const rows = asHistoryRows(history);
      if (hasRequestedMonitorId && monitorId) {
        const summary = summarizeLatestMonitorHistory(rows);
        if (summary) {
          mergeSummaries(summaries, monitorId, summary);
        }
        return;
      }

      summarizeRowsById(rows);
    });

    Object.entries(record).forEach(([key, value]) => {
      if (requestedIds.has(key)) {
        walk(value, key);
        return;
      }

      if (
        key === 'data' ||
        key === 'result' ||
        key === 'results' ||
        key === 'items' ||
        key === 'rows' ||
        key === 'monitors'
      ) {
        walk(value, monitorId);
        return;
      }

      if (typeof value === 'object' && value) {
        walk(value, monitorId);
      }
    });
  };

  walk(payload);

  return summaries;
};

const fetchMonitorStatusMap = async (client: AxiomApiClient, monitorIds: string[]) => {
  const uniqueIds = [...new Set(monitorIds.filter((id) => id.trim().length > 0))];
  if (uniqueIds.length === 0) {
    return new Map<string, MonitorStatusSummary>();
  }

  try {
    const batchResponse = await client.getMonitorsHistoryBatch<unknown>(uniqueIds);
    return extractBatchMonitorSummaries(batchResponse.data, uniqueIds);
  } catch {
    return new Map<string, MonitorStatusSummary>();
  }
};

const extractMonitorRows = (payload: unknown): MonitorRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is MonitorRecord => Boolean(asRecord(item)));
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const directArrayKeys = ['monitors', 'items', 'results', 'data'];
  for (const key of directArrayKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is MonitorRecord => Boolean(asRecord(item)));
    }
  }

  const nestedData = asRecord(record.data);
  if (nestedData) {
    for (const key of ['monitors', 'items', 'results']) {
      const value = nestedData[key];
      if (Array.isArray(value)) {
        return value.filter((item): item is MonitorRecord => Boolean(asRecord(item)));
      }
    }
  }

  const objectValues = Object.values(record).filter((value): value is Record<string, unknown> =>
    Boolean(asRecord(value)),
  );
  if (objectValues.length > 0) {
    const looksLikeMonitorMap = objectValues.every((value) =>
      ['id', 'name', 'enabled', 'type', 'dataset'].some((key) =>
        Object.prototype.hasOwnProperty.call(value, key),
      ),
    );

    if (looksLikeMonitorMap) {
      return objectValues as MonitorRecord[];
    }
  }

  return [];
};

const fetchMonitors = async (client: AxiomApiClient) => {
  try {
    const internalResponse = await client.listInternalMonitors<unknown>();
    return extractMonitorRows(internalResponse.data);
  } catch {
    // Fall back to public API response shape if internal endpoint is unavailable.
  }

  const response = await client.listMonitors<unknown>();
  return extractMonitorRows(response.data);
};

const mergeMonitorStatus = (
  monitor: ReturnType<typeof normalizeMonitor>,
  summary?: MonitorStatusSummary,
) => ({
  ...monitor,
  recent_run: summary?.last_run_at ?? monitor.recent_run,
  status: summary?.last_state ?? monitor.status,
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

const formatMonitorHistoryValidationError = (error: AxiomApiError) => {
  if (error.detail) {
    return `Monitor history request validation failed: ${error.detail}`;
  }
  return 'Monitor history request validation failed. Check --since/--until or --start/--end values.';
};

export const monitorList = withCliContext(async ({ config, explain }, ..._args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const monitors = await fetchMonitors(client);
  const statusById = await fetchMonitorStatusMap(
    client,
    monitors.map((monitor) => monitor.id ?? ''),
  );
  const rows = monitors.map((monitor) =>
    mergeMonitorStatus(normalizeMonitor(monitor), statusById.get(monitor.id ?? '')),
  );
  const columns = ['id', 'name', 'status', 'recent_run', 'type', 'dataset', 'frequency'];
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

export const monitorGet = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);
  const id = String(args[0] ?? '');

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const response = await client.getMonitor<MonitorRecord>(id);
  const normalized = normalizeMonitor(response.data);
  const statusById = await fetchMonitorStatusMap(client, [id, normalized.id ?? '']);
  const summary = statusById.get(id) ?? statusById.get(normalized.id ?? '');
  const row = {
    id: normalized.id || id,
    name: normalized.name,
    enabled: normalized.enabled,
    last_state: summary?.last_state ?? normalized.status,
    last_run_at: summary?.last_run_at ?? normalized.recent_run,
  };
  const columns = ['id', 'name', 'enabled', 'last_state', 'last_run_at'];
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

export const monitorHistory = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
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

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  let rows: Record<string, unknown>[];
  let columns: string[];

  try {
    const internalResponse = await client.getMonitorsHistoryBatch<unknown>([id], {
      start: timeRange.start,
      end: timeRange.end,
    });
    rows = extractInternalHistoryRows(internalResponse.data, id);
    columns = INTERNAL_HISTORY_PREFERRED_COLUMNS.filter((column) =>
      rows.some((row) => Object.prototype.hasOwnProperty.call(row, column)),
    );
  } catch (error) {
    if (error instanceof AxiomApiError && error.status === 422) {
      process.stderr.write(`${formatMonitorHistoryValidationError(error)}\n`);
      process.exitCode = 1;
      return;
    }

    let legacyResponse: { data: MonitorHistoryResponse };
    try {
      legacyResponse = await client.getMonitorHistory<MonitorHistoryResponse>(id, {
        start: timeRange.start,
        end: timeRange.end,
      });
    } catch (legacyError) {
      if (legacyError instanceof AxiomApiError && legacyError.status === 422) {
        process.stderr.write(`${formatMonitorHistoryValidationError(legacyError)}\n`);
        process.exitCode = 1;
        return;
      }
      throw legacyError;
    }

    const history = normalizeMonitorHistoryRows(legacyResponse.data);
    rows = history.map(normalizeHistory);
    const preferredColumns = [
      'checkId',
      'name',
      'state',
      'timestamp',
      'duration_ms',
      'message',
      'triggered',
    ];
    columns = preferredColumns.filter((column) =>
      rows.some((row) => Object.prototype.hasOwnProperty.call(row, column)),
    );
  }

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
