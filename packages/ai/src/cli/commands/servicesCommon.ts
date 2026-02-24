import { createAxiomApiClient } from '../api/client';
import {
  fieldNamesFromDatasetFields,
  normalizeDatasetFields,
  normalizeDatasetList,
} from '../api/binding';
import { AxiomApiError } from '../api/http';
import { detectOtelDatasets, requireOtelFields } from '../otel/detectDatasets';
import type { OtelFieldMap } from '../otel/types';
import { TRACE_FIELD_CANDIDATES } from '../otel/fieldMapping';
import { toQueryRows } from './queryRows';

export const requireAuth = (orgId?: string, token?: string) => {
  if (!orgId || !token) {
    throw new Error('Missing Axiom credentials. Run `axiom auth login`.');
  }
};

type SchemaMap = Record<string, string[]>;

type CliSchemaCacheScope = {
  url: string;
  orgId: string;
  token: string;
};

type CliSchemaCacheEntry = {
  expiresAtMs: number;
  schemaMap: SchemaMap;
};

const DEFAULT_SCHEMA_CACHE_TTL_MS = 30_000;
const cliSchemaCache = new Map<string, CliSchemaCacheEntry>();

const parseCacheTtl = (value: string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.floor(parsed);
};

const resolveSchemaCacheTtlMs = () => {
  const override = parseCacheTtl(process.env.AXIOM_CLI_SCHEMA_CACHE_TTL_MS);
  if (override !== null) {
    return override;
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return 0;
  }
  return DEFAULT_SCHEMA_CACHE_TTL_MS;
};

const buildSchemaCacheKey = (scope: CliSchemaCacheScope) =>
  `${scope.url}\u0000${scope.orgId}\u0000${scope.token}`;

const cloneSchemaMap = (schemaMap: SchemaMap): SchemaMap =>
  Object.fromEntries(Object.entries(schemaMap).map(([dataset, fields]) => [dataset, [...fields]]));

const readSchemaCache = (cacheKey: string): SchemaMap | null => {
  const ttlMs = resolveSchemaCacheTtlMs();
  if (ttlMs <= 0) {
    return null;
  }

  const cached = cliSchemaCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAtMs <= Date.now()) {
    cliSchemaCache.delete(cacheKey);
    return null;
  }

  return cloneSchemaMap(cached.schemaMap);
};

const writeSchemaCache = (cacheKey: string, schemaMap: SchemaMap) => {
  const ttlMs = resolveSchemaCacheTtlMs();
  if (ttlMs <= 0) {
    return;
  }

  cliSchemaCache.set(cacheKey, {
    expiresAtMs: Date.now() + ttlMs,
    schemaMap: cloneSchemaMap(schemaMap),
  });
};

export const clearCliSchemaCache = () => {
  cliSchemaCache.clear();
};

const listSchemas = async (
  client: ReturnType<typeof createAxiomApiClient>,
  cacheScope?: CliSchemaCacheScope,
) => {
  const cacheKey = cacheScope ? buildSchemaCacheKey(cacheScope) : null;
  if (cacheKey) {
    const cached = readSchemaCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

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
      if (error instanceof AxiomApiError) {
        return null;
      }
      throw error;
    }
  };

  const schemaMap: SchemaMap = {};
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

  if (cacheKey) {
    writeSchemaCache(cacheKey, schemaMap);
  }

  return cloneSchemaMap(schemaMap);
};

export const listDatasetSchemas = async (
  client: ReturnType<typeof createAxiomApiClient>,
  cacheScope: CliSchemaCacheScope,
) => listSchemas(client, cacheScope);

export const resolveTraceDataset = async (params: {
  url: string;
  orgId: string;
  token: string;
  explain: unknown;
  overrideDataset?: string;
  requiredFields: Array<keyof Omit<OtelFieldMap, 'timestampField'>>;
}) => {
  const client = createAxiomApiClient({
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
        `Dataset ${params.overrideDataset} is not a trace candidate. Run \`axiom services detect --explain\` to inspect mappings.`,
      );
    }

    requireOtelFields(params.overrideDataset, fields, params.requiredFields);
    return {
      client,
      dataset: params.overrideDataset,
      fields,
    };
  }

  const schemaMap = await listDatasetSchemas(client, {
    url: params.url,
    orgId: params.orgId,
    token: params.token,
  });

  const detection = detectOtelDatasets(schemaMap);
  if (!detection.traces) {
    throw new Error('No trace dataset detected. Run `axiom services detect --explain` to inspect mappings.');
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
  const client = createAxiomApiClient({
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
        `No logs dataset detected. Run \`axiom services detect --explain\` and re-run with --logs-dataset <name>.`,
      );
    }

    return {
      client,
      dataset: params.overrideDataset,
      fields: resolveLogsFieldMap(schemaFields, logs.fields),
    };
  }

  const schemaMap = await listDatasetSchemas(client, {
    url: params.url,
    orgId: params.orgId,
    token: params.token,
  });
  const detection = detectOtelDatasets(schemaMap);
  if (!detection.logs) {
    throw new Error(
      'No logs dataset detected. Run `axiom services detect --explain` and re-run with --logs-dataset <name>.',
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
  return toQueryRows(data);
};

const escapeAplSingleQuoted = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const escapeAplDoubleQuoted = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const aplFieldRef = (field: string) => `['${escapeAplSingleQuoted(field)}']`;

export const aplStringLiteral = (value: string) => `"${escapeAplDoubleQuoted(value)}"`;
