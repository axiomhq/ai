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
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  requestId?: string;
};

export const requestJson = async <T>(
  config: HttpConfig,
  options: RequestJsonOptions,
): Promise<ApiResponse<T>> => {
  const baseUrl = config.url.replace(/\/$/, '');
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
    throw new Error(`Request failed: ${options.method} ${options.path} ${response.status}`);
  }

  const data = (await response.json()) as T;
  return { data, status: response.status, requestId };
};
