import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { wrapTool } from '../../src/otel/wrapTool';
import { generateText, tool } from 'aiv4';
import { createMockProvider, mockResponses } from './mock-provider-v1/mock-provider';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';
import packageJson from '../../package.json';

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

describe('tool call attributes', () => {
  it('should create the right span shape for tool calls', async () => {
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

    mockProvider.addLanguageModelResponse('tool-model', mockResponses.text('I found a result...'));

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      const res = await generateText({
        model,
        maxSteps: 9,
        prompt: 'Search for something',
        tools: {
          searchDatabase: wrapTool(
            'searchDatabase',
            tool({
              description: 'Search through a database',
              parameters: z.object({ query: z.string() }),
              execute: async ({ query }) => `Found results for: ${query}`,
            }),
          ),
          retrieveData: wrapTool(
            'retrieveData',
            tool({
              description: 'Retrieve data from external source',
              parameters: z.object({ id: z.string() }),
              execute: async ({ id }) => `Data for ID: ${id}`,
            }),
          ),
          calculateMetrics: wrapTool(
            'calculateMetrics',
            tool({
              description: 'Calculate performance metrics',
              parameters: z.object({ data: z.array(z.number()) }),
              execute: async ({ data }: { data: number[] }) =>
                data.reduce((a: number, b: number) => a + b, 0).toString(),
            }),
          ),
        },
      });
      return res;
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(2);

    const toolSpan = spans.find((s) => s.name.startsWith('execute_tool'));
    expect(toolSpan).toBeDefined();
    expect(toolSpan?.name).toBe('execute_tool searchDatabase');
    expect(toolSpan?.attributes).toEqual({
      'axiom.gen_ai.schema_url': 'https://axiom.co/ai/schemas/0.0.1',
      'axiom.gen_ai.sdk.name': '@axiomhq/ai',
      'axiom.gen_ai.sdk.version': packageJson.version,
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
      'axiom.gen_ai.schema_url': 'https://axiom.co/ai/schemas/0.0.1',
      'axiom.gen_ai.sdk.name': '@axiomhq/ai',
      'axiom.gen_ai.sdk.version': packageJson.version,
      'gen_ai.capability.name': 'test-capability',
      'gen_ai.prompt': JSON.stringify([
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
          content: '"Found results for: test query"',
        },
      ]),
      'gen_ai.completion': JSON.stringify([
        {
          role: 'assistant',
          content: 'I found a result...',
        },
      ]),
      'gen_ai.operation.name': 'chat',
      'gen_ai.output.type': 'text',
      'gen_ai.response.finish_reasons': '["stop"]',
      'gen_ai.request.model': 'tool-model',
      'gen_ai.request.temperature': 0,
      'gen_ai.response.id': 'mock-response-id',
      'gen_ai.response.model': 'tool-model',
      'gen_ai.step.name': 'test-step',
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 19,
    });
  });
});
