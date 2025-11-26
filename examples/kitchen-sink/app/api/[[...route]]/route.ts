import { createApiApp, createApiHandlers } from '@/lib/api/app';
import { health } from '@/lib/api/health';
import { ai } from '@/lib/api/ai';

export const runtime = 'nodejs';

const app = createApiApp().route('/', health).route('/', ai);

export type AppType = typeof app;
export const { GET, POST, PUT, DELETE, PATCH } = createApiHandlers(app);
