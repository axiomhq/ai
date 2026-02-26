import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AxiomApiError, requestJson, type HttpConfig } from './http';
import { recordQuery, type ExplainContext } from '../explain/context';

export type QueryAplOptions = {
  startTime?: string;
  endTime?: string;
  maxBinAutoGroups?: number;
  limit?: number;
};

export type MonitorHistoryRange = {
  start?: string;
  end?: string;
};

export type AxiomApiClientConfig = Omit<HttpConfig, 'explain'> & {
  explain?: ExplainContext;
};

type DatasetRegionCacheEntry = {
  expiresAtMs: number;
  regionsByDataset: Map<string, string>;
};

type RegionEndpointCacheEntry = {
  expiresAtMs: number;
  endpointByRegion: Map<string, string>;
};

type DiskStringMapCacheEntry = {
  expiresAtMs: number;
  values: Map<string, string>;
};

const datasetRegionCache = new Map<string, DatasetRegionCacheEntry>();
const regionEndpointCache = new Map<string, RegionEndpointCacheEntry>();

const DEFAULT_DATASET_REGION_CACHE_TTL_MS = 5 * 60_000;
const DEFAULT_REGION_ENDPOINT_CACHE_TTL_MS = 60 * 60_000;
const EDGE_QUERY_PATH = '/api/v1/query';
const LEGACY_QUERY_PATH = '/v1/datasets/_apl?format=legacy';
const DISK_CACHE_VERSION = 1;
const CACHE_DIR_NAME = 'axiom';
const CACHE_NAMESPACE_DIR = 'cli';
const DATASET_REGION_CACHE_PREFIX = 'dataset-regions';
const REGION_ENDPOINT_CACHE_PREFIX = 'region-endpoints';
const TEST_ENV = process.env.VITEST || process.env.NODE_ENV === 'test';

const escapeAplDataset = (dataset: string) => dataset.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const aplIsDatasetScoped = (apl: string) => /^\s*\[\s*['"][^'"]+['"]\s*\]\s*\|/.test(apl.trim());

const escapeDatasetForRegex = (dataset: string) => dataset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitAplPrelude = (apl: string) => {
  const trimmed = apl.trim();
  const match = trimmed.match(/^((?:\s*let\b[\s\S]*?;\s*)+)([\s\S]*)$/);
  if (!match) {
    return { prelude: '', body: trimmed };
  }
  return {
    prelude: match[1],
    body: match[2].trim(),
  };
};

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

const parseBooleanEnv = (value: string | undefined): boolean | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return null;
};

const resolveEdgeRoutingEnabled = () => {
  const override = parseBooleanEnv(process.env.AXIOM_CLI_EDGE_ROUTING);
  if (override !== null) {
    return override;
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return false;
  }
  return true;
};

const resolveDatasetRegionCacheTtlMs = () => {
  const override = parseCacheTtl(process.env.AXIOM_CLI_DATASET_REGION_CACHE_TTL_MS);
  if (override !== null) {
    return override;
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return 0;
  }
  return DEFAULT_DATASET_REGION_CACHE_TTL_MS;
};

const resolveRegionEndpointCacheTtlMs = () => {
  const override = parseCacheTtl(process.env.AXIOM_CLI_REGION_ENDPOINT_CACHE_TTL_MS);
  if (override !== null) {
    return override;
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return 0;
  }
  return DEFAULT_REGION_ENDPOINT_CACHE_TTL_MS;
};

const trimOrUndefined = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveCliCacheDir = () => {
  const override = trimOrUndefined(process.env.AXIOM_CLI_CACHE_DIR);
  if (override) {
    return override;
  }

  if (TEST_ENV) {
    return undefined;
  }

  const homeDir = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Caches', CACHE_DIR_NAME, CACHE_NAMESPACE_DIR);
  }

  if (process.platform === 'win32') {
    const localAppData = trimOrUndefined(process.env.LOCALAPPDATA);
    if (localAppData) {
      return path.join(localAppData, CACHE_DIR_NAME, CACHE_NAMESPACE_DIR);
    }

    const appData = trimOrUndefined(process.env.APPDATA);
    if (appData) {
      return path.join(appData, CACHE_DIR_NAME, CACHE_NAMESPACE_DIR);
    }

    return path.join(homeDir, 'AppData', 'Local', CACHE_DIR_NAME, CACHE_NAMESPACE_DIR);
  }

  const xdgCacheHome = trimOrUndefined(process.env.XDG_CACHE_HOME);
  if (xdgCacheHome) {
    return path.join(xdgCacheHome, CACHE_DIR_NAME, CACHE_NAMESPACE_DIR);
  }

  return path.join(homeDir, '.cache', CACHE_DIR_NAME, CACHE_NAMESPACE_DIR);
};

