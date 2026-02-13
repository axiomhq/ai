import { createObsApiClient } from '../api/client';
import { withObsContext } from '../cli/withObsContext';
import { formatJson, formatMcp } from '../format/formatters';
import {
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  type OutputFormat,
} from '../format/output';
import { buildJsonMeta } from '../format/meta';
import { buildTraceTieWarning, detectOtelDatasets } from '../otel/detectDatasets';

const requireAuth = (orgId?: string, token?: string) => {
  if (!orgId || !token) {
    throw new Error('Missing Axiom credentials. Run `axiom auth login`.');
  }
};

const write = (stdout: string, stderr = '') => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

type SchemaField = { field?: string; name?: string };

const toFieldNames = (schema: unknown): string[] => {
  if (Array.isArray(schema)) {
    return schema
      .map((entry) => (entry as SchemaField).field ?? (entry as SchemaField).name ?? '')
      .filter(Boolean);
  }

  if (typeof schema === 'object' && schema) {
    const fields = (schema as { fields?: unknown }).fields;
    if (Array.isArray(fields)) {
      return fields
        .map((entry) => (entry as SchemaField).field ?? (entry as SchemaField).name ?? '')
        .filter(Boolean);
    }
  }

  return [];
};

export const serviceDetect = withObsContext(async ({ config, explain }) => {
  requireAuth(config.orgId, config.token);

  const client = createObsApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const datasetsResponse = await client.listDatasets<Array<{ name?: string }> | { datasets: Array<{ name?: string }> }>();
  const datasetRows = Array.isArray(datasetsResponse.data)
    ? datasetsResponse.data
    : datasetsResponse.data.datasets ?? [];

  const datasetNames = datasetRows
    .map((dataset) => dataset.name ?? '')
    .filter((name) => Boolean(name));

  const schemaMap: Record<string, string[]> = {};
  for (const dataset of datasetNames) {
    const schemaResponse = await client.getDatasetSchema(dataset);
    schemaMap[dataset] = toFieldNames(schemaResponse.data);
  }

  const detection = detectOtelDatasets(schemaMap);
  const rows = [
    detection.traces
      ? {
          kind: 'traces',
          dataset: detection.traces.dataset,
          score: detection.traces.score,
          service_field: detection.traces.fields.serviceField,
          trace_id_field: detection.traces.fields.traceIdField,
          span_id_field: detection.traces.fields.spanIdField,
          status_field: detection.traces.fields.statusField,
          duration_field: detection.traces.fields.durationField,
        }
      : {
          kind: 'traces',
          dataset: null,
          score: 0,
          service_field: null,
          trace_id_field: null,
          span_id_field: null,
          status_field: null,
          duration_field: null,
        },
    detection.logs
      ? {
          kind: 'logs',
          dataset: detection.logs.dataset,
          score: detection.logs.score,
          service_field: detection.logs.fields.serviceField,
          trace_id_field: detection.logs.fields.traceIdField,
          span_id_field: detection.logs.fields.spanIdField,
          status_field: detection.logs.fields.statusField,
          duration_field: detection.logs.fields.durationField,
        }
      : {
          kind: 'logs',
          dataset: null,
          score: 0,
          service_field: null,
          trace_id_field: null,
          span_id_field: null,
          status_field: null,
          duration_field: null,
        },
  ];

  const columns = [
    'kind',
    'dataset',
    'score',
    'service_field',
    'trace_id_field',
    'span_id_field',
    'status_field',
    'duration_field',
  ];

  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);
  const warning = detection.traces
    ? buildTraceTieWarning(detection.traceTies, detection.traces.dataset)
    : null;

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom service detect',
      meta: {
        truncated: false,
        rowsShown: rows.length,
        rowsTotal: rows.length,
        columnsShown: columns.length,
        columnsTotal: columns.length,
      },
    });

    write(
      formatJson(
        meta,
        {
          traces: detection.traces
            ? {
                dataset: detection.traces.dataset,
                score: detection.traces.score,
                fields: detection.traces.fields,
              }
            : {
                dataset: null,
                score: 0,
                fields: {
                  serviceField: null,
                  traceIdField: null,
                  spanIdField: null,
                  parentSpanIdField: null,
                  spanNameField: null,
                  spanKindField: null,
                  statusField: null,
                  durationField: null,
                  timestampField: '_time',
                },
              },
          logs: detection.logs
            ? {
                dataset: detection.logs.dataset,
                score: detection.logs.score,
                fields: detection.logs.fields,
              }
            : {
                dataset: null,
                score: 0,
                fields: {
                  serviceField: null,
                  traceIdField: null,
                  spanIdField: null,
                  parentSpanIdField: null,
                  spanNameField: null,
                  spanKindField: null,
                  statusField: null,
                  durationField: null,
                  timestampField: '_time',
                },
              },
        },
      ),
    );
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

    const headerLines = ['# Service Dataset Detection', 'Detected trace/log datasets and field mappings.'];
    if (warning) {
      headerLines.push(warning);
    }

    write(
      formatMcp(headerLines.join('\n'), [
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

  write(result.stdout, `${result.stderr}${warning ? `${warning}\n` : ''}`);
});
