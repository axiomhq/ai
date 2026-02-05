import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'aiv4';
import { createMockProvider, mockResponses } from './mock-provider-v1/mock-provider';
import packageJson from '../../package.json';
import { createOtelTestSetup } from '../helpers/otel-test-setup';

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

describe('span names', () => {
  it('should name the span after the model when wrapped in withSpan', async () => {
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, world!'));
    const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Hello, world!',
      });
    });

    const spans = otelTestSetup.getSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes).toEqual({
      'axiom.gen_ai.schema_url': 'https://axiom.co/ai/schemas/0.0.2',
      'axiom.gen_ai.sdk.name': 'axiom',
      'axiom.gen_ai.sdk.version': packageJson.version,
      'gen_ai.input.messages':
        '[{"role":"user","content":[{"type":"text","text":"Hello, world!"}]}]',
      'gen_ai.output.messages': '[{"role":"assistant","content":"Mock response"}]',
      'gen_ai.response.finish_reasons': '["stop"]',
      'gen_ai.operation.name': 'chat',
      'gen_ai.provider.name': 'mock',
      'gen_ai.capability.name': 'test-capability',
      'gen_ai.step.name': 'test-step',
      'gen_ai.output.type': 'text',
      'gen_ai.request.model': 'model-name',
      'gen_ai.request.temperature': 0,
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'mock-model',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 20,
    });
  });

  it('should set gen_ai.conversation.id from withSpan metadata', async () => {
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, world!'));
    const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

    await withSpan(
      { capability: 'test-capability', step: 'test-step', conversationId: 'conv-123' },
      async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      },
    );

    const spans = otelTestSetup.getSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes['gen_ai.conversation.id']).toBe('conv-123');
  });
});
