import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'ai';
import { createMockProvider, mockResponses } from './mock-provider/mock-provider';
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

    await withSpan({ agentName: 'test-agent', operationName: 'test-operation' }, async () => {
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
      'gen_ai.operation.name': 'test-operation',
      'gen_ai.agent.name': 'test-agent',
      'gen_ai.output.type': 'text',
      'gen_ai.request.model': 'tool-model',
      'gen_ai.request.temperature': 0,
      'gen_ai.request.tool_choice': '{"type":"auto"}',
      'gen_ai.request.tools_count': 1,
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'tool-model',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 30,
    });
  });
});
