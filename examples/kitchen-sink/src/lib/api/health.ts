import { Hono } from 'hono';

export const health = new Hono().get('/health', (c) => {
  return c.json({
    message: 'AI Sandbox API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
