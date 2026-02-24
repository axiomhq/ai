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
import { SERVICE_OPERATIONS_APL_TEMPLATE, SERVICE_SUMMARY_APL_TEMPLATE } from '../otel/aplTemplates';
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

export const serviceGet = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const service = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
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
    '30m',
    '0m',
  );

  const { client, dataset, fields } = await resolveTraceDataset({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
    overrideDataset: options.dataset,
    requiredFields: ['serviceField', 'spanNameField', 'spanIdField'],
  });

  const statusField = fields.statusField ?? 'status.code';
  const durationField = fields.durationField ?? 'duration_ms';

  const summaryApl = expandTemplate(SERVICE_SUMMARY_APL_TEMPLATE, {
    SERVICE_FIELD: aplFieldRef(fields.serviceField!),
    STATUS_FIELD: aplFieldRef(statusField),
    DURATION_FIELD: aplFieldRef(durationField),
    START: timeRange.start,
    END: timeRange.end,
    SERVICE: aplStringLiteral(service),
  });

  const operationsApl = expandTemplate(SERVICE_OPERATIONS_APL_TEMPLATE, {
    SERVICE_FIELD: aplFieldRef(fields.serviceField!),
    SPAN_NAME_FIELD: aplFieldRef(fields.spanNameField!),
    STATUS_FIELD: aplFieldRef(statusField),
    DURATION_FIELD: aplFieldRef(durationField),
    START: timeRange.start,
    END: timeRange.end,
    SERVICE: aplStringLiteral(service),
  });

  const [summaryResponse, operationsResponse] = await Promise.all([
    client.queryApl(dataset, summaryApl, {
      startTime: timeRange.start,
      endTime: timeRange.end,
      maxBinAutoGroups: 40,
    }),
    client.queryApl(dataset, operationsApl, {
      startTime: timeRange.start,
      endTime: timeRange.end,
      maxBinAutoGroups: 40,
    }),
  ]);

  const summaryRow = toRows(summaryResponse.data)[0] ?? {};
  const operations = toRows(operationsResponse.data).slice(0, 10);

  const summary = {
    service,
    time_range: `${timeRange.start} .. ${timeRange.end}`,
    last_seen: summaryRow.last_seen ?? null,
    spans: summaryRow.spans ?? 0,
    error_spans: summaryRow.error_spans ?? null,
    error_rate: summaryRow.error_rate ?? null,
    p50_ms: summaryRow.p50_ms ?? null,
    p95_ms: summaryRow.p95_ms ?? null,
    top_operation: operations[0]?.operation ?? null,
    worst_operation: operations[0]?.operation ?? null,
  };

  const format = resolveOutputFormat(config.format as OutputFormat, 'get', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom services get',
      timeRange,
      meta: {
        truncated: false,
        rowsShown: operations.length,
        rowsTotal: operations.length,
        columnsShown: 4,
        columnsTotal: 4,
      },
    });

    write(formatJson(meta, { summary, operations }));
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(operations, ['operation', 'spans', 'error_rate', 'p95_ms'], {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const operationColumns = ['operation', 'spans', 'error_rate', 'p95_ms'];
    const operationCsv = renderTabular(operations, operationColumns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });

    const header = `# Service ${service}\n- spans: ${String(summary.spans)}\n- error_rate: ${String(summary.error_rate ?? 'n/a')}\n- p95_ms: ${String(summary.p95_ms ?? 'n/a')}`;

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

  const operationColumns = ['operation', 'spans', 'error_rate', 'p95_ms'];
  const operationResult = renderTabular(operations, operationColumns, {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });

  write(`${summaryResult.stdout}\n${operationResult.stdout}`, `${summaryResult.stderr}${operationResult.stderr}`);
});
