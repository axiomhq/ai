import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trace, type Tracer } from '@opentelemetry/api';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { wrapOpenAI } from '../../src/otel/openai';
import { withSpan } from '../../src/otel/withSpan';
import { AxiomAIResources, initAxiomAI } from '../../src/otel/shared';
import { createMockProvider, mockResponses } from '../vercel/mock-provider/mock-provider';
import { generateText } from 'ai';
import OpenAI from 'openai';
import { LocalTracer } from '../../src/otel/localSpan';
import * as detection from '../../src/otel/detection';

describe('Integration Tests - Three Mode System', () => {
  let memoryExporter: InMemorySpanExporter;
  let tracerProvider: NodeTracerProvider;
  let originalEnv: string | undefined;
  let consoleSpy: any;

  beforeEach(() => {
    // Reset singleton
    (AxiomAIResources as any).instance = undefined;

    // Setup console spy
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Setup environment
    originalEnv = process.env.AXIOM_AI_DEBUG;
    process.env.AXIOM_AI_DEBUG = 'false';
    process.env.OPENAI_API_KEY = '[REDACTED:api-key]';

    // Setup OTel infrastructure
    memoryExporter = new InMemorySpanExporter();
    const spanProcessor = new SimpleSpanProcessor(memoryExporter);
    tracerProvider = new NodeTracerProvider({
      spanProcessors: [spanProcessor],
    });
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    process.env.AXIOM_AI_DEBUG = originalEnv;

    // Cleanup OTel
    if (tracerProvider) {
      await tracerProvider.shutdown();
    }
    if (memoryExporter) {
      await memoryExporter.shutdown();
    }

    // Reset trace provider
    trace.disable();

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Mode 1: Configured Tracer', () => {
    it('should use provided tracer with Vercel AI SDK', async () => {
      tracerProvider.register();
      const customTracer = tracerProvider.getTracer('custom-tracer');

      initAxiomAI({ tracer: customTracer });

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('chat test-model');
    });

    it('should use provided tracer with OpenAI wrapper', () => {
      tracerProvider.register();
      const customTracer = tracerProvider.getTracer('custom-tracer');

      initAxiomAI({ tracer: customTracer });

      const client = wrapOpenAI(new OpenAI());

      // Just verify the wrapper works with configured tracer
      expect(client).toBeDefined();
      expect(client.chat.completions.create).toBeDefined();
    });

    it('should use configured tracer even when OTel is active', async () => {
      tracerProvider.register();
      const customTracer = tracerProvider.getTracer('custom-tracer');

      initAxiomAI({ tracer: customTracer });

      const resources = AxiomAIResources.getInstance();
      const result = resources.getTracerWithModeDetection();

      expect(result.mode).toBe('configured');
      expect(result.tracer).toBe(customTracer);
    });
  });

  describe('Mode 2: Fallback Tracer', () => {
    it('should use fallback tracer with Vercel AI SDK', async () => {
      tracerProvider.register();

      initAxiomAI(); // No tracer provided

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);
      expect(spans[0].name).toBe('chat test-model');
    });

    it('should use fallback tracer with OpenAI wrapper', () => {
      tracerProvider.register();

      initAxiomAI(); // No tracer provided

      const client = wrapOpenAI(new OpenAI());

      expect(client).toBeDefined();
      expect(client.chat.completions.create).toBeDefined();
    });

    it('should get fallback tracer from trace.getTracer', () => {
      tracerProvider.register();

      initAxiomAI(); // No tracer provided

      const resources = AxiomAIResources.getInstance();
      const result = resources.getTracerWithModeDetection();

      expect(result.mode).toBe('fallback');
      expect(result.tracer).toBeDefined();
    });
  });

  describe('Mode 3a: Error when OTel Active', () => {
    it('should throw error when OTel provider is active', () => {
      // Mock detection to return true
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(true);

      // Don't call initAxiomAI
      const resources = AxiomAIResources.getInstance();

      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow('OpenTelemetry instrumentation detected but initAxiomAI was not called');
    });

    it('should provide helpful error message', () => {
      // Mock detection to return true
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(true);

      const resources = AxiomAIResources.getInstance();

      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow(/Please call initAxiomAI\(config\) before using AI SDK wrappers/);
    });
  });

  describe('Mode 3b: Local Spans', () => {
    it('should use local spans with Vercel AI SDK when no OTel', async () => {
      // Mock detection to return false
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      // Force flush to check spans
      const { getSpanBuffer } = await import('../../src/otel/localSpan');
      const buffer = getSpanBuffer();
      buffer.forceFlush();

      // Local spans should be flushed to console
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should use local spans with OpenAI wrapper when no OTel', () => {
      // Mock detection to return false
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const client = wrapOpenAI(new OpenAI());

      expect(client).toBeDefined();
      expect(client.chat.completions.create).toBeDefined();
    });

    it('should return LocalTracer when no OTel instrumentation', () => {
      // Mock detection to return false
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const resources = AxiomAIResources.getInstance();
      const result = resources.getTracerWithModeDetection();

      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });

    it('should handle local spans properly in withSpan', async () => {
      // Mock detection to return false
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      const result = await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      expect(result).toBeDefined();
      expect(result.text).toBe('Hello, world!');
    });
  });

  describe('Mode Detection Edge Cases', () => {
    it('should handle transition from error to configured mode', () => {
      // First, mock to trigger error
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(true);

      const resources = AxiomAIResources.getInstance();

      // First attempt should throw
      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow();

      // Now initialize
      tracerProvider.register();
      const customTracer = tracerProvider.getTracer('custom-tracer');
      initAxiomAI({ tracer: customTracer });

      // Should work now
      const result = resources.getTracerWithModeDetection();
      expect(result.mode).toBe('configured');
      expect(result.tracer).toBe(customTracer);
    });

    it('should handle mode switching after reinitialization', () => {
      tracerProvider.register();
      const resources = AxiomAIResources.getInstance();

      // Start with fallback mode
      initAxiomAI();
      const result1 = resources.getTracerWithModeDetection();
      expect(result1.mode).toBe('fallback');

      // Switch to configured mode
      const customTracer = tracerProvider.getTracer('custom-tracer');
      initAxiomAI({ tracer: customTracer });
      const result2 = resources.getTracerWithModeDetection();
      expect(result2.mode).toBe('configured');
      expect(result2.tracer).toBe(customTracer);
    });

    it('should handle NoopTracerProvider properly', () => {
      // Mock detection to return false (no OTel)
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const resources = AxiomAIResources.getInstance();
      const result = resources.getTracerWithModeDetection();

      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });
  });

  describe('Performance and Compatibility', () => {
    it('should not significantly impact performance in configured mode', async () => {
      tracerProvider.register();
      const customTracer = tracerProvider.getTracer('custom-tracer');
      initAxiomAI({ tracer: customTracer });

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      const start = Date.now();

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      const duration = Date.now() - start;

      // Should complete quickly (this is a rough performance check)
      expect(duration).toBeLessThan(1000);
    });

    it('should not impact performance in local mode', async () => {
      // Mock detection to return false
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      const start = Date.now();

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      const duration = Date.now() - start;

      // Should complete quickly even with local spans
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain backward compatibility', async () => {
      tracerProvider.register();

      // Old way - should still work
      initAxiomAI();

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      const result = await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      expect(result).toBeDefined();
      expect(result.text).toBe('Hello, world!');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in local mode', async () => {
      // Mock detection to return false
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockReturnValue(false);

      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      // This should not throw even if there are issues with local spans
      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          prompt: 'Hello, world!',
        });
      });

      // Force flush to check spans
      const { getSpanBuffer } = await import('../../src/otel/localSpan');
      const buffer = getSpanBuffer();
      buffer.forceFlush();

      // Should have attempted to flush local spans
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle detection errors gracefully', () => {
      // Mock detection to throw error
      vi.spyOn(detection, 'hasActiveOtelInstrumentation').mockImplementation(() => {
        throw new Error('Detection error');
      });

      const resources = AxiomAIResources.getInstance();

      // Should fallback to local mode on detection error
      const result = resources.getTracerWithModeDetection();
      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });
  });
});
