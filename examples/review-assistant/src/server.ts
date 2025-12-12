import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { assistant } from '@/capabilities/assistant';
import { UserReviewSchema } from '@/schemas';

const app = new Hono();

// curl -X POST http://localhost:4321/assistant -H "Content-Type: application/json" -d '{"review":"Absolutely brilliant kettle. Boils water super quick and looks gorgeous on the worktop. Had it for three months now and no issues whatsoever. The temperature control is a game changer for my green tea. I used to just boil water and wait for it to cool down, but now I can set it to exactly 80 degrees which is perfect. The build quality feels really solid and premium, especially compared to my old plastic kettle. It is quite a bit more expensive than basic models but I think its worth it for the features and design. My only minor complaint is that the water level window could be a bit easier to read, but thats really nitpicking. Would definitely recommend to anyone looking for a quality kettle.","purchase_context":"verified_purchase"}'
app.post('/assistant', async (c) => {
  try {
    const body = await c.req.json();
    const input = UserReviewSchema.parse(body);
    const result = await assistant(input);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.text(message, 500);
  }
});

serve({ fetch: app.fetch, port: 4321 });
