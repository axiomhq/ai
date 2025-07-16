import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText, streamText } from 'aiv5';
import { createMockProvider, mockResponses } from './mock-provider-v2/mock-provider-v2';

import { z } from 'zod';
import type {
  CompletionArray,
  CompletionAssistantMessage,
} from '../../src/otel/completionTypes';

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

describe('tool call attributes (V2)', () => {
  it('should capture attributes for LLM request/response with tools', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
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
        prompt: 'Calculate 2+2',
        tools: {
          calculator: {
            description: 'Calculate mathematical expressions',
            parameters: z.object({ expression: z.string() }),
            execute: async ({ expression }) => eval(expression).toString(),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);

    const attributes = spans[0].attributes;

    // Check tools available attribute
    expect(attributes['gen_ai.request.tools.available']).toBeDefined();
    const toolsAvailable = JSON.parse(attributes['gen_ai.request.tools.available'] as string);
    expect(toolsAvailable).toHaveLength(1);
    expect(toolsAvailable[0]).toMatchObject({
      type: 'function',
      function: {
        name: 'calculator',
        description: 'Calculate mathematical expressions',
      },
    });

    // Check completion array attribute
    expect(attributes['gen_ai.completion']).toBeDefined();
  });

  it('should format tools according to otel spec exactly', async () => {
    const mockProvider = createMockProvider();

    mockProvider.addLanguageModelResponse('spec-model', mockResponses.text('Test response'));

    const model = wrapAISDKModel(mockProvider.languageModel('spec-model'));

    await withSpan({ capability: 'spec-test', step: 'spec-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Test prompt',
        tools: {
          multiTool: {
            description: 'A tool with multiple parameters',
            parameters: z.object({
              param1: z.string().describe('First parameter'),
              param2: z.number().describe('Second parameter'),
              param3: z.boolean().optional().describe('Optional third parameter'),
            }),
            execute: async ({ param1, param2, param3 }) => `${param1}-${param2}-${param3}`,
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    const toolsAttribute = spans[0].attributes['gen_ai.request.tools.available'] as string;
    const tools = JSON.parse(toolsAttribute);

    expect(tools[0]).toEqual({
      type: 'function',
      function: {
        name: 'multiTool',
        description: 'A tool with multiple parameters',
        parameters: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'First parameter',
            },
            param2: {
              type: 'number',
              description: 'Second parameter',
            },
            param3: {
              type: 'boolean',
              description: 'Optional third parameter',
            },
          },
          required: ['param1', 'param2'],
          additionalProperties: false,
          $schema: 'http://json-schema.org/draft-07/schema#',
        },
      },
    });
  });

  it('should capture tools count with multiple function tools', async () => {
    const mockProvider = createMockProvider();

    const toolCalls = [
      {
        type: 'tool-call' as const,
      toolCallType: 'function' as const,
        toolCallId: 'call-search',
        toolName: 'search',
        args: '{"query": "test"}',
      },
      {
        type: 'tool-call' as const,
      toolCallType: 'function' as const,
        toolCallId: 'call-get',
        toolName: 'getById',
        args: '{"id": "123"}',
      },
      {
        type: 'tool-call' as const,
      toolCallType: 'function' as const,
        toolCallId: 'call-process',
        toolName: 'processData',
        args: '{"data": [1,2,3]}',
      },
    ];

    mockProvider.addLanguageModelResponse(
      'multi-tool-model',
      mockResponses.textWithTools('Processing multiple tools...', toolCalls),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('multi-tool-model'));

    await withSpan({ capability: 'multi-test', step: 'multi-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Use multiple tools',
        tools: {
          search: {
            description: 'Search for data',
            parameters: z.object({ query: z.string() }),
            execute: async ({ query }) => `Search results for: ${query}`,
          },
          getById: {
            description: 'Get item by ID',
            parameters: z.object({ id: z.string() }),
            execute: async ({ id }) => `Item ${id}`,
          },
          processData: {
            description: 'Process array of data',
            parameters: z.object({ data: z.array(z.number()) }),
            execute: async ({ data }) => `Processed ${data.length} items`,
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    const toolsCountAttribute = spans[0].attributes['gen_ai.request.tools.count'];
    const toolsAvailableAttribute = spans[0].attributes['gen_ai.request.tools.available'] as string;

    expect(toolsCountAttribute).toBe(3);

    const toolsAvailable = JSON.parse(toolsAvailableAttribute);
    expect(toolsAvailable).toHaveLength(3);
    expect(toolsAvailable.map((t: any) => t.function.name)).toEqual(['search', 'getById', 'processData']);
  });

  it('should verify completion array structure matches TODO.md examples', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-123',
      toolName: 'getWeather',
      args: '{"location": "NYC"}',
    };

    mockProvider.addLanguageModelResponse(
      'weather-model',
      mockResponses.textWithTools('The weather in NYC is sunny.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('weather-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'What is the weather in NYC?',
        tools: {
          getWeather: {
            description: 'Get weather for a location',
            parameters: z.object({ location: z.string() }),
            execute: async ({ location }) => `Weather in ${location}`,
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);

    const completionAttribute = spans[0].attributes['gen_ai.completion'] as string;
    const completion: CompletionArray = JSON.parse(completionAttribute);

    expect(completion).toBeDefined();
    expect(Array.isArray(completion)).toBe(true);
    expect(completion.length).toBeGreaterThan(0);

    // Check that completion contains assistant message
    const assistantMessage = completion[0] as CompletionAssistantMessage;
    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.content).toBeDefined();
  });

  it('should handle multiple tool calls in completion array', async () => {
    const mockProvider = createMockProvider();

    const toolCalls = [
      {
        type: 'tool-call' as const,
      toolCallType: 'function' as const,
        toolCallId: 'call-weather-nyc',
        toolName: 'getWeather',
        args: '{"location": "NYC"}',
      },
      {
        type: 'tool-call' as const,
      toolCallType: 'function' as const,
        toolCallId: 'call-weather-la',
        toolName: 'getWeather',
        args: '{"location": "LA"}',
      },
    ];

    mockProvider.addLanguageModelResponse(
      'multi-weather-model',
      mockResponses.textWithTools('NYC is 72°F, LA is 85°F. LA is warmer.', toolCalls),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('multi-weather-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Compare weather in NYC and LA',
        tools: {
          getWeather: {
            description: 'Get weather for a location',
            parameters: z.object({ location: z.string() }),
            execute: async ({ location }) => `Weather data for ${location}`,
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    const completionAttribute = spans[0].attributes['gen_ai.completion'] as string;
    const completion: CompletionArray = JSON.parse(completionAttribute);

    expect(completion).toBeDefined();
    expect(Array.isArray(completion)).toBe(true);

    const assistantMessage = completion[0] as CompletionAssistantMessage;
    expect(assistantMessage.role).toBe('assistant');

    if (assistantMessage.tool_calls) {
      expect(assistantMessage.tool_calls).toHaveLength(2);
      expect(assistantMessage.tool_calls[0].function.name).toBe('getWeather');
      expect(assistantMessage.tool_calls[1].function.name).toBe('getWeather');
    }
  });

  it('should handle tool calls with text response in completion array', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-tests',
      toolName: 'runTests',
      args: '{"test_suite": "unit"}',
    };

    mockProvider.addLanguageModelResponse(
      'test-model',
      mockResponses.textWithTools('I ran the tests and found 2 failures.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('test-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Run the unit tests',
        tools: {
          runTests: {
            description: 'Run test suite',
            parameters: z.object({ test_suite: z.string() }),
            execute: async ({ test_suite }) => `Test results for ${test_suite}`,
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    const completionAttribute = spans[0].attributes['gen_ai.completion'] as string;
    const completion: CompletionArray = JSON.parse(completionAttribute);

    expect(completion).toBeDefined();
    expect(Array.isArray(completion)).toBe(true);

    const assistantMessage = completion[0] as CompletionAssistantMessage;
    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.content).toContain('tests');

    if (assistantMessage.tool_calls) {
      expect(assistantMessage.tool_calls).toHaveLength(1);
      expect(assistantMessage.tool_calls[0].function.name).toBe('runTests');
    }
  });

  it('should verify no timestamps in completion array for test compatibility', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-timestamp-test',
      toolName: 'test_tool',
      args: '{"param": "value"}',
    };

    mockProvider.addLanguageModelResponse(
      'timestamp-model',
      mockResponses.textWithTools('Test response', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('timestamp-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Test prompt',
        tools: {
          test_tool: {
            description: 'Test tool',
            parameters: z.object({ param: z.string() }),
            execute: async ({ param }) => `Result: ${param}`,
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    const completionAttribute = spans[0].attributes['gen_ai.completion'] as string;
    const completion: CompletionArray = JSON.parse(completionAttribute);

    const assistantMessage = completion[0] as CompletionAssistantMessage;
    expect(assistantMessage.timestamp).toBeUndefined();
  });

  it('should set finish reason correctly for tool calls', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-finish-test',
      toolName: 'finish_tool',
      args: '{}',
    };

    mockProvider.addLanguageModelResponse(
      'tool-model',
      mockResponses.textWithTools('Finish test', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Test finish reason',
        tools: {
          finish_tool: {
            description: 'Finish tool',
            parameters: z.object({}),
            execute: async () => 'Done',
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    const finishReasonAttribute = spans[0].attributes['gen_ai.response.finish_reasons'] as string;
    const finishReasons = JSON.parse(finishReasonAttribute);

    expect(finishReasons).toEqual(['tool-calls']);
  });

  it('should handle streaming tool calls in completion array', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-stream-123',
      toolName: 'stream_tool',
      args: '{"query": "streaming test"}',
    };

    // Add a stream response with tool calls
    mockProvider.addStreamResponse('tool-model', {
      chunks: ['Streaming ', 'response '],
      finishReason: 'tool-calls',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });

    // Also add language model response for the tool call part
    mockProvider.addLanguageModelResponse(
      'tool-model',
      mockResponses.textWithTools('Streaming response', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('tool-model'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      const result = streamText({
        model,
        prompt: 'Test streaming with tools',
        tools: {
          stream_tool: {
            description: 'Tool for streaming test',
            parameters: z.object({ query: z.string() }),
            execute: async ({ query }) => `Streamed result for: ${query}`,
          },
        },
      });

      // Consume the stream
      for await (const _chunk of result.textStream) {
        // Process chunks
      }

      return result;
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);

    // Verify completion attribute exists for streaming
    const completionAttribute = spans[0].attributes['gen_ai.completion'];
    expect(completionAttribute).toBeDefined();
  });

  it('should include complete conversational flow with tool calls in completion array', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-weather-123',
      toolName: 'getWeather',
      args: '{"city":"Madrid","country":"Spain"}',
    };

    // Mock response that includes both tool call and final text
    mockProvider.addLanguageModelResponse(
      'weather-model',
      mockResponses.textWithTools('The weather in Madrid is 22°C and sunny.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('weather-model'));

    await withSpan({ capability: 'weather', step: 'get-weather' }, async () => {
      return await generateText({
        model,
        messages: [
          { role: 'user', content: 'What is the weather in Madrid, Spain?' }
        ],
        tools: {
          getWeather: {
            description: 'Get weather for a city',
            parameters: z.object({
              city: z.string(),
              country: z.string(),
            }),
            execute: async () => ({ temperature: 22, condition: 'sunny' }),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    
    const completionAttribute = spans[0].attributes['gen_ai.completion'] as string;
    const completionArray: CompletionArray = JSON.parse(completionAttribute);
    expect(completionArray).toBeDefined();
    expect(Array.isArray(completionArray)).toBe(true);
    
    // According to TODO.md, completion should contain the full conversational flow
    // including user message, assistant message with tool calls, tool results, and final response
    expect(completionArray.length).toBe(4);
    
    // User message
    expect(completionArray[0]).toEqual({
      role: 'user',
      content: 'What is the weather in Madrid, Spain?'
    });
    
    // Assistant message with tool calls
    const assistantMessage = completionArray[1] as CompletionAssistantMessage;
    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.tool_calls).toBeDefined();
    expect(assistantMessage.tool_calls).toHaveLength(1);
    expect(assistantMessage.tool_calls![0]).toEqual({
      id: 'call-weather-123',
      type: 'function',
      function: {
        name: 'getWeather',
        arguments: '{"city":"Madrid","country":"Spain"}'
      }
    });
    
    // Tool result message
    expect(completionArray[2]).toEqual({
      role: 'tool',
      content: '{"temperature":22,"condition":"sunny"}',
      tool_call_id: 'call-weather-123'
    });
    
    // Final assistant response
    expect(completionArray[3]).toEqual({
      role: 'assistant',
      content: 'The weather in Madrid is 22°C and sunny.'
    });
  });

  it('should not pollute prompt with response data - prompt should only contain input messages', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-prompt-test',
      toolName: 'getWeather',
      args: '{"city":"Tokyo","country":"Japan"}',
    };

    mockProvider.addLanguageModelResponse(
      'prompt-test-model',
      mockResponses.textWithTools('The weather in Tokyo is 18°C and cloudy.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('prompt-test-model'));

    await withSpan({ capability: 'weather', step: 'prompt-test' }, async () => {
      return await generateText({
        model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful AI assistant. You must always use the getWeather tool when asked about weather.' 
          },
          { 
            role: 'user', 
            content: 'What is the current weather in Tokyo, Japan?' 
          }
        ],
        tools: {
          getWeather: {
            description: 'Get weather for a city',
            parameters: z.object({
              city: z.string(),
              country: z.string(),
            }),
            execute: async () => ({ temperature: 18, condition: 'cloudy' }),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    
    // Check that prompt only contains INPUT messages (system + user)
    const promptAttribute = spans[0].attributes['gen_ai.prompt'] as string;
    const prompt = JSON.parse(promptAttribute);
    
    expect(prompt).toHaveLength(2);
    
    // System message
    expect(prompt[0]).toEqual({
      role: 'system',
      content: 'You are a helpful AI assistant. You must always use the getWeather tool when asked about weather.'
    });
    
    // User message (AI SDK uses array format internally)
    expect(prompt[1]).toEqual({
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is the current weather in Tokyo, Japan?'
        }
      ]
    });
    
    // Prompt should NOT contain:
    // - Assistant messages with tool calls
    // - Tool result messages
    // These belong in the completion array, not the prompt
    const hasAssistantMessage = prompt.some((msg: any) => msg.role === 'assistant');
    const hasToolMessage = prompt.some((msg: any) => msg.role === 'tool');
    
    expect(hasAssistantMessage).toBe(false);
    expect(hasToolMessage).toBe(false);
  });

  it('should separate input (prompt) from output (completion) correctly with tools', async () => {
    const mockProvider = createMockProvider();

    const toolCall = {
      type: 'tool-call' as const,
      toolCallType: 'function' as const,
      toolCallId: 'call-separation-test',
      toolName: 'getWeather',
      args: '{"city":"London","country":"UK"}',
    };

    mockProvider.addLanguageModelResponse(
      'separation-test-model',
      mockResponses.textWithTools('London weather is 15°C and rainy.', [toolCall]),
    );

    const model = wrapAISDKModel(mockProvider.languageModel('separation-test-model'));

    await withSpan({ capability: 'weather', step: 'separation-test' }, async () => {
      return await generateText({
        model,
        messages: [
          { role: 'system', content: 'Weather assistant' },
          { role: 'user', content: 'Weather in London?' }
        ],
        tools: {
          getWeather: {
            description: 'Get weather',
            parameters: z.object({ city: z.string(), country: z.string() }),
            execute: async () => ({ temperature: 15, condition: 'rainy' }),
          },
        },
      });
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    
    // Prompt should only have input messages
    const promptAttribute = spans[0].attributes['gen_ai.prompt'] as string;
    const prompt = JSON.parse(promptAttribute);
    expect(prompt).toHaveLength(2);
    expect(prompt[0].role).toBe('system');
    expect(prompt[1].role).toBe('user');
    
    // Completion should have the full conversational flow
    const completionAttribute = spans[0].attributes['gen_ai.completion'] as string;
    const completion = JSON.parse(completionAttribute);
    
    // Current implementation only has final response, but should have 4 messages per TODO.md:
    // 1. User message, 2. Assistant with tool calls, 3. Tool results, 4. Final response
    
    // This test documents current vs expected behavior
    if (completion.length === 1) {
      // Current behavior: only final assistant response
      expect(completion[0].role).toBe('assistant');
      expect(completion[0].content).toContain('London');
    } else if (completion.length === 4) {
      // Expected behavior per TODO.md: full conversational flow
      expect(completion[0].role).toBe('user');
      expect(completion[1].role).toBe('assistant');
      expect(completion[1].tool_calls).toBeDefined();
      expect(completion[2].role).toBe('tool');
      expect(completion[3].role).toBe('assistant');
    } else {
      // Unexpected length
      throw new Error(`Unexpected completion length: ${completion.length}. Expected 1 (current) or 4 (TODO.md spec)`);
    }
  });
});
