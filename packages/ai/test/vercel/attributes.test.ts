import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'ai';
import { createMockProvider, mockResponses } from './mock-provider/mock-provider';

let memoryExporter: InMemorySpanExporter;
let tracerProvider: NodeTracerProvider;

beforeAll(() => {
  memoryExporter = new InMemorySpanExporter();
  const spanProcessor = new SimpleSpanProcessor(memoryExporter);
  tracerProvider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  });
  tracerProvider.register();
});

beforeEach(() => {
  memoryExporter.reset();
});

afterAll(async () => {
  await tracerProvider.shutdown();
  await memoryExporter.shutdown();
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

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes).toEqual({
      /**
       * 🚨 This is not yet the final shape we want the sdk to have
       * So update this as we get closer to the attributes we like
       */
      'gen_ai.prompt': '[{"role":"user","content":[{"type":"text","text":"Hello, world!"}]}]',
      'gen_ai.completion': '[{"role":"assistant","content":"Mock response"}]',
      // '{\"choices\":[{\"index\":0,\"message\":{\"role\":\"assistant\",\"content\":\"Mock response\"},\"finish_reason\":\"stop\"}]}',
      'gen_ai.response.finish_reasons': '["stop"]',
      'gen_ai.operation.name': 'chat',
      'gen_ai.capability.name': 'test-capability',
      'gen_ai.step.name': 'test-step',
      'gen_ai.output.type': 'text',
      'gen_ai.request.model': 'model-name',
      'gen_ai.request.temperature': 0,
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'mock-model',
      'gen_ai.response.provider_metadata': '{}',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 20,
    });
  });
});
