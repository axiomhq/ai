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
import { TRACE_LIST_APL_TEMPLATE } from '../otel/aplTemplates';
import {
  aplFieldRef,
  aplStringLiteral,
  requireAuth,
  resolveTraceDataset,
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

const hasTraceId = (row: Record<string, unknown>) =>
  typeof row.trace_id === 'string' && row.trace_id.trim().length > 0;

const sortRows = (rows: Record<string, unknown>[]) =>
  [...rows].sort((a, b) => {
    const errorA = Number(a.error ?? 0);
    const errorB = Number(b.error ?? 0);
    if (errorB !== errorA) {
      return errorB - errorA;
    }
    return String(b.started_at ?? '').localeCompare(String(a.started_at ?? ''));
  });

export const traceList = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
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

  const filterClauses: string[] = [];
  if (options.service) {
    filterClauses.push(`where ${aplFieldRef(fields.serviceField!)} == ${aplStringLiteral(options.service)}`);
  }
  if (options.operation) {
    filterClauses.push(`where ${aplFieldRef(fields.spanNameField!)} == ${aplStringLiteral(options.operation)}`);
  }
  if (options.status === 'error' && statusField) {
    filterClauses.push(`where ${aplFieldRef(statusField)} == "error"`);
  }
  if (options.status === 'ok' && statusField) {
    filterClauses.push(`where ${aplFieldRef(statusField)} == "ok"`);
  }
  if (options.status === 'unset' && statusField) {
    filterClauses.push(`where isempty(${aplFieldRef(statusField)})`);
  }

  const errorExpression = statusField
    ? `${aplFieldRef(statusField)} == "error"`
    : '0';

  const apl = expandTemplate(TRACE_LIST_APL_TEMPLATE, {
    FILTERS: filterClauses.length > 0 ? `${filterClauses.join('\n| ')}\n| ` : '',
    TRACE_ID_FIELD: aplFieldRef(fields.traceIdField!),
    SPAN_NAME_FIELD: aplFieldRef(fields.spanNameField!),
    DURATION_FIELD: aplFieldRef(durationField),
    ERROR_EXPR: errorExpression,
  });

  const queryResponse = await client.queryApl(dataset, apl, {
    startTime: timeRange.start,
    endTime: timeRange.end,
    maxBinAutoGroups: 40,
  });

  let rows = sortRows(toRows(queryResponse.data).filter(hasTraceId));

  const columns = ['trace_id', 'root_operation', 'started_at', 'duration_ms', 'span_count', 'error'];
  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom traces list',
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
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});
