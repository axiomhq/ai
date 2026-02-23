import type { Command } from 'commander';
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
import { TRACE_SPANS_APL_TEMPLATE } from '../otel/aplTemplates';
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

const sortRows = (rows: Record<string, unknown>[]) =>
  [...rows].sort((a, b) => {
    const startA = String(a.start ?? '');
    const startB = String(b.start ?? '');
    if (startA !== startB) {
      return startA.localeCompare(startB);
    }
    return Number(b.duration_ms ?? 0) - Number(a.duration_ms ?? 0);
  });

export const traceSpans = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const traceId = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    dataset?: string;
  };

  const { client, dataset, fields } = await resolveTraceDataset({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
    overrideDataset: options.dataset,
    requiredFields: ['traceIdField', 'spanIdField', 'serviceField', 'spanNameField'],
  });

  const apl = expandTemplate(TRACE_SPANS_APL_TEMPLATE, {
    FILTER: `where ${aplFieldRef(fields.traceIdField!)} == ${aplStringLiteral(traceId)}`,
    DURATION_FIELD: aplFieldRef(fields.durationField ?? 'duration_ms'),
    SERVICE_FIELD: aplFieldRef(fields.serviceField!),
    SPAN_NAME_FIELD: aplFieldRef(fields.spanNameField!),
    SPAN_KIND_FIELD: aplFieldRef(fields.spanKindField ?? 'kind'),
    STATUS_FIELD: aplFieldRef(fields.statusField ?? 'status.code'),
    SPAN_ID_FIELD: aplFieldRef(fields.spanIdField!),
    PARENT_SPAN_ID_FIELD: aplFieldRef(fields.parentSpanIdField ?? 'parent_span_id'),
  });

  const queryResponse = await client.queryApl(dataset, apl, {
    maxBinAutoGroups: 40,
  });

  const rows = sortRows(toRows(queryResponse.data));
  const columns = ['start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'];

  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom traces spans',
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
      formatMcp(`# Trace Spans: ${traceId}`, [
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
