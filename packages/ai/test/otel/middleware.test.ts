import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { SpanStatusCode } from '@opentelemetry/api';
import { wrapLanguageModel, streamText, generateText } from 'aiv4';
import {
  wrapLanguageModel as wrapLanguageModelV5,
  streamText as streamTextV5,
  generateText as generateTextV5,
} from 'aiv5';
import {
  axiomAIMiddlewareV1,
  axiomAIMiddlewareV2,
  axiomAIMiddleware,
} from '../../src/otel/middleware';
import { createMockProvider } from '../vercel/mock-provider-v1/mock-provider';
import { createMockProvider as createMockProviderV2 } from '../vercel/mock-provider-v2/mock-provider-v2';
import { createOtelTestSetup } from '../helpers/otel-test-setup';

const otelTestSetup = createOtelTestSetup();

// Helper to convert OpenTelemetry HrTime [seconds, nanoseconds] to BigInt nanoseconds
const hrTimeToNanos = ([seconds, nanos]: [number, number]): bigint => {
  return BigInt(seconds) * 1_000_000_000n + BigInt(nanos);
};

// Test variants for V1 and V2 middleware - only difference is response shape
const middlewareVariants = [
  {
    version: 'V1',
    createProvider: createMockProvider,
    wrapModel: wrapLanguageModel as any,
    streamText: streamText as any,
    generateText: generateText as any,
    middleware: () => axiomAIMiddlewareV1() as any,
    // V1 response shape
    createGenerateResponse: (text: string) => ({
      text,
      finishReason: 'stop' as const,
      usage: { promptTokens: 15, completionTokens: 25 },
    }),
    createStreamResponse: (chunks: string[]) => ({
      chunks,
      finishReason: 'stop' as const,
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  },
  {
    version: 'V2',
    createProvider: createMockProviderV2,
    wrapModel: wrapLanguageModelV5 as any,
    streamText: streamTextV5 as any,
    generateText: generateTextV5 as any,
    middleware: () => axiomAIMiddlewareV2() as any,
    // V2 response shape (different structure, same token values)
    createGenerateResponse: (text: string) => ({
      content: [{ type: 'text' as const, text }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
    }),
    createStreamResponse: (chunks: string[]) => ({
      chunks,
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    }),
  },
];

beforeAll(() => {
  otelTestSetup.setup();
});

beforeEach(() => {
  otelTestSetup.reset();
});

afterAll(async () => {
  await otelTestSetup.cleanup();
});

describe('Axiom Telemetry Middleware', () => {
  describe.each(middlewareVariants)('$version Middleware', (variant) => {
    it('should create middleware with proper interface', () => {
      const middleware = variant.middleware();
      expect(middleware).toBeDefined();
      expect(middleware.wrapGenerate).toBeDefined();
      expect(middleware.wrapStream).toBeDefined();
      expect(typeof middleware.wrapGenerate).toBe('function');
      expect(typeof middleware.wrapStream).toBe('function');
    });

    it('should instrument model generate calls with proper spans and attributes', async () => {
      const mockProvider = variant.createProvider();
      const response = variant.createGenerateResponse('Hello from middleware test!');
      mockProvider.addLanguageModelResponse('test-model', response as any);

      const baseModel = mockProvider.languageModel('test-model');
      const instrumentedModel = variant.wrapModel({
        model: baseModel,
        middleware: variant.middleware(),
      });

      const result = await (variant.generateText as any)({
        model: instrumentedModel,
        prompt: 'Test prompt',
      });

      expect(result.text).toBe('Hello from middleware test!');

      const spans = otelTestSetup.getSpans();
      expect(spans).toHaveLength(1);

      const span = spans[0];
      expect(span.name).toBe('chat test-model');
      expect(span.attributes['gen_ai.request.model']).toBe('test-model');
      expect(span.attributes['gen_ai.usage.input_tokens']).toBe(15);
      expect(span.attributes['gen_ai.usage.output_tokens']).toBe(25);
      expect(span.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');
    });

    it('should instrument model streaming calls', async () => {
      const mockProvider = variant.createProvider();
      const streamResponse = variant.createStreamResponse(['Hello', ' streaming!']);
      mockProvider.addStreamResponse('test-stream-model', streamResponse as any);

      const baseModel = mockProvider.languageModel('test-stream-model');
      const instrumentedModel = variant.wrapModel({
        model: baseModel,
        middleware: variant.middleware(),
      });

      const result = (variant.streamText as any)({
        model: instrumentedModel,
        prompt: 'Test streaming',
      });

      // Consume the stream
      let fullText = '';
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      expect(fullText).toBe('Hello streaming!');

      const spans = otelTestSetup.getSpans();
      expect(spans).toHaveLength(2); // Parent span + child stream span

      const parentSpan = spans.find((s) => s.name === 'chat test-stream-model');
      const childSpan = spans.find((s) => s.name === 'chat test-stream-model stream');

      expect(parentSpan).toBeDefined();
      expect(childSpan).toBeDefined();
      expect(parentSpan!.attributes['gen_ai.request.model']).toBe('test-stream-model');
    });

    it('should keep parent span open until stream completes and set token usage attributes', async () => {
      const mockProvider = variant.createProvider();
      const streamResponse = variant.createStreamResponse(['Hello', ' streaming!']);
      mockProvider.addStreamResponse('test-stream-model', streamResponse as any);

      const baseModel = mockProvider.languageModel('test-stream-model');
      const instrumentedModel = variant.wrapModel({
        model: baseModel,
        middleware: variant.middleware(),
      });

      const result = (variant.streamText as any)({
        model: instrumentedModel,
        prompt: 'Test streaming',
      });

      // Consume the stream
      let fullText = '';
      let afterFirstChunk = false;
      for await (const chunk of result.textStream) {
        fullText += chunk;

        // Mid-stream assertion: parent span should not be finished yet
        if (fullText === 'Hello' && !afterFirstChunk) {
          afterFirstChunk = true;
          const midStreamSpans = otelTestSetup.getSpans();
          const midStreamParent = midStreamSpans.find((s) => s.name === 'chat test-stream-model');
          // Parent span should NOT be in finished spans yet during streaming
          expect(midStreamParent).toBeUndefined();
        }
      }

      expect(fullText).toBe('Hello streaming!');

      const spans = otelTestSetup.getSpans();
      expect(spans).toHaveLength(2); // Parent span + child stream span

      const parentSpan = spans.find((s) => s.name === 'chat test-stream-model');
      const childSpan = spans.find((s) => s.name === 'chat test-stream-model stream');

      expect(parentSpan).toBeDefined();
      expect(childSpan).toBeDefined();

      // Parent-child linkage verification: child and parent should share the same trace ID
      expect(childSpan!.spanContext().traceId).toBe(parentSpan!.spanContext().traceId);
      // Child span should have the parent's span ID as its parent (if available)
      if ((childSpan as any).parentSpanId) {
        expect((childSpan as any).parentSpanId).toBe(parentSpan!.spanContext().spanId);
      }

      // Critical: Parent span should have token usage attributes
      expect(parentSpan!.attributes['gen_ai.usage.input_tokens']).toBe(10);
      expect(parentSpan!.attributes['gen_ai.usage.output_tokens']).toBe(20);
      expect(parentSpan!.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');

      expect(parentSpan!.endTime).toBeDefined();
      expect(childSpan!.endTime).toBeDefined();
      expect(parentSpan!.startTime).toBeDefined();
      expect(childSpan!.startTime).toBeDefined();

      // Verify parent span ended AFTER child span started (correct lifecycle) with nanosecond precision
      expect(hrTimeToNanos(parentSpan!.startTime)).toBeLessThanOrEqual(
        hrTimeToNanos(childSpan!.startTime),
      );
      expect(hrTimeToNanos(parentSpan!.endTime)).toBeGreaterThanOrEqual(
        hrTimeToNanos(childSpan!.endTime),
      );
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
      const spans = otelTestSetup.getSpans();
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
      const spans = otelTestSetup.getSpans();
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

  describe('Span Ownership & Lifecycle (Priority 1 - Critical for Refactor)', () => {
    describe('withSpan integration - middleware must not end user-owned spans', () => {
      it('should not end user-owned span during streaming (V1)', async () => {
        // CRITICAL: This test verifies behavior when a streaming call is wrapped in withSpan().
        // In the CURRENT implementation, the middleware DOES reuse the span but currently
        // doesn't know it shouldn't manage its lifecycle. After refactoring to SpanLease,
        // this test should pass with spanEndCalledByMiddleware === false.
        const { withSpan } = await import('../../src/otel/withSpan');
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

        await withSpan({ capability: 'test', step: 'stream' }, async (span) => {
          const result = streamText({
            model: instrumentedModel,
            prompt: 'Test streaming',
          });

          // Consume the stream completely
          let fullText = '';
          for await (const chunk of result.textStream) {
            fullText += chunk;
          }

          expect(fullText).toBe('Hello streaming!');

          // Verify the span is still recording (not ended yet by middleware)
          expect(span.isRecording()).toBe(true);
        });

        // After withSpan completes, spans should be properly ended
        const spans = otelTestSetup.getSpans();
        expect(spans.length).toBeGreaterThan(0);
        const parentSpan = spans.find((s) => s.name === 'chat gpt-4-stream');
        expect(parentSpan).toBeDefined();
        expect(parentSpan!.endTime).toBeDefined();
      });

      it('should not end user-owned span during streaming (V2)', async () => {
        // CRITICAL: Same test for V2 middleware
        const { withSpan } = await import('../../src/otel/withSpan');
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

        await withSpan({ capability: 'test', step: 'stream' }, async (span) => {
          const result = streamTextV5({
            model: instrumentedModel,
            prompt: 'Test V2 streaming',
          });

          let fullText = '';
          for await (const chunk of result.textStream) {
            fullText += chunk;
          }

          expect(fullText).toBe('Streaming response!');

          // Verify the span is still recording (not ended yet by middleware)
          expect(span.isRecording()).toBe(true);
        });

        const spans = otelTestSetup.getSpans();
        expect(spans.length).toBeGreaterThan(0);
        const parentSpan = spans.find((s) => s.name === 'chat claude-3-stream');
        expect(parentSpan).toBeDefined();
        expect(parentSpan!.endTime).toBeDefined();
      });

      it.skip('should handle errors in user-owned spans correctly (V1)', async () => {
        // CRITICAL: When errors occur during streaming with withSpan,
        // the span should be marked with error status and properly ended by withSpan
        const { withSpan } = await import('../../src/otel/withSpan');
        const mockProvider = createMockProvider();
        const baseModel = mockProvider.languageModel('error-stream');

        // Make doStream throw an error
        baseModel.doStream = async () => {
          throw new Error('Stream error');
        };

        const instrumentedModel = wrapLanguageModel({
          model: baseModel,
          middleware: axiomAIMiddlewareV1(),
        });

        await expect(
          withSpan({ capability: 'test', step: 'stream-error' }, async (_span) => {
            const result = await streamText({
              model: instrumentedModel,
              prompt: 'This will error',
            });

            // Error happens when we try to consume the stream
            for await (const _chunk of result.textStream) {
              // This will throw
            }
          }),
        ).rejects.toThrow('Stream error');

        // Verify error was properly recorded
        const spans = otelTestSetup.getSpans();
        expect(spans.length).toBeGreaterThan(0);
        const span = spans[0];
        expect(span.status.code).toBe(SpanStatusCode.ERROR);
        expect(span.endTime).toBeDefined();
      });

      it.skip('should handle errors in user-owned spans correctly (V2)', async () => {
        const { withSpan } = await import('../../src/otel/withSpan');
        const mockProvider = createMockProviderV2();
        const baseModel = mockProvider.languageModel('error-stream-v2');

        baseModel.doStream = async () => {
          throw new Error('Stream error V2');
        };

        const instrumentedModel = wrapLanguageModelV5({
          model: baseModel,
          middleware: axiomAIMiddlewareV2(),
        });

        await expect(
          withSpan({ capability: 'test', step: 'stream-error' }, async (_span) => {
            const result = await streamTextV5({
              model: instrumentedModel,
              prompt: 'This will error',
            });

            // Error happens when we try to consume the stream
            for await (const _chunk of result.textStream) {
              // This will throw
            }
          }),
        ).rejects.toThrow('Stream error V2');

        const spans = otelTestSetup.getSpans();
        expect(spans.length).toBeGreaterThan(0);
        const span = spans[0];
        expect(span.status.code).toBe(SpanStatusCode.ERROR);
        expect(span.endTime).toBeDefined();
      });
    });

    describe('Token usage timing - regression test for THE BUG', () => {
      it('should set token usage attributes BEFORE span.end() is called (V1)', async () => {
        // CRITICAL: This is a regression test for the bug where token attributes
        // were being set AFTER span.end() was called, causing them to be lost.
        // This test tracks the order of events to ensure attributes are set first.
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

        // Verify spans were created and ended
        const spans = otelTestSetup.getSpans();
        expect(spans.length).toBeGreaterThan(0);

        // Find the parent span
        const parentSpan = spans.find((s) => s.name === 'chat gpt-4-stream');
        expect(parentSpan).toBeDefined();

        // CRITICAL: Token attributes MUST be present on the ended span
        // If they were set after span.end(), they would be lost
        expect(parentSpan!.attributes['gen_ai.usage.input_tokens']).toBe(10);
        expect(parentSpan!.attributes['gen_ai.usage.output_tokens']).toBe(20);
        expect(parentSpan!.endTime).toBeDefined();

        // Verify the span was properly ended (has an end time)
        expect(parentSpan!.endTime[0]).toBeGreaterThan(0);
      });

      it('should set token usage attributes BEFORE span.end() is called (V2)', async () => {
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

        let fullText = '';
        for await (const chunk of result.textStream) {
          fullText += chunk;
        }

        expect(fullText).toBe('Streaming response!');

        const spans = otelTestSetup.getSpans();
        expect(spans.length).toBeGreaterThan(0);

        const parentSpan = spans.find((s) => s.name === 'chat claude-3-stream');
        expect(parentSpan).toBeDefined();

        // CRITICAL: Token attributes must be present
        expect(parentSpan!.attributes['gen_ai.usage.input_tokens']).toBe(15);
        expect(parentSpan!.attributes['gen_ai.usage.output_tokens']).toBe(25);
        expect(parentSpan!.endTime).toBeDefined();
        expect(parentSpan!.endTime[0]).toBeGreaterThan(0);
      });
    });

    describe('manualEnd flag behavior', () => {
      it('should not auto-end span when manualEnd is true', async () => {
        // CRITICAL: This tests the core behavior of createStartActiveSpan with manualEnd flag.
        // When manualEnd: true, the span should NOT be ended in the finally block.
        // This is used by streaming operations that need to keep the span open.
        const { createStartActiveSpan } = await import('../../src/otel/startActiveSpan');
        const { trace } = await import('@opentelemetry/api');
        const actualTracer = trace.getTracer('axiom-ai-test');

        const startActiveSpan = createStartActiveSpan(actualTracer);

        let capturedSpan: any = null;
        let operationCompleted = false;

        const result = await startActiveSpan(
          'test-manual-span',
          null,
          async (span) => {
            capturedSpan = span;
            operationCompleted = true;
            return 'test-result';
          },
          { manualEnd: true }, // Don't auto-end
        );

        expect(result).toBe('test-result');
        expect(operationCompleted).toBe(true);
        expect(capturedSpan).not.toBeNull();

        // CRITICAL: With manualEnd: true, span should NOT be in finished spans yet
        // because it hasn't been ended
        const finishedSpans = otelTestSetup.getSpans();
        const manualSpan = finishedSpans.find((s) => s.name === 'test-manual-span');

        // The span should NOT be finished yet
        expect(manualSpan).toBeUndefined();

        // Now manually end it
        capturedSpan.end();

        // After manual end, it should appear in finished spans
        const finishedSpansAfter = otelTestSetup.getSpans();
        const manualSpanAfter = finishedSpansAfter.find((s) => s.name === 'test-manual-span');
        expect(manualSpanAfter).toBeDefined();
      });

      it('should auto-end span when manualEnd is false or not set', async () => {
        // Control test: verify normal behavior (auto-end) still works
        const { createStartActiveSpan } = await import('../../src/otel/startActiveSpan');
        const { trace } = await import('@opentelemetry/api');
        const actualTracer = trace.getTracer('axiom-ai-test');

        const startActiveSpan = createStartActiveSpan(actualTracer);

        const result = await startActiveSpan(
          'test-auto-span',
          null,
          async (_span) => {
            return 'auto-result';
          },
          { manualEnd: false }, // Auto-end (default behavior)
        );

        expect(result).toBe('auto-result');

        // Span should be automatically ended and in finished spans
        const finishedSpans = otelTestSetup.getSpans();
        const autoSpan = finishedSpans.find((s) => s.name === 'test-auto-span');
        expect(autoSpan).toBeDefined();
        expect(autoSpan!.endTime).toBeDefined();
      });
    });
  });

  describe('Unified Middleware', () => {
    it('should automatically choose V1 middleware for V1 model', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('gpt-4', {
        text: 'Hello from unified middleware test!',
        finishReason: 'stop',
        usage: { promptTokens: 15, completionTokens: 25 },
      });

      const baseModel = mockProvider.languageModel('gpt-4');
      const instrumentedModel = wrapLanguageModel({
        model: baseModel,
        middleware: [axiomAIMiddleware({ model: baseModel })],
      });

      const result = await generateText({
        model: instrumentedModel,
        prompt: 'Test prompt',
      });

      expect(result.text).toBe('Hello from unified middleware test!');

      const spans = otelTestSetup.getSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].name).toBe('chat gpt-4');
    });

    it('should automatically choose V2 middleware for V2 model', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('gpt-4', {
        content: [{ type: 'text', text: 'Hello from unified V2 test!' }],
        finishReason: 'stop',
        usage: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
      });

      const baseModel = mockProvider.languageModel('gpt-4');
      const instrumentedModel = wrapLanguageModelV5({
        model: baseModel,
        middleware: [axiomAIMiddleware({ model: baseModel })],
      });

      const result = await generateTextV5({
        model: instrumentedModel,
        prompt: 'Test prompt',
      });

      expect(result.text).toBe('Hello from unified V2 test!');

      const spans = otelTestSetup.getSpans();
      expect(spans).toHaveLength(1);
      expect(spans[0].name).toBe('chat gpt-4');
    });

    it('should return noop middleware for unsupported model versions', () => {
      const mockModel = {
        specificationVersion: 'v3' as any, // Hypothetical future version
        provider: 'mock',
        modelId: 'test-v3',
      };

      // Capture console output
      const originalWarn = console.warn;
      let warningMessage = '';
      console.warn = (message: string) => {
        warningMessage = message;
      };

      try {
        const middleware = axiomAIMiddleware({ model: mockModel as any });

        // Should return empty object (noop middleware)
        expect(middleware).toEqual({});
        expect('wrapGenerate' in middleware).toBe(false);
        expect('wrapStream' in middleware).toBe(false);
        expect(warningMessage).toContain('Unsupported model specification version: "v3"');
      } finally {
        // Restore console.warn
        console.warn = originalWarn;
      }
    });

    it('should allow normal model operation with noop middleware for unsupported versions', async () => {
      // Create a mock model with unsupported version but complete interface
      const mockUnsupportedModel = {
        specificationVersion: 'v3' as any,
        provider: 'mock-future',
        modelId: 'future-model',
        defaultObjectGenerationMode: 'json' as const,
        supportsImageUrls: false,
        supportsStructuredOutputs: false,
        async doGenerate() {
          return {
            text: 'Response from unsupported model',
            finishReason: 'stop' as const,
            usage: { promptTokens: 10, completionTokens: 15 },
          };
        },
        async doStream() {
          const chunks = [
            { type: 'text-delta' as const, textDelta: 'Hello' },
            { type: 'text-delta' as const, textDelta: ' world' },
            {
              type: 'finish' as const,
              finishReason: 'stop' as const,
              usage: { promptTokens: 10, completionTokens: 15 },
            },
          ];

          return {
            stream: new ReadableStream({
              start(controller) {
                chunks.forEach((chunk) => controller.enqueue(chunk));
                controller.close();
              },
            }),
          };
        },
      };

      // Suppress warning for this test
      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        // Apply noop middleware
        const wrappedModel = wrapLanguageModel({
          model: mockUnsupportedModel as any,
          middleware: [axiomAIMiddleware({ model: mockUnsupportedModel as any })],
        });

        // Test generateText still works
        const generateResult = await generateText({
          model: wrappedModel,
          prompt: 'Test prompt',
        });

        expect(generateResult.text).toBe('Response from unsupported model');
        expect(generateResult.finishReason).toBe('stop');

        // Test streamText still works
        const streamResult = await streamText({
          model: wrappedModel,
          prompt: 'Test prompt',
        });

        const chunks: string[] = [];
        for await (const chunk of streamResult.textStream) {
          chunks.push(chunk);
        }

        expect(chunks.join('')).toBe('Hello world');
        await expect(streamResult.finishReason).resolves.toBe('stop');
      } finally {
        // Restore console.warn
        console.warn = originalWarn;
      }
    });
  });
});
