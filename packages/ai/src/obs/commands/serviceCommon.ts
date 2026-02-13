import { createObsApiClient } from '../api/client';
import {
  fieldNamesFromDatasetFields,
  normalizeDatasetFields,
  normalizeDatasetList,
} from '../api/binding';
import { ObsApiError } from '../api/http';
import { detectOtelDatasets, requireOtelFields } from '../otel/detectDatasets';
import type { OtelFieldMap } from '../otel/types';
import { TRACE_FIELD_CANDIDATES } from '../otel/fieldMapping';

export const requireAuth = (orgId?: string, token?: string) => {
  if (!orgId || !token) {
    throw new Error('Missing Axiom credentials. Run `axiom auth login`.');
  }
};

const listSchemas = async (client: ReturnType<typeof createObsApiClient>) => {
  const datasetsResponse = await client.listDatasets();
  const datasets = normalizeDatasetList(datasetsResponse.data);

  const fetchFields = async (datasetName: string) => {
    try {
      const schemaResponse = await client.getDatasetFields(datasetName);
      const fields = normalizeDatasetFields(schemaResponse.data);
      return {
        datasetName,
        fields: fieldNamesFromDatasetFields(fields),
      };
    } catch (error) {
      if (error instanceof ObsApiError) {
        return null;
      }
      throw error;
    }
  };

  const schemaMap: Record<string, string[]> = {};
  const queue = datasets.map((dataset) => dataset.name).filter(Boolean);
  const concurrency = 8;

  for (let index = 0; index < queue.length; index += concurrency) {
    const batch = queue.slice(index, index + concurrency);
    const results = await Promise.all(batch.map((datasetName) => fetchFields(datasetName)));
    for (const result of results) {
      if (result) {
        schemaMap[result.datasetName] = result.fields;
      }
    }
  }

  return schemaMap;
};

export const resolveTraceDataset = async (params: {
  url: string;
  orgId: string;
  token: string;
  explain: unknown;
  overrideDataset?: string;
  requiredFields: Array<keyof Omit<OtelFieldMap, 'timestampField'>>;
}) => {
  const client = createObsApiClient({
    url: params.url,
    orgId: params.orgId,
    token: params.token,
    explain: params.explain as never,
  });

  if (params.overrideDataset) {
    const schema = await client.getDatasetFields(params.overrideDataset);
    const fields = detectOtelDatasets({
      [params.overrideDataset]: fieldNamesFromDatasetFields(normalizeDatasetFields(schema.data)),
    }).traces?.fields;

    if (!fields) {
      throw new Error(
        `Dataset ${params.overrideDataset} is not a trace candidate. Run \`axiom service detect --explain\` to inspect mappings.`,
      );
    }

    requireOtelFields(params.overrideDataset, fields, params.requiredFields);
    return {
      client,
      dataset: params.overrideDataset,
      fields,
    };
  }

  const schemaMap = await listSchemas(client);

  const detection = detectOtelDatasets(schemaMap);
  if (!detection.traces) {
    throw new Error('No trace dataset detected. Run `axiom service detect --explain` to inspect mappings.');
  }

  requireOtelFields(detection.traces.dataset, detection.traces.fields, params.requiredFields);

  return {
    client,
    dataset: detection.traces.dataset,
    fields: detection.traces.fields,
  };
};

type LogsFieldMap = {
  serviceField: string;
  traceIdField: string | null;
  severityField: string | null;
  messageField: string | null;
};

const pickFirst = (fieldSet: Set<string>, candidates: string[]) => {
  for (const candidate of candidates) {
    if (fieldSet.has(candidate)) {
      return candidate;
    }
  }
  return null;
};

const resolveLogsFieldMap = (schemaFields: string[], fallback: OtelFieldMap): LogsFieldMap => {
  const fieldSet = new Set(schemaFields);

  const serviceField = fallback.serviceField ?? 'service.name';
  const traceIdField = pickFirst(fieldSet, TRACE_FIELD_CANDIDATES.traceId) ?? fallback.traceIdField;
  const severityField = pickFirst(fieldSet, ['severity_text', 'severity']);
  const messageField = pickFirst(fieldSet, ['body', 'message']);

  return {
    serviceField,
    traceIdField,
    severityField,
    messageField,
  };
};

export const resolveLogsDataset = async (params: {
  url: string;
  orgId: string;
  token: string;
  explain: unknown;
  overrideDataset?: string;
}) => {
  const client = createObsApiClient({
    url: params.url,
    orgId: params.orgId,
    token: params.token,
    explain: params.explain as never,
  });

  if (params.overrideDataset) {
    const schema = await client.getDatasetFields(params.overrideDataset);
    const schemaFields = fieldNamesFromDatasetFields(normalizeDatasetFields(schema.data));
    const detection = detectOtelDatasets({
      [params.overrideDataset]: schemaFields,
    });
    const logs = detection.logs;
    if (!logs) {
      throw new Error(
        `No logs dataset detected. Run \`axiom service detect --explain\` and re-run with --logs-dataset <name>.`,
      );
    }

    return {
      client,
      dataset: params.overrideDataset,
      fields: resolveLogsFieldMap(schemaFields, logs.fields),
    };
  }

  const schemaMap = await listSchemas(client);
  const detection = detectOtelDatasets(schemaMap);
  if (!detection.logs) {
    throw new Error(
      'No logs dataset detected. Run `axiom service detect --explain` and re-run with --logs-dataset <name>.',
    );
  }

  return {
    client,
    dataset: detection.logs.dataset,
    fields: resolveLogsFieldMap(schemaMap[detection.logs.dataset], detection.logs.fields),
  };
};

export const write = (stdout: string, stderr = '') => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

export const toRows = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) {
    return data.filter((row): row is Record<string, unknown> => typeof row === 'object' && !!row);
  }

  if (typeof data === 'object' && data) {
    const payload = data as { matches?: unknown; rows?: unknown };
    if (Array.isArray(payload.matches)) {
      return payload.matches.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && !!row,
      );
    }
    if (Array.isArray(payload.rows)) {
      return payload.rows.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && !!row,
      );
    }
  }

  return [];
};
