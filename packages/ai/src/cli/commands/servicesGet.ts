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
import { resolveTimeRange } from '../time/range';
import {
  SERVICE_GET_ERRORED_TRACES_APL_TEMPLATE,
  SERVICE_GET_OPERATIONS_APL_TEMPLATE,
  SERVICE_GET_RECENT_TRACES_APL_TEMPLATE,
} from '../otel/aplTemplates';
import {
  aplFieldRef,
  aplStringLiteral,
  requireAuth,
  resolveTraceDatasets,
  toRows,
  write,
} from './servicesCommon';

const expandTemplate = (template: string, replacements: Record<string, string>) => {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`\${${key}}`).join(value);
  }
  return output;
};

const durationMultiplierNs = (durationField: string) => {
  const normalized = durationField.toLowerCase();
  if (normalized.endsWith('_ms') || normalized.endsWith('.ms')) {
    return 1_000_000;
  }
  if (normalized.endsWith('_us') || normalized.endsWith('.us')) {
    return 1_000;
  }
  if (normalized.endsWith('_s') || normalized.endsWith('.s')) {
    return 1_000_000_000;
  }
  return 1;
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

const buildSourceProjection = (dataset: {
  dataset: string;
  fields: {
    serviceField?: string | null;
    spanNameField?: string | null;
    traceIdField?: string | null;
    statusField?: string | null;
    durationField?: string | null;
  };
}) => {
  const statusExpr = dataset.fields.statusField ? aplFieldRef(dataset.fields.statusField) : '""';
  const durationExpr = `toreal(${aplFieldRef(dataset.fields.durationField!)}) * ${durationMultiplierNs(dataset.fields.durationField!)}`;
  return `(${aplFieldRef(dataset.dataset)} | project service=${aplFieldRef(dataset.fields.serviceField!)}, operation=${aplFieldRef(dataset.fields.spanNameField!)}, trace_id=${aplFieldRef(dataset.fields.traceIdField!)}, __status=${statusExpr}, __duration_ns=${durationExpr})`;
};

const readDatasetNames = (payload: unknown) => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }
  const datasetNames = (payload as { datasetNames?: unknown }).datasetNames;
  if (!Array.isArray(datasetNames)) {
    return [];
  }
  return datasetNames.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
};

const mapSourceToDataset = (source: unknown, datasetNames: string[], fallback: string) => {
  if (typeof source !== 'string' || source.length === 0) {
    return fallback;
  }
  if (datasetNames.includes(source)) {
    return source;
  }
  if (/^\d+$/.test(source)) {
    const index = Number(source);
    if (Number.isSafeInteger(index) && index >= 0 && index < datasetNames.length) {
      return datasetNames[index];
    }
  }
  return source;
};

const toNumberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTimestamp = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const rawNumber = typeof value === 'bigint' ? Number(value) : value;
  if (typeof rawNumber !== 'number' || !Number.isFinite(rawNumber)) {
    return null;
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
    return null;
  }

  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const roundToTwoDecimals = (value: number) => Number(value.toFixed(2));

type ServiceOperationRow = {
  dataset: string;
  operation: string;
  total: number;
  errored: number;
  error_rate: number;
  avg_duration_ns: number | null;
};

type ServiceTraceRow = {
  dataset: string;
  trace_id: string;
  started_at: string | null;
  duration_ns: number | null;
  span_count: number;
  errored_spans: number;
  error: boolean;
};

const hasOperation = (row: Record<string, unknown>) => {
  const operation = row.operation;
  return typeof operation === 'string' && operation.trim().length > 0;
};

const hasTraceId = (row: Record<string, unknown>) => {
  const traceId = row.trace_id;
  return typeof traceId === 'string' && traceId.trim().length > 0;
};

const aggregateOperations = (rows: ServiceOperationRow[]) => {
  const byOperation = new Map<
    string,
    {
      dataset: string;
      operation: string;
      total: number;
      errored: number;
      weightedDurationNs: number;
      durationWeight: number;
    }
  >();

  rows.forEach((row) => {
    const key = `${row.dataset}\u0000${row.operation}`;
    const existing = byOperation.get(key) ?? {
      dataset: row.dataset,
      operation: row.operation,
      total: 0,
      errored: 0,
      weightedDurationNs: 0,
      durationWeight: 0,
    };

    existing.total += row.total;
    existing.errored += row.errored;
    if (row.avg_duration_ns !== null && row.total > 0) {
      existing.weightedDurationNs += row.avg_duration_ns * row.total;
      existing.durationWeight += row.total;
    }

    byOperation.set(key, existing);
  });

  return [...byOperation.values()].map((aggregate) => ({
    dataset: aggregate.dataset,
    operation: aggregate.operation,
    total: aggregate.total,
    errored: aggregate.errored,
    error_rate: aggregate.total > 0 ? roundToTwoDecimals(aggregate.errored / aggregate.total) : 0,
    avg_duration_ns:
      aggregate.durationWeight > 0 ? aggregate.weightedDurationNs / aggregate.durationWeight : null,
  }));
};

