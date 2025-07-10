import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Span } from '@opentelemetry/api';
import {
  analyzeV5Content,
  processV5Messages,
  formatV5Completion,
  setV5PreCallAttributes,
  setV5PostCallAttributes,
  setV5ProviderAttributes,
  setV5ContentAttributes,
  convertV5Usage,
  convertV5Result,
  type V5ModelInfo,
  type V5ResultInfo,
  type V5ContentAttributes,
} from '../../src/otel/v5-attributes';
import type {
  LanguageModelV2CallOptions,
  LanguageModelV2GenerateResult,
  LanguageModelV2Usage,
  LanguageModelV2CallWarning,
  LanguageModelV2ToolCall,
  ModelMessage,
  ContentPart,
} from '../../src/otel/vercel-v5';

// Mock span for testing
const createMockSpan = (): Span => ({
  setAttribute: vi.fn(),
  setAttributes: vi.fn(),
  addEvent: vi.fn(),
  setStatus: vi.fn(),
  updateName: vi.fn(),
  end: vi.fn(),
  recordException: vi.fn(),
  spanContext: vi.fn(),
  isRecording: vi.fn().mockReturnValue(true),
});

describe('V5 Attributes', () => {
  let mockSpan: Span;

  beforeEach(() => {
    mockSpan = createMockSpan();
    vi.clearAllMocks();
  });

  describe('analyzeV5Content', () => {
    it('should analyze text content correctly', () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello world' },
            { type: 'text', text: 'How are you?' },
          ],
        },
      ];

      const result = analyzeV5Content(messages);

      expect(result).toEqual({
        textParts: 2,
        imageParts: 0,
        fileParts: 0,
        reasoningParts: 0,
        toolCallParts: 0,
        toolResultParts: 0,
        totalParts: 2,
        fileTypes: [],
        fileSizes: [],
        imageTypes: [],
        reasoningLength: 0,
      });
    });

    it('should analyze mixed content types', () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image' },
            { type: 'image', image: 'data:image/jpeg;base64,/9j/4AAQ...', mimeType: 'image/jpeg' },
            { type: 'file', image: 'data:application/pdf;base64,JVBERi0x...', mimeType: 'application/pdf' },
          ],
        },
        {
          role: 'assistant',
          content: [
            { type: 'reasoning', reasoning: 'Let me analyze this step by step...' },
            { type: 'text', text: 'Based on the image analysis...' },
            { type: 'tool-call', toolCallId: 'call_123', toolName: 'analyze_image', args: { image_id: 'img_1' } },
          ],
        },
      ];

      const result = analyzeV5Content(messages);

      expect(result).toEqual({
        textParts: 2,
        imageParts: 1,
        fileParts: 1,
        reasoningParts: 1,
        toolCallParts: 1,
        toolResultParts: 0,
        totalParts: 6,
        fileTypes: ['application/pdf'],
        fileSizes: [expect.any(Number)],
        imageTypes: ['image/jpeg'],
        reasoningLength: 'Let me analyze this step by step...'.length,
      });
    });

    it('should handle file size estimation', () => {
      const base64Data = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'file', image: base64Data, mimeType: 'text/plain' },
          ],
        },
      ];

      const result = analyzeV5Content(messages);

      expect(result.fileSizes).toEqual([Math.floor(base64Data.length * 0.75)]);
    });

    it('should handle Uint8Array file sizes', () => {
      const binaryData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'file', image: binaryData, mimeType: 'application/octet-stream' },
          ],
        },
      ];

      const result = analyzeV5Content(messages);

      expect(result.fileSizes).toEqual([5]);
    });
  });

  describe('processV5Messages', () => {
    it('should process system messages', () => {
      const messages: ModelMessage[] = [
        {
          role: 'system',
          content: [{ type: 'text', text: 'You are a helpful assistant.' }],
        },
      ];

      const result = processV5Messages(messages);

      expect(result).toEqual([
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
      ]);
    });

    it('should process user messages with mixed content', () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image', image: 'data:image/jpeg;base64,/9j/4AAQ...', mimeType: 'image/jpeg' },
            { type: 'file', image: 'data:application/pdf;base64,JVBERi0x...', mimeType: 'application/pdf' },
          ],
        },
      ];

      const result = processV5Messages(messages);

      expect(result).toEqual([
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,/9j/4AAQ...', mime_type: 'image/jpeg' } },
            { type: 'file', file_url: { url: 'data:application/pdf;base64,JVBERi0x...', mime_type: 'application/pdf' } },
          ],
        },
      ]);
    });

    it('should process assistant messages with reasoning and tool calls', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            { type: 'reasoning', reasoning: 'Let me think about this...' },
            { type: 'text', text: 'Based on my analysis...' },
            { 
              type: 'tool-call', 
              toolCallId: 'call_123', 
              toolName: 'search_web', 
              args: { query: 'weather today' } 
            },
          ],
        },
      ];

      const result = processV5Messages(messages);

      expect(result).toEqual([
        {
          role: 'assistant',
          content: 'Based on my analysis...',
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: {
                name: 'search_web',
                arguments: JSON.stringify({ query: 'weather today' }),
              },
            },
          ],
          reasoning: 'Let me think about this...',
        },
      ]);
    });

    it('should process tool messages', () => {
      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'call_123',
              result: { temperature: 22, condition: 'sunny' },
            },
          ],
        },
      ];

      const result = processV5Messages(messages);

      expect(result).toEqual([
        {
          role: 'tool',
          tool_call_id: 'call_123',
          content: JSON.stringify({ temperature: 22, condition: 'sunny' }),
        },
      ]);
    });
  });

  describe('formatV5Completion', () => {
    it('should format completion with text only', () => {
      const result = formatV5Completion({
        text: 'Hello, how can I help you?',
        toolCalls: undefined,
      });

      expect(result).toEqual({
        role: 'assistant',
        content: 'Hello, how can I help you?',
      });
    });

    it('should format completion with tool calls', () => {
      const toolCalls: LanguageModelV2ToolCall[] = [
        {
          type: 'function',
          toolCallId: 'call_123',
          toolName: 'get_weather',
          args: { location: 'New York' },
        },
      ];

      const result = formatV5Completion({
        text: undefined,
        toolCalls,
      });

      expect(result).toEqual({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: JSON.stringify({ location: 'New York' }),
            },
            index: 0,
          },
        ],
      });
    });

    it('should format completion with reasoning', () => {
      const result = formatV5Completion({
        text: 'The answer is 42.',
        toolCalls: undefined,
        reasoning: 'I need to calculate the ultimate answer...',
      });

      expect(result).toEqual({
        role: 'assistant',
        content: 'The answer is 42.',
        reasoning: 'I need to calculate the ultimate answer...',
      });
    });
  });

  describe('setV5PreCallAttributes', () => {
    it('should set basic attributes', () => {
      const modelInfo: V5ModelInfo = {
        provider: 'openai',
        modelId: 'gpt-4',
        providerOptions: { region: 'us-east-1' },
      };

      const options: LanguageModelV2CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ],
        temperature: 0.7,
        maxOutputTokens: 100,
      };

      setV5PreCallAttributes(mockSpan, modelInfo, options);

      expect(mockSpan.setAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'gen_ai.operation.name': 'chat',
          'gen_ai.output.type': 'text',
          'gen_ai.request.model': 'gpt-4',
          'gen_ai.provider': 'openai',
          'gen_ai.system': 'vercel',
        })
      );

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.request.temperature', 0.7);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.request.max_tokens', 100);
    });

    it('should set content analysis attributes', () => {
      const modelInfo: V5ModelInfo = {
        provider: 'openai',
        modelId: 'gpt-4',
      };

      const options: LanguageModelV2CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this' },
              { type: 'image', image: 'data:image/jpeg;base64,test', mimeType: 'image/jpeg' },
              { type: 'file', image: 'data:application/pdf;base64,test', mimeType: 'application/pdf' },
            ],
          },
        ],
      };

      setV5PreCallAttributes(mockSpan, modelInfo, options);

      expect(mockSpan.setAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'gen_ai.prompt.content.text_parts': 1,
          'gen_ai.prompt.content.image_parts': 1,
          'gen_ai.prompt.content.file_parts': 1,
          'gen_ai.prompt.content.total_parts': 3,
        })
      );
    });

    it('should set tool configuration attributes', () => {
      const modelInfo: V5ModelInfo = {
        provider: 'openai',
        modelId: 'gpt-4',
      };

      const options: LanguageModelV2CallOptions = {
        prompt: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Get weather' }],
          },
        ],
        tools: [
          {
            type: 'function',
            name: 'get_weather',
            description: 'Get current weather',
            parameters: { type: 'object', properties: { location: { type: 'string' } } },
          },
        ],
        toolChoice: { type: 'auto' },
      };

      setV5PreCallAttributes(mockSpan, modelInfo, options);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.request.tools_count', 1);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.request.tools', expect.any(String));
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.request.tool_choice', expect.any(String));
    });
  });

  describe('setV5PostCallAttributes', () => {
    it('should set basic response attributes', () => {
      const result: V5ResultInfo = {
        response: {
          id: 'resp_123',
          modelId: 'gpt-4',
          timestamp: new Date('2023-01-01T00:00:00Z'),
        },
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        text: 'Hello, how can I help you?',
      };

      setV5PostCallAttributes(mockSpan, result);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.id', 'resp_123');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.model', 'gpt-4');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.timestamp', '2023-01-01T00:00:00.000Z');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.usage.input_tokens', 10);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.usage.output_tokens', 20);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.usage.total_tokens', 30);
    });

    it('should set tool call attributes', () => {
      const result: V5ResultInfo = {
        response: { id: 'resp_123' },
        finishReason: 'tool_calls',
        toolCalls: [
          {
            type: 'function',
            toolCallId: 'call_123',
            toolName: 'get_weather',
            args: { location: 'New York' },
          },
        ],
      };

      setV5PostCallAttributes(mockSpan, result);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.tool_calls_count', 1);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.tool_calls', expect.any(String));
    });

    it('should set warnings attributes', () => {
      const warnings: LanguageModelV2CallWarning[] = [
        { type: 'rate_limit', message: 'Rate limit approaching' },
        { type: 'content_filter', message: 'Content filtered' },
      ];

      const result: V5ResultInfo = {
        response: { id: 'resp_123' },
        finishReason: 'stop',
        text: 'Hello',
        warnings,
      };

      setV5PostCallAttributes(mockSpan, result);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.warnings', JSON.stringify(warnings));
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.warnings_count', 2);
    });

    it('should set timing attributes when startTime provided', () => {
      const result: V5ResultInfo = {
        response: { id: 'resp_123' },
        finishReason: 'stop',
        text: 'Hello',
      };

      const startTime = Date.now() / 1000 - 1; // 1 second ago

      setV5PostCallAttributes(mockSpan, result, startTime);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.duration', expect.any(Number));
    });
  });

  describe('setV5ProviderAttributes', () => {
    it('should set model provider options', () => {
      const modelInfo: V5ModelInfo = {
        provider: 'openai',
        modelId: 'gpt-4',
        providerOptions: { region: 'us-east-1', temperature: 0.5 },
      };

      setV5ProviderAttributes(mockSpan, modelInfo);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'gen_ai.model.provider_options',
        JSON.stringify({ region: 'us-east-1', temperature: 0.5 })
      );
    });

    it('should set request provider options', () => {
      const modelInfo: V5ModelInfo = {
        provider: 'openai',
        modelId: 'gpt-4',
      };

      const requestOptions = { timeout: 30000, retries: 3 };

      setV5ProviderAttributes(mockSpan, modelInfo, requestOptions);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'gen_ai.request.provider_options',
        JSON.stringify(requestOptions)
      );
    });

    it('should handle both model and request provider options', () => {
      const modelInfo: V5ModelInfo = {
        provider: 'openai',
        modelId: 'gpt-4',
        providerOptions: { region: 'us-east-1' },
      };

      const requestOptions = { timeout: 30000 };

      setV5ProviderAttributes(mockSpan, modelInfo, requestOptions);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'gen_ai.model.provider_options',
        JSON.stringify({ region: 'us-east-1' })
      );
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'gen_ai.request.provider_options',
        JSON.stringify({ timeout: 30000 })
      );
    });
  });

  describe('setV5ContentAttributes', () => {
    it('should set file content attributes', () => {
      const part: ContentPart = {
        type: 'file',
        image: 'data:application/pdf;base64,JVBERi0x...',
        mimeType: 'application/pdf',
      };

      setV5ContentAttributes(mockSpan, part, 'test_prefix');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('test_prefix.file.mime_type', 'application/pdf');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('test_prefix.file.size_estimate', expect.any(Number));
    });

    it('should set reasoning content attributes', () => {
      const part: ContentPart = {
        type: 'reasoning',
        reasoning: 'Let me think about this step by step...',
      };

      setV5ContentAttributes(mockSpan, part, 'test_prefix');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('test_prefix.reasoning.length', 'Let me think about this step by step...'.length);
    });

    it('should set tool call content attributes', () => {
      const part: ContentPart = {
        type: 'tool-call',
        toolCallId: 'call_123',
        toolName: 'get_weather',
        args: { location: 'New York' },
      };

      setV5ContentAttributes(mockSpan, part, 'test_prefix');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('test_prefix.tool_call.name', 'get_weather');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('test_prefix.tool_call.id', 'call_123');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('test_prefix.tool_call.args_length', expect.any(Number));
    });
  });

  describe('convertV5Usage', () => {
    it('should convert V5 usage to shared format', () => {
      const v5Usage: LanguageModelV2Usage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      };

      const result = convertV5Usage(v5Usage);

      expect(result).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should handle missing totalTokens', () => {
      const v5Usage: LanguageModelV2Usage = {
        promptTokens: 10,
        completionTokens: 20,
      };

      const result = convertV5Usage(v5Usage);

      expect(result).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: undefined,
      });
    });
  });

  describe('convertV5Result', () => {
    it('should convert V5 result to shared format', () => {
      const v5Result: LanguageModelV2GenerateResult = {
        response: {
          id: 'resp_123',
          modelId: 'gpt-4',
          timestamp: new Date('2023-01-01T00:00:00Z'),
        },
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        text: 'Hello, how can I help you?',
        toolCalls: [
          {
            type: 'function',
            toolCallId: 'call_123',
            toolName: 'get_weather',
            args: { location: 'New York' },
          },
        ],
        providerMetadata: { custom: 'data' },
        warnings: [{ type: 'rate_limit', message: 'Rate limit approaching' }],
      };

      const result = convertV5Result(v5Result);

      expect(result).toEqual({
        response: {
          id: 'resp_123',
          modelId: 'gpt-4',
          timestamp: new Date('2023-01-01T00:00:00Z'),
        },
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        text: 'Hello, how can I help you?',
        toolCalls: [
          {
            type: 'function',
            toolCallId: 'call_123',
            toolName: 'get_weather',
            args: { location: 'New York' },
          },
        ],
        providerMetadata: { custom: 'data' },
        warnings: [{ type: 'rate_limit', message: 'Rate limit approaching' }],
      });
    });

    it('should handle minimal V5 result', () => {
      const v5Result: LanguageModelV2GenerateResult = {
        response: {},
        finishReason: 'stop',
      };

      const result = convertV5Result(v5Result);

      expect(result).toEqual({
        response: {},
        finishReason: 'stop',
        usage: undefined,
        text: undefined,
        toolCalls: undefined,
        providerMetadata: undefined,
        warnings: undefined,
      });
    });
  });
});
