import { setupTracing } from './instrumentation';

// be sure to call this before any other imports
setupTracing('example-express-server');

import { generateText, streamText } from 'ai';
import type { Request, Response } from 'express';
import express from 'express';
import { gpt4oMini } from './model';
import { withSpan } from 'axiom/ai';

const app = express();
const port = 3000;

app.get('/hello/:name', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;

  const response = await withSpan(
    { capability: 'greeting', step: 'generate_greeting' },
    (span) => {
      span.setAttributes({ user_name: name || 'unknown' });

      return generateText({
        model: gpt4oMini,
        messages: [
          {
            role: 'system',
            content:
              'You are a greeter whose job is to invent a cool and creative greeting for the user',
          },
          {
            role: 'user',
            content: `Hello, my name is ${name}`,
          },
        ],
      });
    }
  );

  res.send(response.text);
});

app.get('/stream/:name', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  await withSpan(
    { capability: 'greeting', step: 'stream_greeting' },
    async (span) => {
      span.setAttributes({ user_name: name || 'unknown' });

      const stream = streamText({
        model: gpt4oMini,
        messages: [
          {
            role: 'system',
            content:
              'You are a storyteller whose job is to create an engaging short story about the the topic, which could be a person or concept',
          },
          {
            role: 'user',
            content: `Tell me a short story about ${name}`,
          },
        ],
      });

      // Keep span open during entire stream consumption
      for await (const chunk of stream.textStream) {
        res.write(chunk);
      }
    }
  );

  res.end();
});

app.listen(port, (): void => {
  console.log(`Server running at http://localhost:${port}`);
});
