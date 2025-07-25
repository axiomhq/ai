import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'aiv4';
import { createMockProvider, mockResponses } from './mock-provider-v1/mock-provider';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';
import packageJson from '../../package.json';

let memoryExporter: InMemorySpanExporter;
let tracerProvider: NodeTracerProvider;

beforeAll(() => {
  memoryExporter = new InMemorySpanExporter();
  const spanProcessor = new SimpleSpanProcessor(memoryExporter);
  tracerProvider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  });
  tracerProvider.register();

  // Initialize AxiomAI with the tracer to prevent "No tracer found" warnings
  const tracer = trace.getTracer('axiom-ai-test');
  initAxiomAI({ tracer });
});

beforeEach(() => {
  memoryExporter.reset();
});

afterAll(async () => {
  // Reset AxiomAI configuration before shutting down
  resetAxiomAI();
  
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
      'axiom.gen_ai.schema_url': 'https://axiom.co/ai/schemas/0.0.1',
      'axiom.gen_ai.sdk.name': '@axiomhq/ai',
      'axiom.gen_ai.sdk.version': packageJson.version,
      'gen_ai.prompt': '[{"role":"user","content":[{"type":"text","text":"Hello, world!"}]}]',
      'gen_ai.completion': '[{"role":"assistant","content":"Mock response"}]',
      'gen_ai.response.finish_reasons': '["stop"]',
      'gen_ai.operation.name': 'chat',
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
});
