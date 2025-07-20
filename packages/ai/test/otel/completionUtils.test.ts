import { describe, it, expect } from 'vitest';
import type { OpenAIMessage } from '../../src/otel/vercelTypes';
import {
  formatToolCallsInCompletion,
  aggregateStreamingToolCalls,
  createToolCallMetadata,
} from '../../src/otel/completionUtils';
import type {
  CompletionArray,
  CompletionAssistantMessage,
  CompletionToolMessage,
} from '../../src/otel/completionTypes';

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
        includeTimestamps: false,
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
        includeTimestamps: false,
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
        includeTimestamps: false,
      });

      expect(result.assistantMessage.content).toBe(
        "I'll analyze your code and run the tests for you.",
      );
      expect(result.assistantMessage.tool_calls).toHaveLength(1);
    });

    it('should include timestamps when requested', () => {
      const result = formatToolCallsInCompletion({
        promptMessages: [
          {
            role: 'user',
            content: 'Test message',
          },
        ],
        includeTimestamps: true,
      });

      expect(result.completion[0]).toHaveProperty('timestamp');
      expect(result.completion[1]).toHaveProperty('timestamp');
      expect(typeof result.completion[0].timestamp).toBe('string');
    });

    it('should handle tool results with metadata', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:00:05Z');
      const metadata = createToolCallMetadata({
        startTime,
        endTime,
        status: 'ok',
        spanId: 'span_123',
      });

      const result = formatToolCallsInCompletion({
        toolResults: [
          {
            toolCallId: 'call_123',
            result: 'success',
            metadata,
          },
        ],
        includeTimestamps: false,
      });

      expect(result.toolMessages[0].metadata).toEqual({
        start_time: '2024-01-01T10:00:00.000Z',
        end_time: '2024-01-01T10:00:05.000Z',
        duration_ms: 5000,
        status: 'ok',
        span_id: 'span_123',
      });
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

  describe('createToolCallMetadata', () => {
    it('should create metadata with correct timing', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:00:05.500Z');

      const metadata = createToolCallMetadata({
        startTime,
        endTime,
        status: 'ok',
        spanId: 'span_123',
        tokensUsed: 150,
      });

      expect(metadata).toEqual({
        start_time: '2024-01-01T10:00:00.000Z',
        end_time: '2024-01-01T10:00:05.500Z',
        duration_ms: 5500,
        status: 'ok',
        span_id: 'span_123',
        tokens_used: 150,
      });
    });

    it('should handle error status with message', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1000);

      const metadata = createToolCallMetadata({
        startTime,
        endTime,
        status: 'error',
        errorMessage: 'Tool execution failed',
      });

      expect(metadata.status).toBe('error');
      expect(metadata.error_message).toBe('Tool execution failed');
      expect(metadata.duration_ms).toBe(1000);
    });
  });

  describe('type safety', () => {
    it('should enforce correct message types', () => {
      const completion: CompletionArray = [
        {
          role: 'user',
          content: 'Test message',
          timestamp: '2024-01-01T10:00:00Z',
        },
        {
          role: 'assistant',
          content: 'Response',
          timestamp: '2024-01-01T10:00:01Z',
        },
      ];

      expect(completion[0].role).toBe('user');
      expect(completion[1].role).toBe('assistant');
    });

    it('should enforce tool call structure', () => {
      const assistantMessage: CompletionAssistantMessage = {
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
      const toolMessage: CompletionToolMessage = {
        role: 'tool',
        content: '{"result": "success"}',
        tool_call_id: 'call_123',
        metadata: {
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T10:00:05Z',
          duration_ms: 5000,
          status: 'ok',
        },
      };

      expect(toolMessage.role).toBe('tool');
      expect(toolMessage.tool_call_id).toBe('call_123');
      expect(toolMessage.metadata!.status).toBe('ok');
    });
  });
});
