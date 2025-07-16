import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'aiv4';
import { createMockProvider, mockResponses } from './mock-provider-v1/mock-provider';
import { z } from 'zod';

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

describe('tool call attributes', () => {
  it('should capture attributes for LLM request/response with tools', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      toolCallType: 'function' as const,
      toolCallId: 'call-123',
      toolName: 'calculator',
      args: '{"expression": "2+2"}',
    };

    mockProvider.addLanguageModelResponse(
      'tool-model',
      mockResponses.textWithTools('Let me calculate that for you.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'What is 2+2?',
        tools: {
          calculator: {
            description: 'Perform mathematical calculations',
            parameters: z.object({ expression: z.string() }),
            execute: async ({ expression }) => eval(expression).toString(),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].attributes).toEqual({
      'gen_ai.prompt': '[{"role":"user","content":[{"type":"text","text":"What is 2+2?"}]}]',
      'gen_ai.completion':
        '[{\"role\":\"assistant\",\"content\":\"Let me calculate that for you.\",\"tool_calls\":[{\"id\":\"call-123\",\"type\":\"function\",\"function\":{\"name\":\"calculator\",\"arguments\":\"{\\\"expression\\\": \\\"2+2\\\"}\"},\"index\":0}]}]',
      'gen_ai.response.finish_reasons': '["tool-calls"]',
      'gen_ai.operation.name': 'chat',
      'gen_ai.capability.name': 'test-capability',
      'gen_ai.step.name': 'test-step',
      'gen_ai.output.type': 'text',
      'gen_ai.provider.name': 'mock-provider',
      'gen_ai.request.model': 'tool-model',
      'gen_ai.request.temperature': 0,
      'gen_ai.request.tools.available':
        '[{"type":"function","function":{"name":"calculator","description":"Perform mathematical calculations","parameters":{"type":"object","properties":{"expression":{"type":"string"}},"required":["expression"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}}}]',
      'gen_ai.request.tools.choice': '{"type":"auto"}',
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'tool-model',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 30,
    });
  });

  it('should format tools according to otel spec exactly', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      toolCallType: 'function' as const,
      toolCallId: 'call-123',
      toolName: 'calculator',
      args: '{"expression": "2+2"}',
    };

    mockProvider.addLanguageModelResponse(
      'tool-model',
      mockResponses.textWithTools('Let me calculate that for you.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'What is 2+2?',
        tools: {
          calculator: {
            description: 'Perform mathematical calculations',
            parameters: z.object({ expression: z.string() }),
            execute: async ({ expression }) => eval(expression).toString(),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);

    const toolsAttribute = spans[0].attributes['gen_ai.request.tools.available'] as string;
    const parsedTools = JSON.parse(toolsAttribute);

    expect(parsedTools).toEqual([
      {
        type: 'function',
        function: {
          name: 'calculator',
          description: 'Perform mathematical calculations',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
              },
            },
            required: ['expression'],
            additionalProperties: false,
            $schema: 'http://json-schema.org/draft-07/schema#',
          },
        },
      },
    ]);
  });

  it('should capture tools count with multiple function tools', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      toolCallType: 'function' as const,
      toolCallId: 'call-456',
      toolName: 'searchDatabase',
      args: '{"query": "test query"}',
    };

    mockProvider.addLanguageModelResponse(
      'tool-model',
      mockResponses.textWithTools('Let me search that for you.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Search for something',
        tools: {
          searchDatabase: {
            description: 'Search through a database',
            parameters: z.object({ query: z.string() }),
            execute: async ({ query }) => `Found results for: ${query}`,
          },
          retrieveData: {
            description: 'Retrieve data from external source',
            parameters: z.object({ id: z.string() }),
            execute: async ({ id }) => `Data for ID: ${id}`,
          },
          calculateMetrics: {
            description: 'Calculate performance metrics',
            parameters: z.object({ data: z.array(z.number()) }),
            execute: async ({ data }: { data: number[] }) =>
              data.reduce((a: number, b: number) => a + b, 0).toString(),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);

    const toolsAttribute = spans[0].attributes['gen_ai.request.tools.available'] as string;
    const parsedTools = JSON.parse(toolsAttribute);

    expect(parsedTools).toHaveLength(3);
    expect(parsedTools[0].type).toBe('function');
    expect(parsedTools[1].type).toBe('function');
    expect(parsedTools[2].type).toBe('function');
  });
});
