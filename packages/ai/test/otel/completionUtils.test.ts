import { describe, it, expect } from 'vitest';
import type { OpenAIMessage } from '../../src/otel/vercelTypes';
import {
  formatToolCallsInCompletion,
  aggregateStreamingToolCalls,
} from '../../src/otel/completionUtils';
import type { CompletionArray } from '../../src/otel/completionTypes';
import type { OpenAIAssistantMessage, OpenAIToolMessage } from '../../src/otel/vercelTypes';

describe('completionUtils', () => {
  describe('formatToolCallsInCompletion', () => {
    it('should format simple tool call correctly', () => {
      const promptMessages: OpenAIMessage[] = [
        {
          role: 'user',
          content: "What's the weather in NYC?",
        },
      ];

      const toolCalls = [
        {
          id: 'call_123',
          toolName: 'get_weather',
          args: '{"location": "NYC"}',
        },
      ];

      const toolResults = [
        {
          toolCallId: 'call_123',
          result: { temperature: 72, condition: 'sunny' },
        },
      ];

      const result = formatToolCallsInCompletion({
        promptMessages,
        toolCalls,
        toolResults,
      });

      expect(result.completion).toHaveLength(3);
      expect(result.completion[0]).toEqual({
        role: 'user',
        content: "What's the weather in NYC?",
      });
      expect(result.completion[1]).toEqual({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_123',
            type: 'function',
            function: {
              name: 'get_weather',
              arguments: '{"location": "NYC"}',
            },
          },
        ],
      });
      expect(result.completion[2]).toEqual({
        role: 'tool',
        content: '{"temperature":72,"condition":"sunny"}',
        tool_call_id: 'call_123',
      });
    });

    it('should handle multiple tool calls', () => {
      const promptMessages: OpenAIMessage[] = [
        {
          role: 'user',
          content: 'Get weather for NYC and LA',
        },
      ];

      const toolCalls = [
        {
          id: 'call_123',
          toolName: 'get_weather',
          args: '{"location": "NYC"}',
        },
        {
          id: 'call_456',
          toolName: 'get_weather',
          args: '{"location": "LA"}',
        },
      ];

      const toolResults = [
        {
          toolCallId: 'call_123',
          result: { temperature: 72, condition: 'sunny' },
        },
        {
          toolCallId: 'call_456',
          result: { temperature: 85, condition: 'clear' },
        },
      ];

      const result = formatToolCallsInCompletion({
        promptMessages,
        toolCalls,
        toolResults,
      });

      expect(result.completion).toHaveLength(4);
      expect(result.assistantMessage.tool_calls).toHaveLength(2);
      expect(result.toolMessages).toHaveLength(2);
    });

    it('should handle tool call with text response', () => {
      const result = formatToolCallsInCompletion({
        promptMessages: [
          {
            role: 'user',
            content: 'Help me debug this code',
          },
        ],
        text: "I'll analyze your code and run the tests for you.",
        toolCalls: [
          {
            id: 'call_789',
            toolName: 'run_tests',
            args: '{"test_suite": "unit"}',
          },
        ],
        toolResults: [
          {
            toolCallId: 'call_789',
            result: { passed: 15, failed: 2, errors: ['test_user_auth failed'] },
          },
        ],
      });

      expect(result.assistantMessage.content).toBe(
        "I'll analyze your code and run the tests for you.",
      );
      expect(result.assistantMessage.tool_calls).toHaveLength(1);
    });
  });

  describe('aggregateStreamingToolCalls', () => {
    it('should aggregate streaming tool call chunks', () => {
      const chunks = [
        {
          toolCallId: 'call_123',
          toolName: 'get_weather',
          argsTextDelta: '{"location":',
        },
        {
          toolCallId: 'call_123',
          argsTextDelta: ' "NYC"}',
        },
        {
          toolCallId: 'call_456',
          toolName: 'get_time',
          argsTextDelta: '{"timezone":',
        },
        {
          toolCallId: 'call_456',
          argsTextDelta: ' "EST"}',
        },
      ];

      const result = aggregateStreamingToolCalls(chunks);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        toolCallId: 'call_123',
        toolName: 'get_weather',
        args: '{"location": "NYC"}',
        toolCallType: 'function',
      });
      expect(result[1]).toEqual({
        toolCallId: 'call_456',
        toolName: 'get_time',
        args: '{"timezone": "EST"}',
        toolCallType: 'function',
      });
    });

    it('should handle chunks without toolCallId', () => {
      const chunks = [
        {
          toolCallId: 'call_123',
          toolName: 'test_tool',
          argsTextDelta: '{"test":',
        },
        {
          argsTextDelta: ' "value"}', // No toolCallId
        },
      ];

      const result = aggregateStreamingToolCalls(chunks);

      expect(result).toHaveLength(1);
      expect(result[0].args).toBe('{"test":');
    });
  });

  describe('type safety', () => {
    it('should enforce correct message types', () => {
      const completion: CompletionArray = [
        {
          role: 'user',
          content: 'Test message',
        },
        {
          role: 'assistant',
          content: 'Response',
        },
      ];

      expect(completion[0].role).toBe('user');
      expect(completion[1].role).toBe('assistant');
    });

    it('should enforce tool call structure', () => {
      const assistantMessage: OpenAIAssistantMessage = {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_123',
            type: 'function',
            function: {
              name: 'test_tool',
              arguments: '{"param": "value"}',
            },
          },
        ],
      };

      expect(assistantMessage.tool_calls![0].type).toBe('function');
      expect(assistantMessage.tool_calls![0].function.name).toBe('test_tool');
    });

    it('should enforce tool message structure', () => {
      const toolMessage: OpenAIToolMessage = {
        role: 'tool',
        content: '{"result": "success"}',
        tool_call_id: 'call_123',
      };

      expect(toolMessage.role).toBe('tool');
      expect(toolMessage.tool_call_id).toBe('call_123');
    });
  });
});
