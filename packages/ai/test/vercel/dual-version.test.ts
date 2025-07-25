import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { createMockProvider } from './mock-provider-v1/mock-provider';
import { createMockProvider as createMockProviderV2 } from './mock-provider-v2/mock-provider-v2';
import { generateText } from 'aiv4';
import { generateText as generateTextV5 } from 'aiv5';
import { withSpan } from '../../src/otel/withSpan';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';

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

describe('Dual Version Support', () => {
  describe('Version Detection', () => {
    it('should detect and wrap v1 models correctly', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', {
        text: 'Hello from v1!',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 15 },
      });

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      const result = await withSpan({ capability: 'chat', step: 'generate' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello',
        });
      });

      expect(result.text).toBe('Hello from v1!');
      expect(model.specificationVersion).toBe('v1');

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].name).toBe('chat test-model');
      expect(spans[0].attributes['gen_ai.request.model']).toBe('test-model');
    });

    it('should detect and wrap v2 models correctly', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('test-model-v2', {
        content: [{ type: 'text', text: 'Hello from v2!' }],
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
      });

      const model = wrapAISDKModel(mockProvider.languageModel('test-model-v2'));

      const result = await withSpan({ capability: 'chat', step: 'generate' }, async () => {
        return await generateTextV5({
          model,
          prompt: 'Hello',
        });
      });

      expect(result.text).toBe('Hello from v2!');
      expect(model.specificationVersion).toBe('v2');

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].name).toBe('chat test-model-v2');
      expect(spans[0].attributes['gen_ai.request.model']).toBe('test-model-v2');
    });

    it('should handle unsupported models gracefully', () => {
      const unsupportedModel = {
        specificationVersion: 'v3', // Future version
        provider: 'test',
        modelId: 'test-model',
      } as any;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapped = wrapAISDKModel(unsupportedModel);

      expect(wrapped).toBe(unsupportedModel); // Should return unwrapped
      expect(consoleSpy).toHaveBeenCalledWith('Unsupported AI SDK model. Not wrapping.');

      consoleSpy.mockRestore();
    });
  });

  describe('Token Usage Mapping', () => {
    it('should map v1 token usage correctly', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', {
        text: 'Response',
        finishReason: 'stop',
        usage: { promptTokens: 20, completionTokens: 30 },
      });

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'chat', step: 'generate' }, async () => {
        return await generateText({
          model,
          prompt: 'Test prompt',
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      const span = spans[0];

      expect(span.attributes['gen_ai.usage.input_tokens']).toBe(20);
      expect(span.attributes['gen_ai.usage.output_tokens']).toBe(30);
    });

    it('should map v2 token usage correctly', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('test-model', {
        content: [{ type: 'text', text: 'Response' }],
        finishReason: 'stop',
        usage: { inputTokens: 25, outputTokens: 35, totalTokens: 60 },
      });

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'chat', step: 'generate' }, async () => {
        return await generateTextV5({
          model,
          prompt: 'Test prompt',
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      const span = spans[0];

      expect(span.attributes['gen_ai.usage.input_tokens']).toBe(25);
      expect(span.attributes['gen_ai.usage.output_tokens']).toBe(35);
    });
  });

  describe('Response Format Validation', () => {
    it('should handle different v1 finish reasons', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', {
        text: 'Response was stopped',
        finishReason: 'length',
        usage: { promptTokens: 10, completionTokens: 15 },
      });

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'chat', step: 'generate' }, async () => {
        return await generateText({
          model,
          prompt: 'Test',
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].attributes['gen_ai.response.finish_reasons']).toBe('["length"]');
    });

    it('should handle different v2 finish reasons', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('test-model', {
        content: [{ type: 'text', text: 'Response was stopped' }],
        finishReason: 'length',
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
      });

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'chat', step: 'generate' }, async () => {
        return await generateTextV5({
          model,
          prompt: 'Test',
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].attributes['gen_ai.response.finish_reasons']).toBe('["length"]');
    });
  });
});
