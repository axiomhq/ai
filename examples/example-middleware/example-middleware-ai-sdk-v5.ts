import { generateText, wrapLanguageModel } from 'aiv5';
import { createOpenAI } from '@ai-sdk/openaiv2';
import { withSpan, axiomAIMiddleware, wrapAISDKModel, axiomAIMiddlewareV2 } from '@axiomhq/ai';
import { initializeTelemetry } from 'intrumentation';

initializeTelemetry();

// initialize a provider
const openai = createOpenAI({
  apiKey: process.env['OPENAI_API_KEY']!,
});

// variant 1 (recommended for the simplest setup, this calls `wrapLanguageModel` internally)
const gpt4oMini1 = wrapAISDKModel(openai('gpt-4o-mini'));

// variant 2 (recommended if you want to use other middlewares):
// - wrap the model with `wrapLanguageModel`
// - use `axiomAIMiddleware`, pass it the model
// - works with AI SDK v4 and v5, requires access to the model when creating the middleware
const model = openai('gpt-4o-mini');
const _gpt4oMini2 = wrapLanguageModel({
  model: model,
  middleware: [axiomAIMiddleware({ model })],
});

// variant 3:
// - wrap the model with `wrapLanguageModel`
// - use `axiomAIMiddlewareV2`
// - this doesn't require access to the model when creating the middleware, can be beneficial in some edge cases
const _gpt4oMini3 = wrapLanguageModel({
  model: openai('gpt-4o-mini'),
  middleware: [axiomAIMiddlewareV2()],
});

// Make a call with a span
async function main() {
  const response = await withSpan(
    { capability: 'example', step: 'generate_response' },
    async (span) => {
      span.setAttributes({ example_type: 'middleware_demo' });

      return generateText({
        model: gpt4oMini1,
        messages: [
          {
            role: 'user',
            content: 'Tell me a fun fact about space in one sentence.',
          },
        ],
      });
    },
  );

  console.log(response.text);
}

main().catch(console.error);
