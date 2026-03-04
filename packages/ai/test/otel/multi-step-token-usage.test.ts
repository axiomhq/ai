import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { generateText, tool } from 'aiv4';
import { generateText as generateTextV5, stepCountIs as stepCountIsV5, tool as toolV5 } from 'aiv5';
import { generateText as generateTextV6, stepCountIs as stepCountIsV6, tool as toolV6 } from 'aiv6';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { wrapTool } from '../../src/otel/wrapTool';
import {
  createMockProvider as createMockProviderV1,
  mockResponses as mockResponsesV1,
} from '../vercel/mock-provider-v1/mock-provider';
import {
  createMockProvider as createMockProviderV2,
  mockResponses as mockResponsesV2,
} from '../vercel/mock-provider-v2/mock-provider-v2';
import {
  createMockProvider as createMockProviderV3,
  mockResponses as mockResponsesV3,
} from '../vercel/mock-provider-v3/mock-provider-v3';
import { createOtelTestSetup } from '../helpers/otel-test-setup';
import { z } from 'zod';

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

describe('Multi-step tool call token usage and finish reasons', () => {
  describe('V1', () => {
    it('accumulates token usage and uses final finish reason on the chat span', async () => {
      const mockProvider = createMockProviderV1();

      // Step 1: tool call (promptTokens: 10, completionTokens: 5)
      mockProvider.addLanguageModelResponse(
        'test-model',
        mockResponsesV1.textWithTools(
          'Let me look that up.',
          [
            {
              toolCallType: 'function',
              toolCallId: 'call-1',
              toolName: 'search',
              args: '{"query": "test"}',
            },
          ],
          { usage: { promptTokens: 10, completionTokens: 5 } },
        ),
      );

      // Step 2: final text (promptTokens: 20, completionTokens: 15)
      mockProvider.addLanguageModelResponse(
        'test-model',
        mockResponsesV1.text('Here are the results.', {
          usage: { promptTokens: 20, completionTokens: 15 },
        }),
      );

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'test', step: 'multi-step' }, async () => {
        await generateText({
          model,
          maxSteps: 5,
          prompt: 'Search for something',
          tools: {
            search: wrapTool(
              'search',
              tool({
                description: 'Search',
                parameters: z.object({ query: z.string() }),
                execute: async ({ query }) => `Results for: ${query}`,
              }),
            ),
          },
        });
      });

      const spans = otelTestSetup.getSpans();
      const chatSpan = spans.find((s) => s.name === 'chat test-model');
      expect(chatSpan).toBeDefined();

      // Accumulated totals: 10+20=30 input, 5+15=20 output
      expect(chatSpan!.attributes['gen_ai.usage.input_tokens']).toBe(30);
      expect(chatSpan!.attributes['gen_ai.usage.output_tokens']).toBe(20);
      expect(chatSpan!.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');
    });
  });

  describe('V2', () => {
    it('accumulates token usage and uses final finish reason on the chat span', async () => {
      const mockProvider = createMockProviderV2();

      // Step 1: tool call (inputTokens: 10, outputTokens: 5)
      mockProvider.addLanguageModelResponse(
        'test-model',
        mockResponsesV2.textWithTools(
          'Let me look that up.',
          [
            {
              type: 'tool-call',
              toolCallId: 'call-1',
              toolName: 'search',
              input: '{"query": "test"}',
            },
          ],
          { usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 } },
        ),
      );

      // Step 2: final text (inputTokens: 20, outputTokens: 15)
      mockProvider.addLanguageModelResponse(
        'test-model',
        mockResponsesV2.text('Here are the results.', {
          usage: { inputTokens: 20, outputTokens: 15, totalTokens: 35 },
        }),
      );

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'test', step: 'multi-step' }, async () => {
        await generateTextV5({
          model,
          stopWhen: stepCountIsV5(5),
          prompt: 'Search for something',
          tools: {
            search: wrapTool(
              'search',
              toolV5({
                description: 'Search',
                inputSchema: z.object({ query: z.string() }),
                execute: async ({ query }) => `Results for: ${query}`,
              }),
            ),
          },
        });
      });

      const spans = otelTestSetup.getSpans();
      const chatSpan = spans.find((s) => s.name === 'chat test-model');
      expect(chatSpan).toBeDefined();

      // Accumulated totals: 10+20=30 input, 5+15=20 output
      expect(chatSpan!.attributes['gen_ai.usage.input_tokens']).toBe(30);
      expect(chatSpan!.attributes['gen_ai.usage.output_tokens']).toBe(20);
      expect(chatSpan!.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');
    });
  });

  describe('V3', () => {
    it('accumulates token usage and uses final finish reason on the chat span', async () => {
      const mockProvider = createMockProviderV3();

      // Step 1: tool call (inputTokens.total: 10, outputTokens.total: 5)
      mockProvider.addLanguageModelResponse(
        'test-model',
        mockResponsesV3.textWithTools(
          'Let me look that up.',
          [
            {
              type: 'tool-call',
              toolCallId: 'call-1',
              toolName: 'search',
              input: '{"query": "test"}',
            },
          ],
          { usage: { inputTokens: { total: 10 }, outputTokens: { total: 5 } } },
        ),
      );

      // Step 2: final text (inputTokens.total: 20, outputTokens.total: 15)
      mockProvider.addLanguageModelResponse(
        'test-model',
        mockResponsesV3.text('Here are the results.', {
          usage: { inputTokens: { total: 20 }, outputTokens: { total: 15 } },
        }),
      );

      const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

      await withSpan({ capability: 'test', step: 'multi-step' }, async () => {
        await generateTextV6({
          model,
          stopWhen: stepCountIsV6(5),
          prompt: 'Search for something',
          tools: {
            search: wrapTool(
              'search',
              toolV6({
                description: 'Search',
                inputSchema: z.object({ query: z.string() }),
                execute: async ({ query }) => `Results for: ${query}`,
              }),
            ),
          },
        });
      });

      const spans = otelTestSetup.getSpans();
      const chatSpan = spans.find((s) => s.name === 'chat test-model');
      expect(chatSpan).toBeDefined();

      // Accumulated totals: 10+20=30 input, 5+15=20 output
      expect(chatSpan!.attributes['gen_ai.usage.input_tokens']).toBe(30);
      expect(chatSpan!.attributes['gen_ai.usage.output_tokens']).toBe(20);
      expect(chatSpan!.attributes['gen_ai.response.finish_reasons']).toBe('["stop"]');
    });
  });
});
