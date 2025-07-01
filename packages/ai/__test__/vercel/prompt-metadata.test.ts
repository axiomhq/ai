import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText, streamText } from 'ai';
import { createMockProvider, mockResponses } from './mock-provider/mock-provider';
import { parse } from '../../src/prompt/index';
import { z } from 'zod';
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
});

beforeEach(() => {
  memoryExporter.reset();
});

afterAll(async () => {
  await tracerProvider.shutdown();
  await memoryExporter.shutdown();
});

describe('Prompt Metadata in Spans', () => {
  const mockPrompt: Prompt = {
    id: 'prompt-123',
    name: 'Test Chat Prompt',
    slug: 'test-chat-prompt',
    environment: 'development',
    version: '1.2.0',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello to {{ name }}!' },
    ],
    arguments: {
      name: z.string(),
    },
  };

  describe('generateText with prompt metadata', () => {
    it('should add prompt metadata attributes to spans', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, Alice!'));
      const model = wrapAISDKModel(mockProvider.languageModel('gpt-4'));

      // Parse prompt to get messages with metadata
      const parsedPrompt = await parse(mockPrompt, {
        context: { name: 'Alice' },
        parser: 'nunjucks',
      });

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          messages: parsedPrompt.messages,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const spanAttributes = spans[0].attributes;

      // Check that prompt metadata attributes are present
      expect(spanAttributes['gen_ai.prompt_metadata.id']).toBe('prompt-123');
      expect(spanAttributes['gen_ai.prompt_metadata.name']).toBe('Test Chat Prompt');
      expect(spanAttributes['gen_ai.prompt_metadata.slug']).toBe('test-chat-prompt');
      expect(spanAttributes['gen_ai.prompt_metadata.environment']).toBe('development');
      expect(spanAttributes['gen_ai.prompt_metadata.version']).toBe('1.2.0');

      // Check that standard GenAI attributes are still present
      expect(spanAttributes['gen_ai.request.model']).toBe('gpt-4');
      expect(spanAttributes['gen_ai.operation.name']).toBe('chat');
      expect(spanAttributes['gen_ai.operation.workflow_name']).toBe('test-workflow');
      expect(spanAttributes['gen_ai.operation.task_name']).toBe('test-task');
    });

    it('should work without metadata (backward compatibility)', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, World!'));
      const model = wrapAISDKModel(mockProvider.languageModel('gpt-4'));

      // Use plain messages without metadata
      const plainMessages = [{ role: 'user' as const, content: 'Hello' }];

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          messages: plainMessages,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const spanAttributes = spans[0].attributes;

      // Check that prompt metadata attributes are NOT present
      expect(spanAttributes['gen_ai.prompt_metadata.id']).toBeUndefined();
      expect(spanAttributes['gen_ai.prompt_metadata.name']).toBeUndefined();
      expect(spanAttributes['gen_ai.prompt_metadata.slug']).toBeUndefined();
      expect(spanAttributes['gen_ai.prompt_metadata.environment']).toBeUndefined();
      expect(spanAttributes['gen_ai.prompt_metadata.version']).toBeUndefined();

      // Check that standard GenAI attributes are still present
      expect(spanAttributes['gen_ai.request.model']).toBe('gpt-4');
      expect(spanAttributes['gen_ai.operation.name']).toBe('chat');
    });

    it('should handle partial metadata gracefully', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello!'));
      const model = wrapAISDKModel(mockProvider.languageModel('gpt-4'));

      const partialPrompt: Prompt = {
        id: 'partial-123',
        name: 'Partial Prompt',
        slug: 'partial-prompt',
        environment: null, // null environment
        version: '1.0.0',
        messages: [{ role: 'user', content: 'Hi' }],
        arguments: {},
      };

      const parsedPrompt = await parse(partialPrompt, { context: {} });

      await withSpan({ workflow: 'test-workflow', task: 'test-task' }, async () => {
        return await generateText({
          model,
          messages: parsedPrompt.messages,
        });
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const spanAttributes = spans[0].attributes;

      // Check that available metadata is present
      expect(spanAttributes['gen_ai.prompt_metadata.id']).toBe('partial-123');
      expect(spanAttributes['gen_ai.prompt_metadata.name']).toBe('Partial Prompt');
      expect(spanAttributes['gen_ai.prompt_metadata.slug']).toBe('partial-prompt');
      expect(spanAttributes['gen_ai.prompt_metadata.version']).toBe('1.0.0');

      // null environment should not be set as attribute
      expect(spanAttributes['gen_ai.prompt_metadata.environment']).toBeUndefined();
    });
  });

  describe('streamText with prompt metadata', () => {
    it('should add prompt metadata attributes to streaming spans', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addStreamResponse('gpt-4', mockResponses.stream(['Hello', ' Alice', '!']));
      const model = wrapAISDKModel(mockProvider.languageModel('gpt-4'));

      const parsedPrompt = await parse(mockPrompt, {
        context: { name: 'Alice' },
        parser: 'nunjucks',
      });

      await withSpan({ workflow: 'stream-workflow', task: 'stream-task' }, async () => {
        const result = await streamText({
          model,
          messages: parsedPrompt.messages,
        });

        for await (const chunk of result.textStream) {
          // consume stream
        }

        return result;
      });

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBe(1);

      const spanAttributes = spans[0].attributes;

      // Check that prompt metadata attributes are present
      expect(spanAttributes['gen_ai.prompt_metadata.id']).toBe('prompt-123');
      expect(spanAttributes['gen_ai.prompt_metadata.name']).toBe('Test Chat Prompt');
      expect(spanAttributes['gen_ai.prompt_metadata.slug']).toBe('test-chat-prompt');
      expect(spanAttributes['gen_ai.prompt_metadata.environment']).toBe('development');
      expect(spanAttributes['gen_ai.prompt_metadata.version']).toBe('1.2.0');

      // Check streaming-specific attributes
      expect(spanAttributes['gen_ai.operation.workflow_name']).toBe('stream-workflow');
      expect(spanAttributes['gen_ai.operation.task_name']).toBe('stream-task');
    });
  });

  describe('prompt metadata extraction', () => {
    it('should not interfere with normal message processing', async () => {
      const mockProvider = createMockProvider();
      mockProvider.addLanguageModelResponse('test', mockResponses.text('Processed correctly'));
      const model = wrapAISDKModel(mockProvider.languageModel('gpt-4'));

      const parsedPrompt = await parse(mockPrompt, {
        context: { name: 'Test' },
        parser: 'nunjucks',
      });

      const result = await withSpan({ workflow: 'test', task: 'test' }, async () => {
        return await generateText({
          model,
          messages: parsedPrompt.messages,
        });
      });

      // Check that the actual result is correct
      expect(result.text).toBe('Mock response');

      // Check that the messages were processed correctly in the span
      const spans = memoryExporter.getFinishedSpans();
      const promptAttr = JSON.parse(spans[0].attributes['gen_ai.prompt'] as string);
      expect(promptAttr).toHaveLength(2);
      expect(promptAttr[0].role).toBe('system');
      expect(promptAttr[1].content).toEqual([{ type: 'text', text: 'Say hello to Test!' }]); // Template was processed
    });
  });
});
