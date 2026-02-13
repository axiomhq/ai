import type { Command } from 'commander';
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
import { SERVICE_LOGS_APL_TEMPLATE } from '../otel/aplTemplates';
import { requireAuth, resolveLogsDataset, toRows, write } from './serviceCommon';

const expandTemplate = (template: string, replacements: Record<string, string>) => {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`\${${key}}`).join(value);
  }
  return output;
};

export const serviceLogs = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const service = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    since?: string;
    until?: string;
    start?: string;
    end?: string;
    limit?: number | string;
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
      overrideDataset: options.logsDataset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
    return;
  }

  const { client, dataset, fields } = resolvedLogs;

  const limit = options.limit !== undefined ? Number(options.limit) : 50;

  const apl = expandTemplate(SERVICE_LOGS_APL_TEMPLATE, {
    SERVICE_FIELD: fields.serviceField,
    TRACE_ID_FIELD: fields.traceIdField ?? 'null',
    SEVERITY_FIELD: fields.severityField ?? 'null',
    MESSAGE_FIELD: fields.messageField ?? 'null',
    START: timeRange.start,
    END: timeRange.end,
    SERVICE: service,
    LIMIT: String(limit),
  });

  const queryResponse = await client.queryApl(dataset, apl, {
    startTime: timeRange.start,
    endTime: timeRange.end,
    maxBinAutoGroups: 40,
  });

  let rows = toRows(queryResponse.data);
  if (Number.isFinite(limit) && limit > 0) {
    rows = rows.slice(0, limit);
  }

  const hasTraceId = rows.some((row) => row.trace_id !== undefined);
  const columns = ['_time', 'severity', 'message'];
  if (hasTraceId) {
    columns.push('trace_id');
  }

  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom service logs',
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
    maxCells: config.maxCells,
    quiet: config.quiet,
  });

  write(result.stdout, result.stderr);
});
