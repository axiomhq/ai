import { Context, Hono } from 'hono';
import { runSupportAgent } from '@/lib/capabilities/support-agent/support-agent';
import { ModelMessage } from 'ai';

interface SupportResponseBody {
  messages: ModelMessage[];
  context?: Record<string, string | number | boolean>;
}

const validateRequestBody = (body: unknown): body is SupportResponseBody => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'messages' in body &&
    Array.isArray((body as SupportResponseBody).messages)
  );
};

const createSupportResponseHandler = () => async (c: Context) => {
  try {
    const body = await c.req.json();

    if (!validateRequestBody(body)) {
      return c.json(
        {
          error: 'Invalid request: messages array is required',
        },
        400,
      );
    }

    const result = await runSupportAgent(body.messages);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Support response generation failed: ', error);
    return c.json(
      {
        success: false,
        error: 'Failed to generate support response',
      },
      500,
    );
  }
};

export const supportResponse = new Hono().post('/support-response', createSupportResponseHandler());
