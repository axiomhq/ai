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
import { TRACE_LIST_APL_TEMPLATE } from '../otel/aplTemplates';
import { requireAuth, resolveTraceDataset, toRows, write } from './serviceCommon';

const expandTemplate = (template: string, replacements: Record<string, string>) => {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`\${${key}}`).join(value);
  }
  return output;
};

const sortRows = (rows: Record<string, unknown>[]) =>
  [...rows].sort((a, b) => {
    const errorA = Number(a.error ?? 0);
    const errorB = Number(b.error ?? 0);
    if (errorB !== errorA) {
      return errorB - errorA;
    }
    return String(b.started_at ?? '').localeCompare(String(a.started_at ?? ''));
  });

export const traceList = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    dataset?: string;
    service?: string;
    operation?: string;
    status?: 'ok' | 'error' | 'unset';
    since?: string;
    until?: string;
    start?: string;
    end?: string;
    limit?: number | string;
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

  const { client, dataset, fields } = await resolveTraceDataset({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
    overrideDataset: options.dataset,
    requiredFields: ['traceIdField', 'spanNameField', 'serviceField'],
  });

  const statusField = fields.statusField;
  const durationField = fields.durationField ?? 'duration_ms';

  const filterClauses = [`where _time >= datetime(${timeRange.start}) and _time <= datetime(${timeRange.end})`];
  if (options.service) {
    filterClauses.push(`where ${fields.serviceField!} == "${options.service}"`);
  }
  if (options.operation) {
    filterClauses.push(`where ${fields.spanNameField!} == "${options.operation}"`);
  }
  if (options.status === 'error' && statusField) {
    filterClauses.push(`where ${statusField} == "error"`);
  }
  if (options.status === 'ok' && statusField) {
    filterClauses.push(`where ${statusField} == "ok"`);
  }
  if (options.status === 'unset' && statusField) {
    filterClauses.push(`where isempty(${statusField})`);
  }

  const errorExpression = statusField
    ? `${statusField} == "error" or toint(http.status_code) >= 500`
    : 'toint(http.status_code) >= 500';

  const apl = expandTemplate(TRACE_LIST_APL_TEMPLATE, {
    FILTERS: filterClauses.join('\n| '),
    TRACE_ID_FIELD: fields.traceIdField!,
    SPAN_NAME_FIELD: fields.spanNameField!,
    DURATION_FIELD: durationField,
    ERROR_EXPR: errorExpression,
    START: timeRange.start,
    END: timeRange.end,
  });

  const queryResponse = await client.queryApl(dataset, apl, {
    startTime: timeRange.start,
    endTime: timeRange.end,
    maxBinAutoGroups: 40,
  });

  const limit = options.limit !== undefined ? Number(options.limit) : 20;
  let rows = sortRows(toRows(queryResponse.data));
  if (Number.isFinite(limit) && limit > 0) {
    rows = rows.slice(0, limit);
  }

  const columns = ['trace_id', 'root_operation', 'started_at', 'duration_ms', 'span_count', 'error'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom trace list',
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
      formatMcp('# Trace Search', [
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
