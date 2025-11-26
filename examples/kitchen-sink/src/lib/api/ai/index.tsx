import { Hono } from 'hono';

// import { generateText } from './generate-text';
// import { streamText } from './stream-text';
// import { generateSynthetic } from './generate-synthetic';
// import { classifyTicket } from './classify-ticket';
// import { customerOpsAgent } from './customer-ops-agent';
import { supportResponse } from './support-response';

export const ai = new Hono().route('/', supportResponse);
// .route('/', generateText)
// .route('/', streamText)
// .route('/', generateSynthetic)
// .route('/', classifyTicket)
// .route('/', customerOpsAgent)
