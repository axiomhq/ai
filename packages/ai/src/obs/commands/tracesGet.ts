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

type SpanRow = {
  start?: string;
  duration_ms?: number;
  service?: string;
  operation?: string;
  kind?: string;
  status?: string;
  span_id?: string;
  parent_span_id?: string;
};

const expandTemplate = (template: string, replacements: Record<string, string>) => {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`\${${key}}`).join(value);
  }
  return output;
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

const marker = (status?: string) => {
  if (!status) {
    return 'OK';
  }
  return status.toLowerCase() === 'error' ? 'ERR' : 'OK';
};

const buildTreeLines = (rows: SpanRow[]): string[] | null => {
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
  const lines: string[] = [];

  const visit = (row: SpanRow, depth: number) => {
    const prefix = '|'.concat('  '.repeat(depth));
    lines.push(
      `${prefix}${String(row.duration_ms ?? 0)} ${String(row.service ?? 'unknown')} ${String(row.operation ?? '-')} ${marker(row.status)}`,
    );

    const nextRows = sortByStartAndDuration(children.get(String(row.span_id ?? '')) ?? []);
    for (const child of nextRows) {
      visit(child, depth + 1);
    }
  };

  for (const root of sortedRoots) {
    visit(root, 1);
  }

  return lines;
};

const buildFallbackLines = (rows: SpanRow[]) =>
  sortByStartAndDuration(rows).map(
    (row) =>
      `|  ${String(row.duration_ms ?? 0)} ${String(row.service ?? 'unknown')} ${String(row.operation ?? '-')} ${marker(row.status)}`,
  );

const topSpans = (rows: SpanRow[]) =>
  [...rows]
    .sort((a, b) => Number(b.duration_ms ?? 0) - Number(a.duration_ms ?? 0))
    .slice(0, 20)
    .map((row) => ({
      start: row.start ?? null,
      duration_ms: row.duration_ms ?? 0,
      service: row.service ?? null,
      operation: row.operation ?? null,
      kind: row.kind ?? null,
      status: row.status ?? null,
      span_id: row.span_id ?? null,
      parent_span_id: row.parent_span_id ?? null,
    }));

export const traceGet = withObsContext(async ({ config, explain }, ...args: unknown[]) => {
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

  const rows = toRows(queryResponse.data) as SpanRow[];
  const sortedRows = sortByStartAndDuration(rows);
  const reconstructedTree = buildTreeLines(sortedRows);
  const treeLines = reconstructedTree ?? buildFallbackLines(sortedRows);
  const usedFallback = reconstructedTree === null;
  const topRows = topSpans(sortedRows);

  const services = Array.from(new Set(sortedRows.map((row) => row.service).filter(Boolean))).slice(0, 10);
  const start = sortedRows[0]?.start ?? null;
  const end = sortedRows[sortedRows.length - 1]?.start ?? null;
  const errorSpans = sortedRows.filter((row) => marker(row.status) === 'ERR').length;

  const metadata = {
    trace_id: traceId,
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
      meta: {
        truncated: false,
        rowsShown: topRows.length,
        rowsTotal: sortedRows.length,
        columnsShown: 8,
        columnsTotal: 8,
      },
    });
    write(formatJson(meta, { metadata, tree: treeLines, top_spans: topRows }));
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(topRows, ['start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'], {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(topRows, ['start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'], {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });

    const header = `# Trace ${traceId}\n- span_count: ${String(metadata.span_count)}\n- services: ${services.join(', ') || 'none'}\n- errors: ${metadata.error_summary}`;

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

  const metadataRows = Object.entries(metadata).map(([key, value]) => ({ key, value }));
  const metadataTable = renderTabular(metadataRows, ['key', 'value'], {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });

  const topTable = renderTabular(topRows, ['start', 'duration_ms', 'service', 'operation', 'kind', 'status', 'span_id', 'parent_span_id'], {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });

  const treeOutput = treeLines.length === 0 ? '' : `${treeLines.join('\n')}\n`;
  write(`${metadataTable.stdout}\n${treeOutput}\n${topTable.stdout}`, `${metadataTable.stderr}${topTable.stderr}`);
});
