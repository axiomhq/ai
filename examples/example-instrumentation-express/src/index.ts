import { setupTracing } from './instrumentation';

// be sure to call this before any other imports
setupTracing('example-express-server');

import { generateText } from 'ai';
import express, { Request, Response } from 'express';
import { gpt4oMini } from './model';
import { withSpan } from '@axiomhq/ai';

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

app.listen(port, (): void => {
  console.log(`Server running at http://localhost:${port}`);
});