const sortOperations = (rows: ServiceOperationRow[]) =>
  [...rows].sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }
    if (right.errored !== left.errored) {
      return right.errored - left.errored;
    }
    const datasetCompare = left.dataset.localeCompare(right.dataset);
    if (datasetCompare !== 0) {
      return datasetCompare;
    }
    return left.operation.localeCompare(right.operation);
  });

const sortTraceRows = (rows: ServiceTraceRow[]) =>
  [...rows].sort((left, right) => {
    const startedAtCompare = String(right.started_at ?? '').localeCompare(String(left.started_at ?? ''));
    if (startedAtCompare !== 0) {
      return startedAtCompare;
    }
    if (right.errored_spans !== left.errored_spans) {
      return right.errored_spans - left.errored_spans;
    }
    return left.trace_id.localeCompare(right.trace_id);
  });

const trimFraction = (value: number) => value.toFixed(2).replace(/\.?0+$/, '');

const formatDurationNs = (value: unknown) => {
  const ns = Number(value);
  if (!Number.isFinite(ns)) {
    return 'n/a';
  }

  const abs = Math.abs(ns);
  if (abs >= 60 * 1_000_000_000) {
    return `${trimFraction(ns / (60 * 1_000_000_000))}m`;
  }
  if (abs >= 1_000_000_000) {
    return `${trimFraction(ns / 1_000_000_000)}s`;
  }
  if (abs >= 1_000_000) {
    return `${trimFraction(ns / 1_000_000)}ms`;
  }
  if (abs >= 1_000) {
    return `${trimFraction(ns / 1_000)}us`;
  }
  return `${trimFraction(ns)}ns`;
};

const buildServiceSummary = (
  service: string,
  timeRange: { start: string; end: string },
  operations: ServiceOperationRow[],
  operation?: string,
) => {
  const totals = operations.reduce(
    (aggregate, row) => {
      aggregate.spans += row.total;
      aggregate.errorSpans += row.errored;
      if (row.avg_duration_ns !== null && row.total > 0) {
        aggregate.weightedDurationNs += row.avg_duration_ns * row.total;
        aggregate.durationWeight += row.total;
      }
      return aggregate;
    },
    { spans: 0, errorSpans: 0, weightedDurationNs: 0, durationWeight: 0 },
  );

  const topOperation = operations[0]?.operation ?? null;
  const worstOperation = [...operations].sort((left, right) => {
    if (right.error_rate !== left.error_rate) {
      return right.error_rate - left.error_rate;
    }
    if (right.errored !== left.errored) {
      return right.errored - left.errored;
    }
    return right.total - left.total;
  })[0]?.operation ?? null;

  const datasets = [...new Set(operations.map((row) => row.dataset))].sort((left, right) =>
    left.localeCompare(right),
  );

  return {
    service,
    ...(operation ? { operation } : {}),
    time_range: `${timeRange.start} .. ${timeRange.end}`,
    spans: totals.spans,
    error_spans: totals.errorSpans,
    error_rate: totals.spans > 0 ? roundToTwoDecimals(totals.errorSpans / totals.spans) : null,
    avg_duration_ns: totals.durationWeight > 0 ? totals.weightedDurationNs / totals.durationWeight : null,
    dataset_count: datasets.length,
    operation_count: operations.length,
    datasets,
    top_operation: topOperation,
    worst_operation: worstOperation,
  };
};

const toOperationTableRows = (rows: ServiceOperationRow[], includeOperation: boolean) =>
  rows.map((row) => ({
    dataset: row.dataset,
    ...(includeOperation ? { operation: row.operation } : {}),
    total: row.total,
    errored: row.errored,
    error_rate: row.error_rate,
    avg_duration: formatDurationNs(row.avg_duration_ns),
  }));

const renderTraceDetailRows = (rows: ServiceTraceRow[]) => {
  if (rows.length === 0) {
    return '(none)\n';
  }

  return `${rows
    .map((row, index) =>
      [
        `[${String(index + 1)}] trace_id: ${row.trace_id}`,
        `    dataset: ${row.dataset}  started_at: ${row.started_at ?? 'n/a'}  span_count: ${String(row.span_count)}  errored_spans: ${String(row.errored_spans)}  error: ${String(row.error)}  duration: ${formatDurationNs(row.duration_ns)}`,
      ].join('\n'),
    )
    .join('\n')}\n`;
};