const cloneStringMap = (map: Map<string, string>) => new Map(map);
const mergeStringMaps = (maps: Map<string, string>[]) => {
  const merged = new Map<string, string>();
  maps.forEach((map) => {
    map.forEach((value, key) => {
      merged.set(key, value);
    });
  });
  return merged;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
};

const getString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const hashCacheKey = (prefix: string, cacheKey: string) =>
  createHash('sha256').update(`${prefix}\u0000${cacheKey}`).digest('hex');

const diskCachePathFor = (prefix: string, cacheKey: string) => {
  const cacheDir = resolveCliCacheDir();
  if (!cacheDir) {
    return undefined;
  }
  return path.join(cacheDir, `${prefix}-${hashCacheKey(prefix, cacheKey)}.json`);
};

const mapToRecord = (map: Map<string, string>) => {
  const entries = [...map.entries()].sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
};

const recordToMap = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const map = new Map<string, string>();
  Object.entries(record).forEach(([key, entryValue]) => {
    if (typeof entryValue === 'string' && entryValue.length > 0) {
      map.set(key, entryValue);
    }
  });
  return map.size > 0 ? map : null;
};

const readDiskStringMapCache = async (
  prefix: string,
  cacheKey: string,
): Promise<DiskStringMapCacheEntry | null> => {
  const cachePath = diskCachePathFor(prefix, cacheKey);
  if (!cachePath) {
    return null;
  }

  let fileContents: string;
  try {
    fileContents = await fs.readFile(cachePath, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return null;
    }
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(fileContents);
  } catch {
    return null;
  }

  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  if (record.version !== DISK_CACHE_VERSION) {
    return null;
  }

  const expiresAtMs = record.expiresAtMs;
  if (typeof expiresAtMs !== 'number' || !Number.isFinite(expiresAtMs)) {
    return null;
  }

  if (expiresAtMs <= Date.now()) {
    try {
      await fs.rm(cachePath, { force: true });
    } catch {
      // Ignore cleanup failures.
    }
    return null;
  }

  const values = recordToMap(record.values);
  if (!values) {
    return null;
  }

  return { expiresAtMs, values };
};

const writeDiskStringMapCache = async (prefix: string, cacheKey: string, entry: DiskStringMapCacheEntry) => {
  const cachePath = diskCachePathFor(prefix, cacheKey);
  if (!cachePath) {
    return;
  }

  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    const payload = {
      version: DISK_CACHE_VERSION,
      expiresAtMs: entry.expiresAtMs,
      values: mapToRecord(entry.values),
    };
    await fs.writeFile(cachePath, JSON.stringify(payload), 'utf8');
  } catch {
    // Cache is best-effort.
  }
};

const cacheKeyFor = (config: HttpConfig) => `${config.url.replace(/\/+$/, '')}\u0000${config.orgId}`;

const readDatasetRegionCache = async (key: string): Promise<Map<string, string> | null> => {
  const ttlMs = resolveDatasetRegionCacheTtlMs();
  if (ttlMs <= 0) {
    return null;
  }

  const cached = datasetRegionCache.get(key);
  if (cached) {
    if (cached.expiresAtMs <= Date.now()) {
      datasetRegionCache.delete(key);
    } else {
      return cloneStringMap(cached.regionsByDataset);
    }
  }

  const diskDatasetCache = await readDiskStringMapCache(DATASET_REGION_CACHE_PREFIX, key);
  if (!diskDatasetCache) {
    return null;
  }

  datasetRegionCache.set(key, {
    expiresAtMs: diskDatasetCache.expiresAtMs,
    regionsByDataset: cloneStringMap(diskDatasetCache.values),
  });
  return cloneStringMap(diskDatasetCache.values);
};

const writeDatasetRegionCache = async (key: string, value: Map<string, string>) => {
  const ttlMs = resolveDatasetRegionCacheTtlMs();
  if (ttlMs <= 0 || value.size === 0) {
    return;
  }

  const existing = await readDatasetRegionCache(key);
  const merged = existing ? mergeStringMaps([existing, value]) : value;
  const expiresAtMs = Date.now() + ttlMs;
  datasetRegionCache.set(key, {
    expiresAtMs,
    regionsByDataset: cloneStringMap(merged),
  });

  await writeDiskStringMapCache(DATASET_REGION_CACHE_PREFIX, key, {
    expiresAtMs,
    values: cloneStringMap(merged),
  });
};

