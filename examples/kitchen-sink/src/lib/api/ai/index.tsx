import { Hono } from 'hono';

import { supportResponse } from './support-response';

export const ai = new Hono().route('/', supportResponse);
