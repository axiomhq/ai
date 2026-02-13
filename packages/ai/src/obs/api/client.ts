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

export type ObsApiClientConfig = Omit<HttpConfig, 'explain'> & {
  explain?: ExplainContext;
};

const escapeAplDataset = (dataset: string) => dataset.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const aplIsDatasetScoped = (apl: string) => /^\s*\[\s*['"][^'"]+['"]\s*\]\s*\|/.test(apl.trim());

const qualifyAplWithDataset = (dataset: string, apl: string) => {
  if (aplIsDatasetScoped(apl)) {
    return apl.trim();
  }
  return `['${escapeAplDataset(dataset)}'] | ${apl.trim()}`;
};

export class ObsApiClient {
  private config: HttpConfig;

  constructor(config: ObsApiClientConfig) {
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

  queryApl<T = unknown>(dataset: string, apl: string, options: QueryAplOptions = {}) {
    if (this.config.explain) {
      recordQuery(this.config.explain, { dataset, apl, options });
    }

    const qualifiedApl = qualifyAplWithDataset(dataset, apl);

    return requestJson<T>(this.config, {
      method: 'POST',
      path: '/v1/datasets/_apl?format=legacy',
      body: { apl: qualifiedApl, ...options },
    });
  }

  listMonitors<T = unknown>() {
    return requestJson<T>(this.config, { method: 'GET', path: '/v2/monitors' });
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
      params.set('start', range.start);
    }
    if (range.end) {
      params.set('end', range.end);
    }
    const query = params.toString();
    const safeId = encodeURIComponent(id);
    const path = query ? `/v2/monitors/${safeId}/history?${query}` : `/v2/monitors/${safeId}/history`;
    return requestJson<T>(this.config, { method: 'GET', path });
  }

  listSavedQueries<T = unknown>() {
    return requestJson<T>(this.config, { method: 'GET', path: '/v2/saved-queries' });
  }

  getSavedQuery<T = unknown>(id: string) {
    return requestJson<T>(this.config, {
      method: 'GET',
      path: `/v2/saved-queries/${encodeURIComponent(id)}`,
    });
  }
}

export const createObsApiClient = (config: ObsApiClientConfig) => new ObsApiClient(config);
