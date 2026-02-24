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
  aplFieldRef,
  aplStringLiteral,
  requireAuth,
  resolveLogsDataset,
  toRows,
  write,
} from './servicesCommon';

const buildProjection = (fields: {
  severityField: string | null;
  messageField: string | null;
  traceIdField: string | null;
}) => {
  const projection = ['_time'];

  if (fields.severityField) {
    projection.push(`severity=${aplFieldRef(fields.severityField)}`);
  }
  if (fields.messageField) {
    projection.push(`message=${aplFieldRef(fields.messageField)}`);
  }
  if (fields.traceIdField) {
    projection.push(`trace_id=${aplFieldRef(fields.traceIdField)}`);
  }

  return projection.join(', ');
};

export const serviceLogs = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const service = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    since?: string;
    until?: string;
    start?: string;
    end?: string;
    dataset?: string;
    logsDataset?: string;
  };

  const timeRange = resolveTimeRange(
    {
      since: options.since,
      until: options.until,
      start: options.start,
      end: options.end,
    },
    new Date(),
    '30m',
    '0m',
  );

  let resolvedLogs:
    | Awaited<ReturnType<typeof resolveLogsDataset>>
    | null = null;
  try {
    resolvedLogs = await resolveLogsDataset({
      url: config.url,
      orgId: config.orgId!,
      token: config.token!,
      explain,
      overrideDataset: options.logsDataset ?? options.dataset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
    return;
  }

  const { client, dataset, fields } = resolvedLogs;

  const projection = buildProjection(fields);

  const apl = `let start = datetime(${timeRange.start});
let end = datetime(${timeRange.end});
where _time >= start and _time <= end
| where ${aplFieldRef(fields.serviceField)} == ${aplStringLiteral(service)}
| project ${projection}
| sort by _time desc`;

  const queryResponse = await client.queryApl(dataset, apl, {
    startTime: timeRange.start,
    endTime: timeRange.end,
    maxBinAutoGroups: 40,
  });

  const rows = toRows(queryResponse.data);

  const columns = ['_time'];
  if (fields.severityField) {
    columns.push('severity');
  }
  if (fields.messageField) {
    columns.push('message');
  }
  if (fields.traceIdField) {
    columns.push('trace_id');
  }

  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom services logs',
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
      formatMcp(`# Service Logs: ${service}`, [
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
