export interface Fetcher {
  (path: string, options: RequestInit): Promise<Response>;
}

export interface FetcherOptions {
  baseUrl: string;
  token: string;
  orgId?: string;
}

export const createFetcher = ({
  baseUrl,
  token,
  orgId,
}: {
  baseUrl: string;
  token: string;
  orgId?: string;
}): Fetcher => {
  return (path: string, options: RequestInit) =>
    fetch(new URL(path, baseUrl).toString(), {
      ...options,
      headers: {
        ...options.headers,
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-axiom-check': 'good',
        ...(orgId ? { 'X-AXIOM-ORG-ID': orgId } : {}),
      },
    });
};
