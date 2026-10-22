import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { generateText as generateTextV4, streamText as streamTextV4 } from 'aiv4';
import { generateText as generateTextV5, streamText as streamTextV5 } from 'aiv5';
import { generateText as generateTextV6, streamText as streamTextV6 } from 'aiv6';
import { createAnthropic as createAnthropicV1 } from '@ai-sdk/anthropicv1';
import { createAnthropic as createAnthropicV2 } from '@ai-sdk/anthropicv2';
import { createAnthropic as createAnthropicV3 } from '@ai-sdk/anthropicv3';
import { createOpenAI as createOpenAIV1 } from '@ai-sdk/openaiv1';
import { createOpenAI as createOpenAIV2 } from '@ai-sdk/openaiv2';
import { createOpenAI as createOpenAIV3 } from '@ai-sdk/openaiv3';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { createMockProvider as createMockProviderV3 } from '../vercel/mock-provider-v3/mock-provider-v3';
import { createOtelTestSetup } from '../helpers/otel-test-setup';

const INPUT = 'gen_ai.usage.input_tokens';
const OUTPUT = 'gen_ai.usage.output_tokens';
const CACHE_READ = 'gen_ai.usage.cache_read.input_tokens';
const CACHE_CREATION = 'gen_ai.usage.cache_creation.input_tokens';
const REASONING = 'gen_ai.usage.reasoning.output_tokens';

const otelTestSetup = createOtelTestSetup();

beforeAll(() => {
  otelTestSetup.setup();
});

beforeEach(() => {
  otelTestSetup.reset();
});

afterAll(async () => {
  await otelTestSetup.cleanup();
});

type AnthropicUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

type OpenAIUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: { cached_tokens: number };
  completion_tokens_details?: { reasoning_tokens: number };
};

