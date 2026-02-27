import type { Command } from 'commander';
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
import { getStdoutColumns } from '../format/tty';
import { resolveTimeRange } from '../time/range';
import {
  aplFieldRef,
  aplStringLiteral,
  requireAuth,
  resolveTraceDatasets,
  toRows,
  write,
} from './servicesCommon';

type SpanRow = {
  trace_id?: string;
  dataset?: string;
  start?: string;
  duration_ms?: number;
  service?: string;
  operation?: string;
  kind?: string;
  status?: string;
  span_id?: string;
  parent_span_id?: string;
};

type TreeRow = {
  spans: string;
  spanId: string;
};

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTimestamp = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const rawNumber = typeof value === 'bigint' ? Number(value) : value;
  if (typeof rawNumber !== 'number' || !Number.isFinite(rawNumber)) {
    return undefined;
  }

  const abs = Math.abs(rawNumber);
  let milliseconds: number;
  if (abs >= 1e18) {
    milliseconds = rawNumber / 1_000_000;
  } else if (abs >= 1e15) {
    milliseconds = rawNumber / 1_000;
  } else if (abs >= 1e12) {
    milliseconds = rawNumber;
  } else if (abs >= 1e9) {
    milliseconds = rawNumber * 1_000;
  } else {
    return undefined;
  }

  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

const durationToMillisecondsExpr = (durationField: string) => {
  const field = aplFieldRef(durationField);
  const normalized = durationField.toLowerCase();

  if (
    normalized === 'duration' ||
    normalized.endsWith('_ns') ||
    normalized.endsWith('.ns') ||
    normalized.endsWith('nanoseconds')
  ) {
    return `toreal(${field}) / 1000000`;
  }
  if (normalized.endsWith('_us') || normalized.endsWith('.us') || normalized.endsWith('microseconds')) {
    return `toreal(${field}) / 1000`;
  }
  if (normalized.endsWith('_s') || normalized.endsWith('.s') || normalized.endsWith('seconds')) {
    return `toreal(${field}) * 1000`;
  }
  return `toreal(${field})`;
};

