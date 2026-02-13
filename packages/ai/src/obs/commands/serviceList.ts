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
import { SERVICE_LIST_APL_TEMPLATE } from '../otel/aplTemplates';
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
    const errorA = Number(a.error_rate ?? 0);
    const errorB = Number(b.error_rate ?? 0);
    if (errorB !== errorA) {
      return errorB - errorA;
    }

    const spansA = Number(a.spans ?? 0);
    const spansB = Number(b.spans ?? 0);
    if (spansB !== spansA) {
      return spansB - spansA;
    }

    return String(a.service ?? '').localeCompare(String(b.service ?? ''));
  });

export const serviceList = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    dataset?: string;
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
    requiredFields: ['serviceField', 'traceIdField', 'spanIdField'],
  });

  const statusField = fields.statusField ?? 'status.code';
  const durationField = fields.durationField ?? 'duration_ms';
  const apl = expandTemplate(SERVICE_LIST_APL_TEMPLATE, {
    SERVICE_FIELD: fields.serviceField!,
    STATUS_FIELD: statusField,
    DURATION_FIELD: durationField,
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

  const includeErrorColumns = rows.some((row) => row.error_spans !== undefined || row.error_rate !== undefined);
  const includeDuration = rows.some((row) => row.p95_ms !== undefined);

  const columns = ['service', 'last_seen', 'spans'];
  if (includeErrorColumns) {
    columns.push('error_spans', 'error_rate');
  }
  if (includeDuration) {
    columns.push('p95_ms');
  }

  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom service list',
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
      formatMcp('# Services (last 30m)', [
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
