import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';

// V1 imports
import { generateText } from 'aiv4';
import { wrapLanguageModel } from 'aiv4';
import { createMockProvider, mockResponses } from './mock-provider-v1/mock-provider';

// V2 imports
import { generateText as generateTextV5 } from 'aiv5';
import { wrapLanguageModel as wrapLanguageModelV5 } from 'aiv5';
import {
  createMockProvider as createMockProviderV2,
  mockResponses as mockResponsesV2,
} from './mock-provider-v2/mock-provider-v2';

// Shared imports
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { axiomAIMiddlewareV1, axiomAIMiddlewareV2 } from '../../src/otel/middleware';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';
import { parse, Template } from '../../src/prompt';
import type { Prompt } from '../../src/types';

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

describe('prompt metadata attributes unified tests', async () => {
  const mockPrompt: Prompt = {
    name: 'Test Prompt',
    slug: 'test-prompt',
    version: '1.0.0',
    model: 'gpt-4',
    options: {},
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello {{ name }}!' },
    ],
    arguments: {
      name: Template.String(),
    },
  };
  const prompt = await parse(mockPrompt, {
    context: { name: 'Test' },
  });

  describe('V1 with wrapAISDKModel', () => {
    it('should add prompt metadata attributes from providerOptions._axiomMeta', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateText({
          model,
          messages: prompt.messages as any,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });

    it("shouldn't conflict with providerOptions", async () => {
      const mockProvider = createMockProvider();
      const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateText({
          model,
          messages: prompt.messages as any,
          providerOptions: { test: { test: 'test' } },
        });
      });

      const providerMetadata = mockProvider.getProviderMetadata();
      expect(providerMetadata).toMatchObject({ test: { test: 'test' } });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });
  });

  describe('V2 with wrapAISDKModel', () => {
    it('should add prompt metadata attributes from providerOptions._axiomMeta', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('test', mockResponsesV2.text('Hello, world!'));
      const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateTextV5({
          model,
          messages: prompt.messages as any,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });

    it("shouldn't conflict with providerOptions", async () => {
      const mockProvider = createMockProviderV2();
      const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateTextV5({
          model,
          messages: prompt.messages as any,
          providerOptions: { test: { test: 'test' } },
        });
      });

      const providerMetadata = mockProvider.getProviderMetadata();
      expect(providerMetadata).toMatchObject({ test: { test: 'test' } });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });
  });

  describe('V1 with middleware', () => {
    it('should add prompt metadata attributes from providerOptions._axiomMeta', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('model-name', mockResponses.text('Hello, world!'));

      const baseModel = mockProvider.languageModel('model-name');
      const instrumentedModel = wrapLanguageModel({
        model: baseModel,
        middleware: axiomAIMiddlewareV1(),
      });

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateText({
          model: instrumentedModel,
          messages: prompt.messages as any,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });

    it("shouldn't conflict with providerOptions", async () => {
      const mockProvider = createMockProvider();

      const baseModel = mockProvider.languageModel('model-name');
      const instrumentedModel = wrapLanguageModel({
        model: baseModel,
        middleware: axiomAIMiddlewareV1(),
      });

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateText({
          model: instrumentedModel,
          messages: prompt.messages as any,
          providerOptions: { test: { test: 'test' } },
        });
      });

      const providerMetadata = mockProvider.getProviderMetadata();
      expect(providerMetadata).toMatchObject({ test: { test: 'test' } });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });
  });

  describe('V2 with middleware', () => {
    it('should add prompt metadata attributes from providerOptions._axiomMeta', async () => {
      const mockProvider = createMockProviderV2();
      mockProvider.addLanguageModelResponse('model-name', mockResponsesV2.text('Hello, world!'));

      const baseModel = mockProvider.languageModel('model-name');
      const instrumentedModel = wrapLanguageModelV5({
        model: baseModel,
        middleware: axiomAIMiddlewareV2(),
      });

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateTextV5({
          model: instrumentedModel,
          messages: prompt.messages as any,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });

    it("shouldn't conflict with providerOptions", async () => {
      const mockProvider = createMockProviderV2();

      const baseModel = mockProvider.languageModel('model-name');
      const instrumentedModel = wrapLanguageModelV5({
        model: baseModel,
        middleware: axiomAIMiddlewareV2(),
      });

      await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
        return await generateTextV5({
          model: instrumentedModel,
          messages: prompt.messages as any,
          providerOptions: { test: { test: 'test' } },
        });
      });

      const providerMetadata = mockProvider.getProviderMetadata();
      expect(providerMetadata).toMatchObject({ test: { test: 'test' } });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const attributes = spans[0].attributes;
      expect(attributes['axiom.gen_ai.prompt.name']).toBe('Test Prompt');
      expect(attributes['axiom.gen_ai.prompt.slug']).toBe('test-prompt');
      expect(attributes['axiom.gen_ai.prompt.version']).toBe('1.0.0');
    });
  });
});
