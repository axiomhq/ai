import { describe, it, expect } from 'vitest';
import type { LanguageModelV1FunctionToolCall } from '@ai-sdk/providerv1';
import type { LanguageModelV2ToolCall } from '@ai-sdk/providerv2';
import { normalizeV1ToolCalls, normalizeV2ToolCalls } from '../../../src/otel/utils/normalized';
import { appendToolCalls } from 'src/util/promptUtils';

describe('normalized.ts', () => {
  describe('normalizeV1ToolCall', () => {
    it('should normalize a V1 tool call with string args', () => {
      const v1ToolCall: LanguageModelV1FunctionToolCall = {
        toolCallType: 'function',
        toolCallId: 'call_123',
        toolName: 'get_weather',
        args: '{"location": "New York"}',
      };

      const result = normalizeV1ToolCalls([v1ToolCall]);

      expect(result).toEqual([
        {
          toolCallId: 'call_123',
          toolName: 'get_weather',
          args: '{"location": "New York"}',
          toolCallType: 'function',
        },
      ]);
    });

    it('should normalize a V1 tool call with object args', () => {
      const v1ToolCall: LanguageModelV1FunctionToolCall = {
        toolCallType: 'function',
        toolCallId: 'call_456',
        toolName: 'calculate',
        args: JSON.stringify({ operation: 'add', a: 1, b: 2 }),
      };

      const result = normalizeV1ToolCalls([v1ToolCall]);

      expect(result).toEqual([
        {
          toolCallId: 'call_456',
          toolName: 'calculate',
          args: '{"operation":"add","a":1,"b":2}',
          toolCallType: 'function',
        },
      ]);
    });
  });

  describe('normalizeV2ToolCalls', () => {
    it('should normalize a V2 tool call with string args', () => {
      const v2ToolCall: LanguageModelV2ToolCall = {
        type: 'tool-call',
        toolCallId: 'call_789',
        toolName: 'search',
        input: '{"query": "test"}',
      };

      const result = normalizeV2ToolCalls([v2ToolCall]);

      expect(result).toEqual([
        {
          toolCallId: 'call_789',
          toolName: 'search',
          args: '{"query":"test"}',
          toolCallType: 'function',
        },
      ]);
    });

    it('should normalize a V2 tool call with object args', () => {
      const v2ToolCall: LanguageModelV2ToolCall = {
        type: 'tool-call',
        toolCallId: 'call_abc',
        toolName: 'format',
        input: JSON.stringify({ text: 'hello', format: 'uppercase' }),
      };

      const result = normalizeV2ToolCalls([v2ToolCall]);

      expect(result).toEqual([
        {
          toolCallId: 'call_abc',
          toolName: 'format',
          args: '{"text":"hello","format":"uppercase"}',
          toolCallType: 'function',
        },
      ]);
    });

    it('should clean up spacing in V2 tool call args', () => {
      const v2ToolCall: LanguageModelV2ToolCall = {
        type: 'tool-call',
        toolCallId: 'call_def',
        toolName: 'test',
        input: '{"key": "value", "number": 123}',
      };

      const result = normalizeV2ToolCalls([v2ToolCall]);

      expect(result).toEqual([
        {
          toolCallId: 'call_def',
          toolName: 'test',
          args: '{"key":"value", "number":123}',
          toolCallType: 'function',
        },
      ]);
    });
  });

  describe('appendToolCalls', () => {
    it('should append tool calls and results to prompt', () => {
      const originalPrompt = [{ role: 'user' as const, content: 'Hello' }];

      const toolCalls = [
        {
          toolCallId: 'call_123',
          toolName: 'get_weather',
          args: '{"location": "NYC"}',
          toolCallType: 'function' as const,
        },
      ];

      const toolResults = new Map([['get_weather', { temperature: 72, conditions: 'sunny' }]]);

      const result = appendToolCalls(
        originalPrompt,
        toolCalls,
        toolResults,
        'Let me check the weather for you.',
      );

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          content: 'Let me check the weather for you.',
          tool_calls: [
            {
              id: 'call_123',
              function: {
                name: 'get_weather',
                arguments: '{"location": "NYC"}',
              },
              type: 'function',
            },
          ],
        },
        {
          role: 'tool',
          tool_call_id: 'call_123',
          content: '{"temperature":72,"conditions":"sunny"}',
        },
      ]);
    });

    it('should handle tool calls without results', () => {
      const originalPrompt = [{ role: 'user' as const, content: 'Hello' }];

      const toolCalls = [
        {
          toolCallId: 'call_456',
          toolName: 'unknown_tool',
          args: '{}',
          toolCallType: 'function' as const,
        },
      ];

      const toolResults = new Map();

      const result = appendToolCalls(originalPrompt, toolCalls, toolResults, null);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_456',
              function: {
                name: 'unknown_tool',
                arguments: '{}',
              },
              type: 'function',
            },
          ],
        },
      ]);
    });
  });
});