/** Returns the queued bodies in order, one per request, as the provider's HTTP API would. */
function queuedFetch(bodies: Array<{ json: unknown } | { sse: unknown[] }>): typeof fetch {
  let index = 0;
  return (async () => {
    const body = bodies[index++];
    if (!body) throw new Error('No mock response queued');
    if ('json' in body) {
      return new Response(JSON.stringify(body.json), {
        headers: { 'content-type': 'application/json' },
      });
    }
    const text = body.sse.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('');
    return new Response(text, { headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;
}

function anthropicMessage(usage: AnthropicUsage) {
  return {
    json: {
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-sonnet-4-5',
      content: [{ type: 'text', text: 'Hello' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage,
    },
  };
}

function anthropicStream(usage: AnthropicUsage) {
  const { output_tokens, ...startUsage } = usage;
  return {
    sse: [
      {
        type: 'message_start',
        message: {
          id: 'msg_1',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-5',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { ...startUsage, output_tokens: 1 },
        },
      },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello' } },
      { type: 'content_block_stop', index: 0 },
      {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens },
      },
      { type: 'message_stop' },
    ],
  };
}

function openaiChatCompletion(usage: OpenAIUsage) {
  return {
    json: {
      id: 'chatcmpl-1',
      object: 'chat.completion',
      created: 1_700_000_000,
      model: 'gpt-4o',
      choices: [
        { index: 0, message: { role: 'assistant', content: 'Hello' }, finish_reason: 'stop' },
      ],
      usage,
    },
  };
}

const sdkVersions = [
  {
    sdk: 'AI SDK v4 (LanguageModelV1)',
    anthropic: (fetch: typeof globalThis.fetch) =>
      createAnthropicV1({ apiKey: 'test', fetch })('claude-sonnet-4-5'),
    openai: (fetch: typeof globalThis.fetch) =>
      createOpenAIV1({ apiKey: 'test', fetch }).chat('gpt-4o'),
    generateText: generateTextV4 as any,
    streamText: streamTextV4 as any,
    openaiReportsMissingDetailsAsZero: false,
  },
  {
    sdk: 'AI SDK v5 (LanguageModelV2)',
    anthropic: (fetch: typeof globalThis.fetch) =>
      createAnthropicV2({ apiKey: 'test', fetch })('claude-sonnet-4-5'),
    openai: (fetch: typeof globalThis.fetch) =>
      createOpenAIV2({ apiKey: 'test', fetch }).chat('gpt-4o'),
    generateText: generateTextV5 as any,
    streamText: streamTextV5 as any,
    openaiReportsMissingDetailsAsZero: false,
  },
  {
    sdk: 'AI SDK v6 (LanguageModelV3)',
    anthropic: (fetch: typeof globalThis.fetch) =>
      createAnthropicV3({ apiKey: 'test', fetch })('claude-sonnet-4-5'),
    openai: (fetch: typeof globalThis.fetch) =>
      createOpenAIV3({ apiKey: 'test', fetch }).chat('gpt-4o'),
    generateText: generateTextV6 as any,
    streamText: streamTextV6 as any,
    // @ai-sdk/openai v3 sets cacheRead and reasoning to 0 when the response omits the details
    openaiReportsMissingDetailsAsZero: true,
  },
];

function findSpan(name: string): ReadableSpan {
  const span = otelTestSetup.getSpans().find((s) => s.name === name);
  expect(span).toBeDefined();
  return span!;
}

describe.each(sdkVersions)('cache and reasoning token usage: $sdk', (variant) => {
  it('reports Anthropic input tokens including cache reads and writes', async () => {
    const model = wrapAISDKModel(
      variant.anthropic(
        queuedFetch([
          anthropicMessage({
            input_tokens: 1_200,
            output_tokens: 800,
            cache_creation_input_tokens: 2_000,
            cache_read_input_tokens: 40_000,
          }),
        ]),
      ),
    );

    await variant.generateText({ model, prompt: 'Hi' });

    const span = findSpan('chat claude-sonnet-4-5');
    expect(span.attributes[INPUT]).toBe(43_200);
    expect(span.attributes[CACHE_READ]).toBe(40_000);
    expect(span.attributes[CACHE_CREATION]).toBe(2_000);
    expect(span.attributes[OUTPUT]).toBe(800);
    expect(span.attributes[REASONING]).toBeUndefined();
  });

  it('reports Anthropic cache usage on the parent and stream spans when streaming', async () => {
    const model = wrapAISDKModel(
      variant.anthropic(
        queuedFetch([
          anthropicStream({
            input_tokens: 1_200,
            output_tokens: 800,
            cache_creation_input_tokens: 2_000,
            cache_read_input_tokens: 40_000,
          }),
        ]),
      ),
    );

    const result = variant.streamText({ model, prompt: 'Hi' });
    let text = '';
    for await (const chunk of result.textStream) text += chunk;
    expect(text).toBe('Hello');

    for (const span of [
      findSpan('chat claude-sonnet-4-5'),
      findSpan('chat claude-sonnet-4-5 stream'),
    ]) {
      expect(span.attributes[INPUT]).toBe(43_200);
      expect(span.attributes[CACHE_READ]).toBe(40_000);
      expect(span.attributes[CACHE_CREATION]).toBe(2_000);
      expect(span.attributes[OUTPUT]).toBe(800);
    }
  });

  it('accumulates cache usage across calls that share a withSpan span', async () => {
    const model = wrapAISDKModel(
      variant.anthropic(
        queuedFetch([
          anthropicMessage({
            input_tokens: 50,
            output_tokens: 10,
            cache_creation_input_tokens: 2_000,
            cache_read_input_tokens: 0,
          }),
          anthropicMessage({
            input_tokens: 60,
            output_tokens: 20,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 2_000,
          }),
        ]),
      ),
    );

    await withSpan({ capability: 'test', step: 'cache' }, async () => {
      await variant.generateText({ model, prompt: 'First' });
      await variant.generateText({ model, prompt: 'Second' });
    });

    const span = findSpan('chat claude-sonnet-4-5');
    expect(span.attributes[INPUT]).toBe(2_050 + 2_060);
    expect(span.attributes[CACHE_READ]).toBe(2_000);
    expect(span.attributes[CACHE_CREATION]).toBe(2_000);
    expect(span.attributes[OUTPUT]).toBe(30);
  });

  it('reports OpenAI cached and reasoning tokens without changing the totals', async () => {
    const model = wrapAISDKModel(
      variant.openai(
        queuedFetch([
          openaiChatCompletion({
            prompt_tokens: 10_000,
            completion_tokens: 500,
            total_tokens: 10_500,
            prompt_tokens_details: { cached_tokens: 8_000 },
            completion_tokens_details: { reasoning_tokens: 300 },
          }),
        ]),
      ),
    );

    await variant.generateText({ model, prompt: 'Hi' });

    const span = findSpan('chat gpt-4o');
    expect(span.attributes[INPUT]).toBe(10_000);
    expect(span.attributes[CACHE_READ]).toBe(8_000);
    expect(span.attributes[CACHE_CREATION]).toBeUndefined();
    expect(span.attributes[OUTPUT]).toBe(500);
    expect(span.attributes[REASONING]).toBe(300);
  });

  it('passes through OpenAI usage without token details', async () => {
    const model = wrapAISDKModel(
      variant.openai(
        queuedFetch([
          openaiChatCompletion({
            prompt_tokens: 1_000,
            completion_tokens: 100,
            total_tokens: 1_100,
          }),
        ]),
      ),
    );

    await variant.generateText({ model, prompt: 'Hi' });

    const span = findSpan('chat gpt-4o');
    expect(span.attributes[INPUT]).toBe(1_000);
    expect(span.attributes[OUTPUT]).toBe(100);
    expect(span.attributes).not.toHaveProperty(CACHE_CREATION);
    if (variant.openaiReportsMissingDetailsAsZero) {
      expect(span.attributes[CACHE_READ]).toBe(0);
      expect(span.attributes[REASONING]).toBe(0);
    } else {
      expect(span.attributes).not.toHaveProperty(CACHE_READ);
      expect(span.attributes).not.toHaveProperty(REASONING);
    }
  });
});

describe('cache and reasoning token usage: LanguageModelV3 usage fields', () => {
  it('maps inputTokens.cacheRead/cacheWrite and outputTokens.reasoning directly', async () => {
    const mockProvider = createMockProviderV3();
    mockProvider.addLanguageModelResponse('test-model', {
      content: [{ type: 'text', text: 'Hello' }],
      finishReason: { unified: 'stop', raw: undefined },
      usage: {
        inputTokens: { total: 900, noCache: 100, cacheRead: 700, cacheWrite: 100 },
        outputTokens: { total: 50, text: 20, reasoning: 30 },
      },
    });

    await generateTextV6({
      model: wrapAISDKModel(mockProvider.languageModel('test-model')),
      prompt: 'Hi',
    });

    const span = findSpan('chat test-model');
    expect(span.attributes[INPUT]).toBe(900);
    expect(span.attributes[CACHE_READ]).toBe(700);
    expect(span.attributes[CACHE_CREATION]).toBe(100);
    expect(span.attributes[OUTPUT]).toBe(50);
    expect(span.attributes[REASONING]).toBe(30);
  });

  it('omits cache and reasoning attributes when the counts are undefined', async () => {
    const mockProvider = createMockProviderV3();
    mockProvider.addLanguageModelResponse('test-model', {
      content: [{ type: 'text', text: 'Hello' }],
      finishReason: { unified: 'stop', raw: undefined },
      usage: { inputTokens: { total: 900 }, outputTokens: { total: 50 } },
    });

    await generateTextV6({
      model: wrapAISDKModel(mockProvider.languageModel('test-model')),
      prompt: 'Hi',
    });

    const span = findSpan('chat test-model');
    expect(span.attributes[INPUT]).toBe(900);
    expect(span.attributes[OUTPUT]).toBe(50);
    expect(span.attributes).not.toHaveProperty(CACHE_READ);
    expect(span.attributes).not.toHaveProperty(CACHE_CREATION);
    expect(span.attributes).not.toHaveProperty(REASONING);
  });
});
