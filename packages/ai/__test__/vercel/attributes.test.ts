import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'ai';
import { createMockProvider, mockResponses } from './mock-provider/mock-provider';
import { initAxiomAI } from '../../src/otel/shared';
import { SpanKind } from '@opentelemetry/api';

let memoryExporter: InMemorySpanExporter;
let tracerProvider: NodeTracerProvider;

beforeAll(() => {
  memoryExporter = new InMemorySpanExporter();
  const spanProcessor = new SimpleSpanProcessor(memoryExporter);
  tracerProvider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  });
  tracerProvider.register();
  initAxiomAI();
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

    await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
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
      'gen_ai.completion': '{"role":"assistant","content":"Mock response"}',
      // '{\"choices\":[{\"index\":0,\"message\":{\"role\":\"assistant\",\"content\":\"Mock response\"},\"finish_reason\":\"stop\"}]}',
      'gen_ai.response.finish_reasons': '["stop"]',
      'gen_ai.operation.name': 'chat',
      'gen_ai.operation.task_name': 'test-task',
      'gen_ai.operation.workflow_name': 'test-workflow',
      'gen_ai.output.type': 'text',
      'gen_ai.provider': 'mock-provider',
      'gen_ai.request.input_format': 'prompt',
      'gen_ai.request.mode_type': 'regular',
      'gen_ai.request.model': 'model-name',
      'gen_ai.request.temperature': 0,
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'mock-model',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 20,
    });
  });
});
