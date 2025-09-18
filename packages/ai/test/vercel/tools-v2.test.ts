import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { wrapTool } from '../../src/otel/wrapTool';
import { generateText, tool, stepCountIs } from 'aiv5';
import { createMockProvider, mockResponses } from './mock-provider-v2/mock-provider-v2';
import packageJson from '../../package.json';
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

describe('tool call attributes', () => {
  it('should create the right span shape for tool calls', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-456',
      toolName: 'searchDatabase',
      input: '{"query": "test query"}',
    };

    mockProvider.addLanguageModelResponse(
      'tool-model',
      mockResponses.textWithTools('Let me search that for you.', [toolCall]),
    );

    mockProvider.addLanguageModelResponse('tool-model', mockResponses.text('I found a result...'));

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      const res = await generateText({
        model,
        stopWhen: stepCountIs(5),
        prompt: 'Search for something',
        tools: {
          searchDatabase: wrapTool(
            'searchDatabase',
            tool({
              description: 'Search through a database',
              inputSchema: z.object({ query: z.string() }),
              execute: async ({ query }) => `Found results for: ${query}`,
            }),
          ),
          retrieveData: wrapTool(
            'retrieveData',
            tool({
              description: 'Retrieve data from external source',
              inputSchema: z.object({ id: z.string() }),
              execute: async ({ id }) => `Data for ID: ${id}`,
            }),
          ),
          calculateMetrics: wrapTool(
            'calculateMetrics',
            tool({
              description: 'Calculate performance metrics',
              inputSchema: z.object({ data: z.array(z.number()) }),
              execute: async ({ data }: { data: number[] }) =>
                data.reduce((a: number, b: number) => a + b, 0).toString(),
            }),
          ),
        },
      });
      return res;
    });

    const spans = otelTestSetup.getSpans();
    expect(spans.length).toBe(2);

    const toolSpan = spans.find((s) => s.name.startsWith('execute_tool'));
    expect(toolSpan).toBeDefined();
    expect(toolSpan?.name).toBe('execute_tool searchDatabase');
    expect(toolSpan?.attributes).toEqual({
      'axiom.gen_ai.schema_url': 'https://axiom.co/ai/schemas/0.0.2',
      'axiom.gen_ai.sdk.name': 'axiom',
      'axiom.gen_ai.sdk.version': packageJson.version,
      'gen_ai.capability.name': 'test-capability',
      'gen_ai.step.name': 'test-step',
      'gen_ai.operation.name': 'execute_tool',
      'gen_ai.tool.call.id': 'call-456',
      'gen_ai.tool.description': 'Search through a database',
      'gen_ai.tool.name': 'searchDatabase',
      'gen_ai.tool.type': 'function',
      'gen_ai.tool.arguments': '{"query":"test query"}',
      'gen_ai.tool.message': '\"Found results for: test query\"',
    });

    const chatSpan = spans.find((s) => s.name.startsWith('chat'));
    expect(chatSpan).toBeDefined();
    expect(chatSpan?.name).toBe('chat tool-model');
    expect(chatSpan?.attributes).toEqual({
      'axiom.gen_ai.schema_url': 'https://axiom.co/ai/schemas/0.0.2',
      'axiom.gen_ai.sdk.name': 'axiom',
      'axiom.gen_ai.sdk.version': packageJson.version,
      'gen_ai.capability.name': 'test-capability',
      'gen_ai.input.messages': JSON.stringify([
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Search for something',
            },
          ],
        },
        {
          role: 'assistant',
          content: 'Let me search that for you.',
          tool_calls: [
            {
              id: 'call-456',
              function: {
                name: 'searchDatabase',
                arguments: '{"query":"test query"}',
              },
              type: 'function',
            },
          ],
        },
        {
          role: 'tool',
          tool_call_id: 'call-456',
          content: 'Found results for: test query',
        },
      ]),
      'gen_ai.output.messages': JSON.stringify([
        {
          role: 'assistant',
          content: 'I found a result...',
        },
      ]),
      'gen_ai.operation.name': 'chat',
      'gen_ai.provider.name': 'mock',
      'gen_ai.response.finish_reasons': '["tool-calls"]',
      'gen_ai.request.model': 'tool-model',
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'tool-model',
      'gen_ai.step.name': 'test-step',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 27,
    });
  });
});