const readRegionEndpointCache = async (key: string): Promise<Map<string, string> | null> => {
  const ttlMs = resolveRegionEndpointCacheTtlMs();
  if (ttlMs <= 0) {
    return null;
  }

  const cached = regionEndpointCache.get(key);
  if (cached) {
    if (cached.expiresAtMs <= Date.now()) {
      regionEndpointCache.delete(key);
    } else {
      return cloneStringMap(cached.endpointByRegion);
    }
  }

  const diskRegionCache = await readDiskStringMapCache(REGION_ENDPOINT_CACHE_PREFIX, key);
  if (diskRegionCache) {
    regionEndpointCache.set(key, {
      expiresAtMs: diskRegionCache.expiresAtMs,
      endpointByRegion: cloneStringMap(diskRegionCache.values),
    });
    return cloneStringMap(diskRegionCache.values);
  }

  return null;
};

const writeRegionEndpointCache = async (key: string, value: Map<string, string>) => {
  const ttlMs = resolveRegionEndpointCacheTtlMs();
  if (ttlMs <= 0 || value.size === 0) {
    return;
  }

  const existing = await readRegionEndpointCache(key);
  const merged = existing ? mergeStringMaps([existing, value]) : value;
  const expiresAtMs = Date.now() + ttlMs;
  regionEndpointCache.set(key, {
    expiresAtMs,
    endpointByRegion: cloneStringMap(merged),
  });

  await writeDiskStringMapCache(REGION_ENDPOINT_CACHE_PREFIX, key, {
    expiresAtMs,
    values: cloneStringMap(merged),
  });
};

