import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { wrapLanguageModel, streamText } from 'aiv4';
import { wrapLanguageModel as wrapLanguageModelV5, streamText as streamTextV5 } from 'aiv5';
import { generateText } from 'aiv4';
import { generateText as generateTextV5 } from 'aiv5';
import { axiomAIMiddlewareV1, axiomAIMiddlewareV2 } from '../../src/otel/middleware';
import { createMockProvider } from '../vercel/mock-provider-v1/mock-provider';
import { createMockProvider as createMockProviderV2 } from '../vercel/mock-provider-v2/mock-provider-v2';
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

  const tracer = trace.getTracer('axiom-ai-middleware-test');
  initAxiomAI({ tracer });
});

beforeEach(() => {
  memoryExporter.reset();
});

afterAll(async () => {
  resetAxiomAI();

  await tracerProvider.shutdown();
  await memoryExporter.shutdown();
});

describe('Axiom Telemetry Middleware', () => {
  describe('V1 Middleware', () => {
    it('should create V1 middleware with proper interface', () => {
      const middleware = axiomAIMiddlewareV1();
      expect(middleware).toBeDefined();
      expect(middleware.wrapGenerate).toBeDefined();
      expect(middleware.wrapStream).toBeDefined();
      expect(typeof middleware.wrapGenerate).toBe('function');
      expect(typeof middleware.wrapStream).toBe('function');
    });

    it('should instrument V1 model generate calls with proper spans and attributes', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('gpt-4', {
        text: 'Hello from middleware test!',
        finishReason: 'stop',
        usage: { promptTokens: 15, completionTokens: 25 },
      });

      const baseModel = mockProvider.languageModel('gpt-4');
      const instrumentedModel = wrapLanguageModel({
        model: baseModel,
        middleware: axiomAIMiddlewareV1(),
      });

      const result = await generateText({
        model: instrumentedModel,
        prompt: 'Test prompt',
      });

      expect(result.text).toBe('Hello from middleware test!');

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);

      const span = spans[0];
      expect(span.name).toBe('chat gpt-4');
      expect(span.attributes['gen_ai.request.model']).toBe('gpt-4');
      expect(span.attributes['gen_ai.usage.input_tokens']).toBe(15);
      expect(span.attributes['gen_ai.usage.output_tokens']).toBe(25);
      expect(span.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');
    });

    it('should instrument V1 model streaming calls', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addStreamResponse('gpt-4-stream', {
        chunks: ['Hello', ' streaming!'],
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20 },
      });

      const baseModel = mockProvider.languageModel('gpt-4-stream');
      const instrumentedModel = wrapLanguageModel({
        model: baseModel,
        middleware: axiomAIMiddlewareV1(),
      });

      const result = streamText({
        model: instrumentedModel,
        prompt: 'Test streaming',
      });

      // Consume the stream
      let fullText = '';
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      expect(fullText).toBe('Hello streaming!');

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(2); // Parent span + child stream span

      const parentSpan = spans.find((s) => s.name === 'chat gpt-4-stream');
      const childSpan = spans.find((s) => s.name === 'chat gpt-4-stream stream');

      expect(parentSpan).toBeDefined();
      expect(childSpan).toBeDefined();
      expect(parentSpan!.attributes['gen_ai.request.model']).toBe('gpt-4-stream');
    });
  });

  describe('V2 Middleware', () => {
    it('should create V2 middleware with proper interface', () => {
      const middleware = axiomAIMiddlewareV2();
      expect(middleware).toBeDefined();
      expect(middleware.wrapGenerate).toBeDefined();
      expect(middleware.wrapStream).toBeDefined();
      expect(typeof middleware.wrapGenerate).toBe('function');
      expect(typeof middleware.wrapStream).toBe('function');
    });

    it('should instrument V2 model generate calls with proper spans and attributes', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('claude-3', {
        content: [{ type: 'text', text: 'Hello from V2 middleware test!' }],
        finishReason: 'stop',
        usage: { inputTokens: 20, outputTokens: 30, totalTokens: 50 },
      });

      const baseModel = mockProvider.languageModel('claude-3');
      const instrumentedModel = wrapLanguageModelV5({
        model: baseModel,
        middleware: axiomAIMiddlewareV2(),
      });

      const result = await generateTextV5({
        model: instrumentedModel,
        prompt: 'Test V2 prompt',
      });

      expect(result.text).toBe('Hello from V2 middleware test!');

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);

      const span = spans[0];
      expect(span.name).toBe('chat claude-3');
      expect(span.attributes['gen_ai.request.model']).toBe('claude-3');
      // Note: gen_ai.system is not set by mock provider
      expect(span.attributes['gen_ai.usage.input_tokens']).toBe(20);
      expect(span.attributes['gen_ai.usage.output_tokens']).toBe(30);
      expect(span.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');
    });

    it('should instrument V2 model streaming calls', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addStreamResponse('claude-3-stream', {
        chunks: ['Streaming', ' response!'],
        finishReason: 'stop',
        usage: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
      });

      const baseModel = mockProvider.languageModel('claude-3-stream');
      const instrumentedModel = wrapLanguageModelV5({
        model: baseModel,
        middleware: axiomAIMiddlewareV2(),
      });

      const result = streamTextV5({
        model: instrumentedModel,
        prompt: 'Test V2 streaming',
      });

      // Consume the stream
      let fullText = '';
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      expect(fullText).toBe('Streaming response!');

      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(2); // Parent span + child stream span

      const parentSpan = spans.find((s) => s.name === 'chat claude-3-stream');
      const childSpan = spans.find((s) => s.name === 'chat claude-3-stream stream');

      expect(parentSpan).toBeDefined();
      expect(childSpan).toBeDefined();
      expect(parentSpan!.attributes['gen_ai.request.model']).toBe('claude-3-stream');
    });
  });

  describe('Error Handling', () => {
    it('should handle V1 model errors gracefully', async () => {
      const mockProvider = createMockProvider();
      const baseModel = mockProvider.languageModel('error-model');

      // Override doGenerate to throw an error
      baseModel.doGenerate = async () => {
        throw new Error('Test error');
      };

      const instrumentedModel = wrapLanguageModel({
        model: baseModel,
        middleware: axiomAIMiddlewareV1(),
      });

      await expect(
        generateText({
          model: instrumentedModel,
          prompt: 'This should fail',
        }),
      ).rejects.toThrow('Test error');

      // Verify span was created with error status
      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);

      const span = spans[0];
      expect(span.name).toBe('chat error-model');
      expect(span.status.code).toBe(SpanStatusCode.ERROR);
      expect(span.status.message).toBe('Test error');

      // Check that the span has events recording the error
      const errorEvents = span.events.filter((event) => event.name === 'exception');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].attributes?.['exception.message']).toBe('Test error');
      expect(errorEvents[0].attributes?.['exception.type']).toBe('Error');
    });

    it('should handle V2 model errors gracefully', async () => {
      const mockProvider = createMockProviderV2();
      const baseModel = mockProvider.languageModel('error-model-v2');

      // Override doGenerate to throw an error
      baseModel.doGenerate = async () => {
        throw new Error('Test V2 error');
      };

      const instrumentedModel = wrapLanguageModelV5({
        model: baseModel,
        middleware: axiomAIMiddlewareV2(),
      });

      await expect(
        generateTextV5({
          model: instrumentedModel,
          prompt: 'This should fail',
        }),
      ).rejects.toThrow('Test V2 error');

      // Verify span was created with error status
      const spans = memoryExporter.getFinishedSpans();
      expect(spans).toHaveLength(1);

      const span = spans[0];
      expect(span.name).toBe('chat error-model-v2');
      expect(span.status.code).toBe(SpanStatusCode.ERROR);
      expect(span.status.message).toBe('Test V2 error');

      // Check that the span has events recording the error
      const errorEvents = span.events.filter((event) => event.name === 'exception');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].attributes?.['exception.message']).toBe('Test V2 error');
      expect(errorEvents[0].attributes?.['exception.type']).toBe('Error');
    });
  });
});
