import { recordRequest, type ExplainContext } from '../explain/context';

export type HttpConfig = {
  url: string;
  orgId: string;
  token: string;
  explain?: ExplainContext;
};

export type RequestJsonOptions = {
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
  baseUrl?: string;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  requestId?: string;
};

const trimOrUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const extractErrorDetail = (payload: unknown): string | undefined => {
  if (typeof payload === 'string') {
    return trimOrUndefined(payload);
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const directCandidates = [record.message, record.detail, record.error];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string') {
      const detail = trimOrUndefined(candidate);
      if (detail) {
        return detail;
      }
    }
  }

  if (record.error && typeof record.error === 'object') {
    const nestedMessage = (record.error as Record<string, unknown>).message;
    if (typeof nestedMessage === 'string') {
      const detail = trimOrUndefined(nestedMessage);
      if (detail) {
        return detail;
      }
    }
  }

  if (Array.isArray(record.errors)) {
    const first = record.errors[0];
    if (typeof first === 'string') {
      return trimOrUndefined(first);
    }
    if (first && typeof first === 'object') {
      const nestedMessage = (first as Record<string, unknown>).message;
      if (typeof nestedMessage === 'string') {
        return trimOrUndefined(nestedMessage);
      }
    }
  }

  return undefined;
};

export class AxiomApiError extends Error {
  status: number;
  method: 'GET' | 'POST';
  path: string;
  detail?: string;

  constructor(options: {
    method: 'GET' | 'POST';
    path: string;
    status: number;
    detail?: string;
  }) {
    super(`Request failed: ${options.method} ${options.path} ${options.status}`);
    this.name = 'AxiomApiError';
    this.status = options.status;
    this.method = options.method;
    this.path = options.path;
    this.detail = options.detail;
  }
}

export const requestJson = async <T>(
  config: HttpConfig,
  options: RequestJsonOptions,
): Promise<ApiResponse<T>> => {
  const baseUrl = (options.baseUrl ?? config.url).replace(/\/$/, '');
  const response = await fetch(`${baseUrl}${options.path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'X-Axiom-Org-Id': config.orgId,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const requestId = response.headers.get('x-request-id') ?? undefined;

  if (config.explain) {
    recordRequest(config.explain, {
      method: options.method,
      path: options.path,
      status: response.status,
      requestId,
    });
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const rawBody = await response.text();
      if (rawBody) {
        try {
          detail = extractErrorDetail(JSON.parse(rawBody)) ?? trimOrUndefined(rawBody);
        } catch {
          detail = trimOrUndefined(rawBody);
        }
      }
    } catch {
      detail = undefined;
    }

    throw new AxiomApiError({
      method: options.method,
      path: options.path,
      status: response.status,
      detail,
    });
  }

  const data = (await response.json()) as T;
  return { data, status: response.status, requestId };
};
