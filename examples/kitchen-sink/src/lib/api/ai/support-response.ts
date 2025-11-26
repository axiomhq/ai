import { Context, Hono } from 'hono';
import {
  generateSupportResponse,
  SupportResponseRequest,
} from '@/lib/capabilities/support-agent/support-agent';

interface SupportResponseBody {
  content: string;
  context?: Record<string, string | number | boolean>;
}

const validateRequestBody = (body: unknown): body is SupportResponseBody => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'content' in body &&
    typeof (body as SupportResponseBody).content === 'string' &&
    (body as SupportResponseBody).content.trim().length > 0
  );
};

const createSupportResponseHandler = () => async (c: Context) => {
  try {
    const body = await c.req.json();

    if (!validateRequestBody(body)) {
      return c.json(
        {
          error: 'Invalid request: content is required and must be non-empty',
        },
        400,
      );
    }

    const request: SupportResponseRequest = {
      content: body.content,
      context: {
        ...body.context,
        'request.source': 'api',
      },
    };

    const result = await generateSupportResponse(request);

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