const groupByRegion = <T extends { dataset: string; region?: string }>(datasets: T[]) => {
  const groups = new Map<string, T[]>();
  datasets.forEach((dataset) => {
    const key = dataset.region ? `region:${dataset.region}` : `dataset:${dataset.dataset}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(dataset);
      return;
    }
    groups.set(key, [dataset]);
  });
  return [...groups.values()].map((group) =>
    [...group].sort((left, right) => left.dataset.localeCompare(right.dataset)),
  );
};

const buildSourceProjection = (
  traceId: string,
  dataset: {
    dataset: string;
    fields: {
      traceIdField?: string | null;
      spanIdField?: string | null;
      parentSpanIdField?: string | null;
      serviceField?: string | null;
      spanNameField?: string | null;
      spanKindField?: string | null;
      statusField?: string | null;
      durationField?: string | null;
    };
  },
) => {
  const traceIdExpr = `tolower(tostring(${aplFieldRef(dataset.fields.traceIdField!)}))`;
  const kindExpr = dataset.fields.spanKindField ? aplFieldRef(dataset.fields.spanKindField) : '""';
  const statusExpr = dataset.fields.statusField ? aplFieldRef(dataset.fields.statusField) : '""';
  const spanIdExpr = dataset.fields.spanIdField ? aplFieldRef(dataset.fields.spanIdField) : '""';
  const parentSpanIdExpr = dataset.fields.parentSpanIdField
    ? aplFieldRef(dataset.fields.parentSpanIdField)
    : '""';
  const durationExpr = durationToMillisecondsExpr(dataset.fields.durationField ?? 'duration_ms');

  return `(${aplFieldRef(dataset.dataset)}
| where ${traceIdExpr} == ${aplStringLiteral(traceId)}
| project trace_id=${traceIdExpr}, _source=${aplStringLiteral(dataset.dataset)}, start=_time, duration_ms=${durationExpr}, service=${aplFieldRef(dataset.fields.serviceField!)}, operation=${aplFieldRef(dataset.fields.spanNameField!)}, kind=${kindExpr}, status=${statusExpr}, span_id=${spanIdExpr}, parent_span_id=${parentSpanIdExpr})`;
};

const sortByStartAndDuration = (rows: SpanRow[]) =>
  [...rows].sort((a, b) => {
    const startA = String(a.start ?? '');
    const startB = String(b.start ?? '');
    if (startA !== startB) {
      return startA.localeCompare(startB);
    }
    return Number(b.duration_ms ?? 0) - Number(a.duration_ms ?? 0);
  });

const formatDurationMs = (value: number | undefined) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0ms';
  }

  const rounded = Math.round(numeric * 100) / 100;
  return `${rounded.toFixed(2).replace(/\.?0+$/, '')}ms`;
};

const isErrorStatus = (status?: string) => Boolean(status && status.toLowerCase() === 'error');

const formatOperationLabel = (row: SpanRow) => {
  const operation = String(row.operation ?? '-');
  return isErrorStatus(row.status) ? `(!) ${operation}` : operation;
};

const buildTreeRows = (rows: SpanRow[]): TreeRow[] | null => {
  const byId = new Map<string, SpanRow>();
  for (const row of rows) {
    if (row.span_id) {
      byId.set(row.span_id, row);
    }
  }

  const hasParentLinks = rows.some((row) => row.parent_span_id && row.parent_span_id.length > 0);
  if (!hasParentLinks) {
    return null;
  }

  const children = new Map<string, SpanRow[]>();
  const roots: SpanRow[] = [];

  for (const row of rows) {
    const parentId = row.parent_span_id;
    if (!parentId || !byId.has(parentId)) {
      roots.push(row);
      continue;
    }

    const existing = children.get(parentId) ?? [];
    existing.push(row);
    children.set(parentId, existing);
  }

  if (roots.length === 0) {
    return null;
  }

  const sortedRoots = sortByStartAndDuration(roots);
  const treeRows: TreeRow[] = [];

  const visit = (row: SpanRow, prefix: string, isLast: boolean) => {
    const connector = isLast ? '\\-' : '|-';
    treeRows.push({
      spans: `${prefix}${connector}${formatDurationMs(row.duration_ms)} ${String(row.service ?? 'unknown')} ${formatOperationLabel(row)}`,
      spanId: String(row.span_id ?? '-'),
    });

    const nextRows = sortByStartAndDuration(children.get(String(row.span_id ?? '')) ?? []);
    const childPrefix = `${prefix}${isLast ? '  ' : '| '}`;
    nextRows.forEach((child, childIndex) => {
      visit(child, childPrefix, childIndex === nextRows.length - 1);
    });
  };

  sortedRoots.forEach((root, rootIndex) => {
    visit(root, '', rootIndex === sortedRoots.length - 1);
  });

  return treeRows;
};

const buildFallbackRows = (rows: SpanRow[]): TreeRow[] => {
  const sorted = sortByStartAndDuration(rows);
  if (sorted.length === 0) {
    return [];
  }

  return sorted.map((row) => ({
    spans: `-${formatDurationMs(row.duration_ms)} ${String(row.service ?? 'unknown')} ${formatOperationLabel(row)}`,
    spanId: String(row.span_id ?? '-'),
  }));
};

const truncateWithEllipsis = (value: string, maxLength: number) => {
  if (maxLength <= 0) {
    return '';
  }
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3)}...`;
};

const renderTreeRows = (rows: TreeRow[]) => {
  if (rows.length === 0) {
    return '(no spans)\n';
  }

  const headerLeft = 'spans';
  const headerRight = 'span_id';
  const rightWidth = Math.max(headerRight.length, ...rows.map((row) => row.spanId.length));
  const separator = '  ';
  const terminalWidth = getStdoutColumns();
  const leftWidth = Math.max(
    headerLeft.length,
    Math.max(20, terminalWidth - rightWidth - separator.length),
  );

  const lines = [
    `${headerLeft.padEnd(leftWidth, ' ')}${separator}${headerRight}`,
    ...rows.map((row) => {
      const left = truncateWithEllipsis(row.spans, leftWidth);
      return `${left.padEnd(leftWidth, ' ')}${separator}${row.spanId}`;
    }),
  ];

  return `${lines.join('\n')}\n`;
};

const topSpans = (rows: SpanRow[]) =>
  [...rows]
    .sort((a, b) => Number(b.duration_ms ?? 0) - Number(a.duration_ms ?? 0))
    .slice(0, 20)
    .map((row) => ({
      dataset: row.dataset ?? null,
      start: row.start ?? null,
      duration_ms: row.duration_ms ?? 0,
      service: row.service ?? null,
      operation: row.operation ?? null,
      kind: row.kind ?? null,
      status: row.status ?? null,
      span_id: row.span_id ?? null,
      parent_span_id: row.parent_span_id ?? null,
    }));

export const traceGet = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const requestedTraceId = String(args[0] ?? '').trim();
  const queryTraceId = requestedTraceId.toLowerCase();
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    dataset?: string;
    since?: string;
    until?: string;
    start?: string;
    end?: string;
  };

  const since = options.since ?? options.start;
  const until = options.until ?? options.end;
  if (!options.dataset || options.dataset.trim().length === 0) {
    throw new Error('Missing required --dataset. Example: axiom traces get <trace-id> --dataset <name> --since now-30m --until now');
  }
  if (!since || since.trim().length === 0) {
    throw new Error('Missing required --since. Example: axiom traces get <trace-id> --dataset <name> --since now-30m --until now');
  }
  if (!until || until.trim().length === 0) {
    throw new Error('Missing required --until. Example: axiom traces get <trace-id> --dataset <name> --since now-30m --until now');
  }

  const timeRange = resolveTimeRange(
    {
      since: options.since,
      until: options.until,
      start: options.start,
      end: options.end,
    },
    new Date(),
    since,
    until,
  );

  const { client, datasets } = await resolveTraceDatasets({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
    overrideDataset: options.dataset,
    requiredFields: ['traceIdField', 'serviceField', 'spanNameField'],
  });

  const datasetsByRegion = groupByRegion(datasets);
  const rows = (
    await Promise.all(
      datasetsByRegion.map(async (regionDatasets) => {
        const apl = `union ${regionDatasets
          .map((dataset) => buildSourceProjection(queryTraceId, dataset))
          .join(', ')}
| sort by start asc, duration_ms desc`;

        const queryResponse = await client.queryApl(undefined, apl, {
          startTime: timeRange.start,
          endTime: timeRange.end,
          maxBinAutoGroups: 40,
        });

        return toRows(queryResponse.data).map(
          (row): SpanRow => ({
            trace_id: typeof row.trace_id === 'string' ? row.trace_id : undefined,
            dataset: typeof row._source === 'string' ? row._source : undefined,
            start: normalizeTimestamp(row.start),
            duration_ms: toNumberOrNull(row.duration_ms) ?? undefined,
            service: typeof row.service === 'string' ? row.service : undefined,
            operation: typeof row.operation === 'string' ? row.operation : undefined,
            kind: typeof row.kind === 'string' ? row.kind : undefined,
            status: typeof row.status === 'string' ? row.status : undefined,
            span_id: typeof row.span_id === 'string' ? row.span_id : undefined,
            parent_span_id: typeof row.parent_span_id === 'string' ? row.parent_span_id : undefined,
          }),
        );
      }),
    )
  ).flat();
  const sortedRows = sortByStartAndDuration(rows);
  const resolvedTraceId = sortedRows.find((row) => row.trace_id)?.trace_id ?? requestedTraceId;

  const reconstructedTree = buildTreeRows(sortedRows);
  const treeRows = reconstructedTree ?? buildFallbackRows(sortedRows);
  const usedFallback = reconstructedTree === null;
  const topRows = topSpans(sortedRows);

  const services = Array.from(new Set(sortedRows.map((row) => row.service).filter(Boolean))).slice(0, 10);
  const start = sortedRows[0]?.start ?? null;
  const end = sortedRows[sortedRows.length - 1]?.start ?? null;
  const errorSpans = sortedRows.filter((row) => isErrorStatus(row.status)).length;
  const traceFound = sortedRows.length > 0;

  const metadata = {
    trace_id: resolvedTraceId,
    found: traceFound,
    searched_datasets: datasets.length,
    time_range: start && end ? `${start} .. ${end}` : null,
    span_count: sortedRows.length,
    services,
    error_summary: `${errorSpans}/${sortedRows.length}`,
    tree_mode: usedFallback ? 'fallback' : 'tree',
  };

  const format = resolveOutputFormat(config.format as OutputFormat, 'get', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom traces get',
      timeRange,
      meta: {
        truncated: false,
        rowsShown: topRows.length,
        rowsTotal: sortedRows.length,
        columnsShown: 9,
        columnsTotal: 9,
      },
    });
    write(
      formatJson(meta, {
        metadata,
        tree: treeRows.map((row) => ({ spans: row.spans, span_id: row.spanId })),
        top_spans: topRows,
      }),
    );
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(
      topRows,
      ['dataset', 'start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'],
      {
        format,
        maxCells: UNLIMITED_MAX_CELLS,
      },
    );
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(
      topRows,
      ['dataset', 'start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'],
      {
        format: 'csv',
        maxCells: UNLIMITED_MAX_CELLS,
        quiet: true,
      },
    );

    const header = `# Trace ${resolvedTraceId}\n- span_count: ${String(metadata.span_count)}\n- services: ${services.join(', ') || 'none'}\n- errors: ${metadata.error_summary}`;

    write(
      formatMcp(header, [
        {
          language: 'csv',
          content: csvResult.stdout.trimEnd(),
        },
        {
          language: 'json',
          content: JSON.stringify(metadata, null, 2),
        },
      ]),
    );
    return;
  }

  if (format === 'csv') {
    const result = renderTabular(
      topRows,
      ['dataset', 'start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'],
      {
        format,
        maxCells: UNLIMITED_MAX_CELLS,
        quiet: config.quiet,
      },
    );
    write(result.stdout, result.stderr);
    return;
  }

  const metadataRows = Object.entries(metadata).map(([key, value]) => ({ key, value }));
  const metadataTable = renderTabular(metadataRows, ['key', 'value'], {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });

  const treeOutput = renderTreeRows(treeRows);
  const emptyHint =
    sortedRows.length === 0
      ? `No spans found for trace ${requestedTraceId} in detected trace datasets.\n\n`
      : '';
  write(`${metadataTable.stdout}\n${emptyHint}${treeOutput}`, metadataTable.stderr);
});
