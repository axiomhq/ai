import { createAxiomApiClient } from '../api/client';
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
import { buildTraceTieWarning, detectOtelDatasets } from '../otel/detectDatasets';
import { listDatasetSchemas, requireAuth, write } from './servicesCommon';

export const serviceDetect = withCliContext(async ({ config, explain }) => {
  requireAuth(config.orgId, config.token);

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
  });

  const schemaMap = await listDatasetSchemas(client, {
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
  });

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
      command: 'axiom services detect',
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
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });

  write(result.stdout, `${result.stderr}${warning ? `${warning}\n` : ''}`);
});
