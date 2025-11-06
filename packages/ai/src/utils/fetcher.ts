export interface Fetcher {
  (path: string, options: RequestInit): Promise<Response>;
}

export const createFetcher = (baseUrl: string, token: string): Fetcher => {
  return (path: string, options: RequestInit) =>
    fetch(new URL(path, baseUrl).toString(), {
      ...options,
      headers: {
        ...options.headers,
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-axiom-check': 'good',
      },
    });
};
