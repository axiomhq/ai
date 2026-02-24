import { requestJson, type HttpConfig } from './http';
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

export class AxiomApiClient {
  private config: HttpConfig;

  constructor(config: AxiomApiClientConfig) {
    this.config = config;
  }

  listDatasets<T = unknown>() {
    return requestJson<T>(this.config, { method: 'GET', path: '/v2/datasets' });
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

  queryApl<T = unknown>(dataset: string | undefined, apl: string, options: QueryAplOptions = {}) {
    if (this.config.explain) {
      recordQuery(this.config.explain, { dataset, apl, options });
    }

    const queryText = dataset ? qualifyAplWithDataset(dataset, apl) : rewriteAplDatasetShorthand(apl);

    return requestJson<T>(this.config, {
      method: 'POST',
      path: '/v1/datasets/_apl?format=legacy',
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

  getMonitorsHistoryBatch<T = unknown>(monitorIds: string[]) {
    const ids = monitorIds.map((id) => id.trim()).filter((id) => id.length > 0);
    const params = new URLSearchParams();
    params.set('monitorIds', ids.join(','));

    return requestJson<T>(this.config, {
      method: 'GET',
      path: `/api/internal/monitors/history?${params.toString()}`,
      baseUrl: deriveAppUrl(this.config.url),
    });
  }

}

export const createAxiomApiClient = (config: AxiomApiClientConfig) => new AxiomApiClient(config);