export const serviceGet = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const command = args[args.length - 1] as Command;
  const positionalArgs = args.slice(0, -1);
  const service = String(positionalArgs[0] ?? '');
  const operation = positionalArgs[1] !== undefined ? String(positionalArgs[1]) : undefined;
  const options = command.optsWithGlobals() as {
    dataset?: string;
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
    'now-30m',
    'now',
  );

  const { client, datasets } = await resolveTraceDatasets({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
    overrideDataset: options.dataset,
    requiredFields: ['serviceField', 'spanNameField', 'traceIdField', 'durationField'],
  });

  const datasetsByRegion = groupByRegion(datasets);

  const queryOperationsByRegion = async () => {
    return (
      await Promise.all(
        datasetsByRegion.map(async (regionDatasets) => {
          const apl = expandTemplate(SERVICE_GET_OPERATIONS_APL_TEMPLATE, {
            UNION_SOURCES: regionDatasets.map(buildSourceProjection).join(', '),
            SERVICE: aplStringLiteral(service),
            OPERATION_FILTER: operation ? `| where operation == ${aplStringLiteral(operation)}` : '',
          });

          const queryResponse = await client.queryApl(undefined, apl, {
            startTime: timeRange.start,
            endTime: timeRange.end,
            maxBinAutoGroups: 40,
          });

          const responseDatasetNames = readDatasetNames(queryResponse.data);
          const datasetNames = [
            ...new Set([...regionDatasets.map((entry) => entry.dataset), ...responseDatasetNames]),
          ];
          const fallbackDataset = regionDatasets[0]?.dataset ?? '';

          return toRows(queryResponse.data)
            .filter(hasOperation)
            .map(
              (row): ServiceOperationRow => ({
                dataset: mapSourceToDataset(row._source, datasetNames, fallbackDataset),
                operation: String(row.operation ?? ''),
                total: toNumberOrZero(row.total),
                errored: toNumberOrZero(row.errored),
                error_rate: toNumberOrZero(row.error_rate),
                avg_duration_ns: toNumberOrNull(row.avg_duration_ns),
              }),
            );
        }),
      )
    ).flat();
  };

  const queryTracesByRegion = async (template: string) => {
    return (
      await Promise.all(
        datasetsByRegion.map(async (regionDatasets) => {
          const apl = expandTemplate(template, {
            UNION_SOURCES: regionDatasets.map(buildSourceProjection).join(', '),
            SERVICE: aplStringLiteral(service),
            OPERATION: aplStringLiteral(operation!),
          });

          const queryResponse = await client.queryApl(undefined, apl, {
            startTime: timeRange.start,
            endTime: timeRange.end,
            maxBinAutoGroups: 40,
          });

          const responseDatasetNames = readDatasetNames(queryResponse.data);
          const datasetNames = [
            ...new Set([...regionDatasets.map((entry) => entry.dataset), ...responseDatasetNames]),
          ];
          const fallbackDataset = regionDatasets[0]?.dataset ?? '';

          return toRows(queryResponse.data)
            .filter(hasTraceId)
            .map(
              (row): ServiceTraceRow => ({
                dataset: mapSourceToDataset(row._source, datasetNames, fallbackDataset),
                trace_id: String(row.trace_id ?? ''),
                started_at: normalizeTimestamp(row.started_at),
                duration_ns: toNumberOrNull(row.duration_ns),
                span_count: toNumberOrZero(row.span_count),
                errored_spans: toNumberOrZero(row.errored_spans),
                error: Boolean(row.error),
              }),
            );
        }),
      )
    ).flat();
  };

  const operationRows = sortOperations(aggregateOperations(await queryOperationsByRegion()));
  const summary = buildServiceSummary(service, timeRange, operationRows, operation);
  const format = resolveOutputFormat(config.format as OutputFormat, 'get', true);

  if (!operation) {
    const columns = ['dataset', 'operation', 'total', 'errored', 'error_rate', 'avg_duration_ns'];
    const tableColumns = ['dataset', 'operation', 'total', 'errored', 'error_rate', 'avg_duration'];
    const tableRows = toOperationTableRows(operationRows, true);

    if (format === 'json') {
      const meta = buildJsonMeta({
        command: 'axiom services get',
        timeRange,
        meta: {
          truncated: false,
          rowsShown: operationRows.length,
          rowsTotal: operationRows.length,
          columnsShown: columns.length,
          columnsTotal: columns.length,
        },
      });

      write(formatJson(meta, { summary, operations: operationRows }));
      return;
    }

    if (format === 'ndjson') {
      const result = renderNdjson(operationRows, columns, {
        format,
        maxCells: UNLIMITED_MAX_CELLS,
      });
      write(result.stdout);
      return;
    }

    if (format === 'mcp') {
      const operationCsv = renderTabular(operationRows, columns, {
        format: 'csv',
        maxCells: UNLIMITED_MAX_CELLS,
        quiet: true,
      });

      const header = `# Service ${service}
- spans: ${String(summary.spans)}
- error_rate: ${String(summary.error_rate ?? 'n/a')}
- avg_duration: ${formatDurationNs(summary.avg_duration_ns)}`;

      write(
        formatMcp(header, [
          {
            language: 'csv',
            content: operationCsv.stdout.trimEnd(),
          },
        ]),
      );
      return;
    }

    const summaryRows = Object.entries(summary).map(([key, value]) => ({ key, value }));
    const summaryResult = renderTabular(summaryRows, ['key', 'value'], {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: config.quiet,
    });

    const operationsResult = renderTabular(
      format === 'table' ? tableRows : operationRows,
      format === 'table' ? tableColumns : columns,
      {
        format,
        maxCells: UNLIMITED_MAX_CELLS,
        quiet: config.quiet,
      },
    );

    write(`${summaryResult.stdout}\n${operationsResult.stdout}`, `${summaryResult.stderr}${operationsResult.stderr}`);
    return;
  }

  const recentTraceRows = sortTraceRows(await queryTracesByRegion(SERVICE_GET_RECENT_TRACES_APL_TEMPLATE)).slice(
    0,
    5,
  );
  const erroredTraceRows = sortTraceRows(
    await queryTracesByRegion(SERVICE_GET_ERRORED_TRACES_APL_TEMPLATE),
  ).slice(0, 5);

  const traceColumns = [
    'dataset',
    'trace_id',
    'started_at',
    'span_count',
    'errored_spans',
    'error',
    'duration_ns',
  ];
  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom services get',
      timeRange,
      meta: {
        truncated: false,
        rowsShown: recentTraceRows.length + erroredTraceRows.length,
        rowsTotal: recentTraceRows.length + erroredTraceRows.length,
        columnsShown: traceColumns.length,
        columnsTotal: traceColumns.length,
      },
    });

    write(
      formatJson(meta, {
        summary,
        recent_traces: recentTraceRows,
        errored_traces: erroredTraceRows,
      }),
    );
    return;
  }

  if (format === 'ndjson' || format === 'csv') {
    const mergedRows = [
      ...recentTraceRows.map((row) => ({ group: 'recent', ...row })),
      ...erroredTraceRows.map((row) => ({ group: 'errored', ...row })),
    ];
    const mergedColumns = ['group', ...traceColumns];

    if (format === 'ndjson') {
      const result = renderNdjson(mergedRows, mergedColumns, {
        format,
        maxCells: UNLIMITED_MAX_CELLS,
      });
      write(result.stdout);
      return;
    }

    const result = renderTabular(mergedRows, mergedColumns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: config.quiet,
    });
    write(result.stdout, result.stderr);
    return;
  }

  if (format === 'mcp') {
    const recentCsv = renderTabular(recentTraceRows, traceColumns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });
    const erroredCsv = renderTabular(erroredTraceRows, traceColumns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });

    const header = `# Service ${service} / ${operation}
- spans: ${String(summary.spans)}
- error_rate: ${String(summary.error_rate ?? 'n/a')}
- avg_duration: ${formatDurationNs(summary.avg_duration_ns)}
- recent_traces: ${String(recentTraceRows.length)}
- recent_errored_traces: ${String(erroredTraceRows.length)}

## Recent traces
(first CSV block)

## Recent errored traces
(second CSV block)`;

    write(
      formatMcp(header, [
        {
          language: 'csv',
          content: recentCsv.stdout.trimEnd(),
        },
        {
          language: 'csv',
          content: erroredCsv.stdout.trimEnd(),
        },
      ]),
    );
    return;
  }

  const summaryRows = Object.entries(summary).map(([key, value]) => ({ key, value }));
  const summaryResult = renderTabular(summaryRows, ['key', 'value'], {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  const recentDetails = renderTraceDetailRows(recentTraceRows);
  const erroredDetails = renderTraceDetailRows(erroredTraceRows);

  write(
    `${summaryResult.stdout}\nRecent traces\n${recentDetails}\nRecent errored traces\n${erroredDetails}`,
    summaryResult.stderr,
  );
});
