import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

export const createApiClient = (baseUrl: string) => {
  return hc<AppType>(baseUrl);
};

export const apiClient = createApiClient('/');
export const evalApiClient = createApiClient('http://localhost:3000');
