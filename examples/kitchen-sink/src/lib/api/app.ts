import { Hono, type Context, type Next } from 'hono';
import { handle } from 'hono/vercel';
import { getCurrentTraceId } from '@/lib/utilities/get-current-trace-id';

const observabilityMiddleware = async (c: Context, next: Next) => {
  await next();

  const traceId = getCurrentTraceId();
  if (traceId) {
    c.header('X-Trace-Id', traceId);
  }
};

// Base app with shared middleware
export const createApiApp = () => {
  return new Hono().basePath('/api').use(observabilityMiddleware);
};

// Export handlers for Next.js
export const createApiHandlers = (app: Hono) => ({
  GET: handle(app),
  POST: handle(app),
  PUT: handle(app),
  DELETE: handle(app),
  PATCH: handle(app),
});