const extractScopedDatasetName = (apl: string): string | undefined => {
  const { body } = splitAplPrelude(apl);
  const match = body.match(/^\[\s*(['"])((?:\\.|(?!\1).)+)\1\s*\]\s*\|/s);
  if (!match) {
    return undefined;
  }

  return match[2].replace(/\\(['"\\])/g, '$1');
};

const inferDatasetFromKnownDatasets = (
  apl: string,
  knownDatasetNames: Iterable<string>,
): string | undefined => {
  const datasetNames = Array.from(knownDatasetNames).filter((name) => name.length > 0);
  if (datasetNames.length === 0) {
    return undefined;
  }

  const knownDatasets = new Set(datasetNames);
  let bestMatch: { dataset: string; index: number } | null = null;

  const bracketPattern = /\[\s*(['"])((?:\\.|(?!\1).)+)\1\s*\]/gs;
  for (const match of apl.matchAll(bracketPattern)) {
    const candidate = match[2]?.replace(/\\(['"\\])/g, '$1');
    if (!candidate || !knownDatasets.has(candidate)) {
      continue;
    }

    const index = match.index ?? Number.MAX_SAFE_INTEGER;
    if (!bestMatch || index < bestMatch.index) {
      bestMatch = { dataset: candidate, index };
    }
  }

  if (bestMatch) {
    return bestMatch.dataset;
  }

  // FIXME(njpatel): Replace this with AST-backed dataset extraction once the parser is ready.
  for (const dataset of datasetNames) {
    const index = apl.indexOf(dataset);
    if (index < 0) {
      continue;
    }

    if (
      !bestMatch ||
      index < bestMatch.index ||
      (index === bestMatch.index && dataset.length > bestMatch.dataset.length)
    ) {
      bestMatch = { dataset, index };
    }
  }

  return bestMatch?.dataset;
};

const withAplPrelude = (prelude: string, body: string) => {
  if (!prelude) {
    return body;
  }
  return `${prelude}${body}`.trim();
};

const rewriteLeadingDatasetPipe = (dataset: string, apl: string) => {
  const { prelude, body } = splitAplPrelude(apl);
  const pattern = new RegExp(`^${escapeDatasetForRegex(dataset)}\\s*\\|\\s*(.+)$`, 's');
  const match = body.match(pattern);
  if (!match) {
    return withAplPrelude(prelude, body);
  }
  return withAplPrelude(prelude, `['${escapeAplDataset(dataset)}'] | ${match[1].trim()}`);
};

const rewriteAplDatasetShorthand = (apl: string) => {
  const { prelude, body } = splitAplPrelude(apl);
  if (aplIsDatasetScoped(body)) {
    return withAplPrelude(prelude, body);
  }

  const match = body.match(/^([A-Za-z0-9_./:-]+)\s*\|\s*(.+)$/s);
  if (!match) {
    return withAplPrelude(prelude, body);
  }
  return withAplPrelude(prelude, `['${escapeAplDataset(match[1])}'] | ${match[2].trim()}`);
};

const qualifyAplWithDataset = (dataset: string, apl: string) => {
  const normalized = rewriteLeadingDatasetPipe(dataset, apl);
  const { prelude, body } = splitAplPrelude(normalized);
  if (aplIsDatasetScoped(body)) {
    return withAplPrelude(prelude, body);
  }
  return withAplPrelude(prelude, `['${escapeAplDataset(dataset)}'] | ${body}`);
};

const deriveAppUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.startsWith('api.')) {
      parsed.hostname = parsed.hostname.replace(/^api\./, 'app.');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
};

const extractDatasetRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  for (const key of ['datasets', 'items', 'results', 'data']) {
    const value = record[key];
    if (!Array.isArray(value)) {
      continue;
    }
    const rows = value.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
    if (rows.length > 0) {
      return rows;
    }
  }

  return [];
};

const regionMapFromDatasets = (payload: unknown): Map<string, string> => {
  const rows = extractDatasetRows(payload);
  const map = new Map<string, string>();

  rows.forEach((row) => {
    const datasetName = getString(row, 'name') ?? getString(row, 'id');
    const region = getString(row, 'region');
    if (!datasetName || !region) {
      return;
    }
    map.set(datasetName, region);
  });

  return map;
};

const extractRegionRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  return Object.values(record).flatMap((value) => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null);
  });
};

const endpointMapFromRegions = (payload: unknown): Map<string, string> => {
  const rows = extractRegionRows(payload);
  const map = new Map<string, string>();

  rows.forEach((row) => {
    const endpoint =
      (getString(row, 'domain') ??
        getString(row, 'endpoint') ??
        getString(row, 'url') ??
        getString(row, 'apiUrl'))?.replace(/\/+$/, '');
    if (!endpoint) {
      return;
    }

    const regionId = getString(row, 'id');
    if (regionId) {
      map.set(regionId, endpoint);
    }

    const instanceName = getString(row, 'instanceName');
    if (instanceName) {
      map.set(instanceName, endpoint);
    }
  });

  return map;
};

const shouldFallbackToLegacyQuery = (error: unknown) => {
  if (!(error instanceof AxiomApiError)) {
    return true;
  }

  return error.status === 404 || error.status === 405 || error.status >= 500;
};

export class AxiomApiClient {
  private config: HttpConfig;

  constructor(config: AxiomApiClientConfig) {
    this.config = config;
  }

  async listDatasets<T = unknown>() {
    const response = await requestJson<T>(this.config, { method: 'GET', path: '/v2/datasets' });
    await this.seedDatasetRegionCache(response.data);
    return response;
  }

  async listInternalDatasets<T = unknown>() {
    const response = await requestJson<T>(this.config, {
      method: 'GET',
      path: '/api/internal/datasets',
      baseUrl: deriveAppUrl(this.config.url),
    });
    await this.seedDatasetRegionCache(response.data);
    return response;
  }

  async listInternalRegions<T = unknown>() {
    const response = await requestJson<T>(this.config, {
      method: 'GET',
      path: '/api/internal/regions',
      baseUrl: deriveAppUrl(this.config.url),
    });
    await this.seedRegionEndpointCache(response.data);
    return response;
  }

  getDataset<T = unknown>(name: string) {
    return requestJson<T>(this.config, {
      method: 'GET',
      path: `/v2/datasets/${encodeURIComponent(name)}`,
    });
  }

  getDatasetSchema<T = unknown>(name: string) {
    return this.getDatasetFields<T>(name);
  }

  getDatasetFields<T = unknown>(name: string) {
    return requestJson<T>(this.config, {
      method: 'GET',
      path: `/v2/datasets/${encodeURIComponent(name)}/fields`,
    });
  }

  private async seedDatasetRegionCache(payload: unknown) {
    const map = regionMapFromDatasets(payload);
    if (map.size === 0) {
      return;
    }
    await writeDatasetRegionCache(cacheKeyFor(this.config), map);
  }

  private async seedRegionEndpointCache(payload: unknown) {
    const map = endpointMapFromRegions(payload);
    if (map.size === 0) {
      return;
    }
    await writeRegionEndpointCache(cacheKeyFor(this.config), map);
  }

  private async getDatasetRegionMap() {
    const key = cacheKeyFor(this.config);
    const cached = await readDatasetRegionCache(key);
    if (cached) {
      return cached;
    }

    try {
      const internalResponse = await this.listInternalDatasets<unknown>();
      const internalMap = regionMapFromDatasets(internalResponse.data);
      if (internalMap.size > 0) {
        return internalMap;
      }
    } catch {
      // Fall back to public dataset list shape. Some environments may not expose internal endpoints.
    }

    const response = await this.listDatasets<unknown>();
    const publicMap = regionMapFromDatasets(response.data);
    if (publicMap.size > 0) {
      return publicMap;
    }

    return new Map<string, string>();
  }

  private async getRegionEndpointMap() {
    const key = cacheKeyFor(this.config);
    const cached = await readRegionEndpointCache(key);
    if (cached) {
      return cached;
    }

    const response = await this.listInternalRegions<unknown>();
    const endpointByRegion = endpointMapFromRegions(response.data);
    if (endpointByRegion.size > 0) {
      return endpointByRegion;
    }

    return new Map<string, string>();
  }

  private async resolveEdgeQueryBaseUrl(queryText: string, explicitDataset: string | undefined) {
    try {
      const regionsByDataset = await this.getDatasetRegionMap();
      const datasetName =
        explicitDataset ??
        extractScopedDatasetName(queryText) ??
        inferDatasetFromKnownDatasets(queryText, regionsByDataset.keys());

      if (!datasetName) {
        return undefined;
      }

      const region = regionsByDataset.get(datasetName);
      if (!region) {
        return undefined;
      }

      const endpointByRegion = await this.getRegionEndpointMap();
      return endpointByRegion.get(region);
    } catch {
      return undefined;
    }
  }

  async queryApl<T = unknown>(dataset: string | undefined, apl: string, options: QueryAplOptions = {}) {
    if (this.config.explain) {
      recordQuery(this.config.explain, { dataset, apl, options });
    }

    const queryText = dataset ? qualifyAplWithDataset(dataset, apl) : rewriteAplDatasetShorthand(apl);
    const edgeBaseUrl = resolveEdgeRoutingEnabled()
      ? await this.resolveEdgeQueryBaseUrl(queryText, dataset)
      : undefined;

    if (edgeBaseUrl) {
      try {
        return await requestJson<T>(this.config, {
          method: 'POST',
          path: EDGE_QUERY_PATH,
          body: { apl: queryText, ...options },
          baseUrl: edgeBaseUrl,
        });
      } catch (error) {
        if (!shouldFallbackToLegacyQuery(error)) {
          throw error;
        }
      }
    }

    return requestJson<T>(this.config, {
      method: 'POST',
      path: LEGACY_QUERY_PATH,
      body: { apl: queryText, ...options },
    });
  }

  listMonitors<T = unknown>() {
    return requestJson<T>(this.config, { method: 'GET', path: '/v2/monitors' });
  }

  listInternalMonitors<T = unknown>() {
    return requestJson<T>(this.config, {
      method: 'GET',
      path: '/api/internal/monitors',
      baseUrl: deriveAppUrl(this.config.url),
    });
  }

  getMonitor<T = unknown>(id: string) {
    return requestJson<T>(this.config, {
      method: 'GET',
      path: `/v2/monitors/${encodeURIComponent(id)}`,
    });
  }

  getMonitorHistory<T = unknown>(id: string, range: MonitorHistoryRange = {}) {
    const params = new URLSearchParams();
    if (range.start) {
      params.set('startTime', range.start);
    }
    if (range.end) {
      params.set('endTime', range.end);
    }
    const query = params.toString();
    const safeId = encodeURIComponent(id);
    const path = query ? `/v2/monitors/${safeId}/history?${query}` : `/v2/monitors/${safeId}/history`;
    return requestJson<T>(this.config, { method: 'GET', path });
  }

  getMonitorsHistoryBatch<T = unknown>(monitorIds: string[], range: MonitorHistoryRange = {}) {
    const ids = monitorIds.map((id) => id.trim()).filter((id) => id.length > 0);
    const params = new URLSearchParams();
    params.set('monitorIds', ids.join(','));
    if (range.start) {
      params.set('startTime', range.start);
    }
    if (range.end) {
      params.set('endTime', range.end);
    }

    return requestJson<T>(this.config, {
      method: 'GET',
      path: `/api/internal/monitors/history?${params.toString()}`,
      baseUrl: deriveAppUrl(this.config.url),
    });
  }

}

export const clearAxiomApiClientCache = () => {
  datasetRegionCache.clear();
  regionEndpointCache.clear();
};

export const createAxiomApiClient = (config: AxiomApiClientConfig) => new AxiomApiClient(config);
