import { describe, it, expect } from 'vitest';
import {
  convertV5StreamChunk,
  mergeToolCallDeltas,
  finalizeStreamingData,
  validateV5StreamChunk,
  safeParseStreamingArgs,
  type V5StreamChunk,
  type AccumulatedToolCall,
} from '../../src/otel/message-conversion';

describe('Streaming Conversion Utilities', () => {
  describe('convertV5StreamChunk', () => {
    it('should convert text-delta chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'text-delta',
        textDelta: 'Hello world',
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'text-delta',
        textDelta: 'Hello world',
      });
    });

    it('should convert tool-call chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'tool-call',
        toolCallType: 'function',
        toolCallId: 'call-123',
        toolName: 'calculator',
        args: { expression: '2+2' },
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'tool-call',
        toolCallType: 'function',
        toolCallId: 'call-123',
        toolName: 'calculator',
        args: { expression: '2+2' },
      });
    });

    it('should convert tool-call-delta chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-123',
        toolName: 'calculator',
        argsTextDelta: '{"expression":',
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'tool-call-delta',
        toolCallId: 'call-123',
        toolName: 'calculator',
        argsTextDelta: '{"expression":',
      });
    });

    it('should convert tool-result chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'tool-result',
        toolCallId: 'call-123',
        result: { answer: 4 },
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'tool-result',
        toolCallId: 'call-123',
        result: { answer: 4 },
      });
    });

    it('should convert finish chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
        },
      });
    });

    it('should convert error chunks', () => {
      const error = new Error('Test error');
      const v5Chunk: V5StreamChunk = {
        type: 'error',
        error,
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'error',
        error,
      });
    });

    it('should return null for response-metadata chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'response-metadata',
        responseMetadata: { custom: 'value' },
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toBeNull();
    });

    it('should return null for unknown chunk types', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'unknown-type' as any,
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toBeNull();
    });
  });

  describe('mergeToolCallDeltas', () => {
    it('should create new tool call from first delta', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      const chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        toolName: 'calculator',
        argsTextDelta: '{"expression":',
      };

      mergeToolCallDeltas(accumulated, chunk);

      const result = accumulated.get('call-1');
      expect(result).toEqual({
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression":',
        argsComplete: false,
      });
    });

    it('should merge subsequent deltas', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      accumulated.set('call-1', {
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression":',
        argsComplete: false,
      });

      const chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        argsTextDelta: ' "2+2"}',
      };

      mergeToolCallDeltas(accumulated, chunk);

      const result = accumulated.get('call-1');
      expect(result?.args).toBe('{"expression": "2+2"}');
    });

    it('should update tool name if not already set', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      accumulated.set('call-1', {
        toolCallId: 'call-1',
        toolName: '',
        args: '{"expression":',
        argsComplete: false,
      });

      const chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        toolName: 'calculator',
        argsTextDelta: ' "2+2"}',
      };

      mergeToolCallDeltas(accumulated, chunk);

      const result = accumulated.get('call-1');
      expect(result?.toolName).toBe('calculator');
    });

    it('should not update tool name if already set', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      accumulated.set('call-1', {
        toolCallId: 'call-1',
        toolName: 'existing-tool',
        args: '{"expression":',
        argsComplete: false,
      });

      const chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        toolName: 'new-tool',
        argsTextDelta: ' "2+2"}',
      };

      mergeToolCallDeltas(accumulated, chunk);

      const result = accumulated.get('call-1');
      expect(result?.toolName).toBe('existing-tool');
    });

    it('should handle chunks without tool call ID', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      const chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        argsTextDelta: '{"expression": "2+2"}',
      };

      mergeToolCallDeltas(accumulated, chunk);

      expect(accumulated.size).toBe(0);
    });

    it('should handle non-tool-call-delta chunks', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      const chunk: V5StreamChunk = {
        type: 'text-delta',
        textDelta: 'Hello',
      };

      mergeToolCallDeltas(accumulated, chunk);

      expect(accumulated.size).toBe(0);
    });
  });

  describe('finalizeStreamingData', () => {
    it('should finalize complete streaming data', () => {
      const toolCalls = new Map<string, AccumulatedToolCall>();
      toolCalls.set('call-1', {
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression": "2+2"}',
        argsComplete: true,
      });
      toolCalls.set('call-2', {
        toolCallId: 'call-2',
        toolName: 'weather',
        args: '{"location": "SF"}',
        argsComplete: true,
      });

      const data = {
        fullText: 'Let me calculate that for you.',
        toolCalls,
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        finishReason: 'tool-calls' as const,
        responseMetadata: { custom: 'value' },
      };

      const result = finalizeStreamingData(data);

      expect(result.text).toBe('Let me calculate that for you.');
      expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5 });
      expect(result.finishReason).toBe('tool-calls');
      expect(result.providerMetadata).toEqual({ custom: 'value' });
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls?.[0]).toEqual({
        toolCallType: 'function',
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression": "2+2"}',
      });
      expect(result.toolCalls?.[1]).toEqual({
        toolCallType: 'function',
        toolCallId: 'call-2',
        toolName: 'weather',
        args: '{"location": "SF"}',
      });
    });

    it('should filter out incomplete tool calls', () => {
      const toolCalls = new Map<string, AccumulatedToolCall>();
      toolCalls.set('call-1', {
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression": "2+2"}',
        argsComplete: true,
      });
      toolCalls.set('call-2', {
        toolCallId: 'call-2',
        toolName: 'weather',
        args: '{"location":',
        argsComplete: false,
      });

      const data = {
        fullText: 'Text content',
        toolCalls,
      };

      const result = finalizeStreamingData(data);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls?.[0].toolCallId).toBe('call-1');
    });

    it('should handle empty data', () => {
      const data = {
        toolCalls: new Map<string, AccumulatedToolCall>(),
      };

      const result = finalizeStreamingData(data);

      expect(result.text).toBeUndefined();
      expect(result.usage).toBeUndefined();
      expect(result.finishReason).toBeUndefined();
      expect(result.providerMetadata).toBeUndefined();
      expect(result.toolCalls).toBeUndefined();
    });

    it('should handle only text content', () => {
      const data = {
        fullText: 'Hello world',
        toolCalls: new Map<string, AccumulatedToolCall>(),
      };

      const result = finalizeStreamingData(data);

      expect(result.text).toBe('Hello world');
      expect(result.toolCalls).toBeUndefined();
    });
  });

  describe('safeParseStreamingArgs', () => {
    it('should parse valid JSON', () => {
      const args = '{"expression": "2+2", "format": "decimal"}';
      const result = safeParseStreamingArgs(args);

      expect(result).toEqual({ expression: '2+2', format: 'decimal' });
    });

    it('should return string for invalid JSON', () => {
      const args = '{"expression": "2+2"';
      const result = safeParseStreamingArgs(args);

      expect(result).toBe('{"expression": "2+2"');
    });

    it('should handle empty string', () => {
      const result = safeParseStreamingArgs('');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      const result = safeParseStreamingArgs(123 as any);
      expect(result).toBe(123);
    });

    it('should handle null/undefined input', () => {
      expect(safeParseStreamingArgs(null as any)).toBeNull();
      expect(safeParseStreamingArgs(undefined as any)).toBeUndefined();
    });
  });

  describe('validateV5StreamChunk', () => {
    it('should validate text-delta chunks', () => {
      const chunk = {
        type: 'text-delta',
        textDelta: 'Hello world',
      };

      expect(() => validateV5StreamChunk(chunk)).not.toThrow();
    });

    it('should validate tool-call chunks', () => {
      const chunk = {
        type: 'tool-call',
        toolCallId: 'call-123',
        toolName: 'calculator',
        args: { expression: '2+2' },
      };

      expect(() => validateV5StreamChunk(chunk)).not.toThrow();
    });

    it('should validate tool-call-delta chunks', () => {
      const chunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-123',
        argsTextDelta: '{"expression":',
      };

      expect(() => validateV5StreamChunk(chunk)).not.toThrow();
    });

    it('should validate finish chunks', () => {
      const chunk = {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 5 },
      };

      expect(() => validateV5StreamChunk(chunk)).not.toThrow();
    });

    it('should validate error chunks', () => {
      const chunk = {
        type: 'error',
        error: new Error('Test error'),
      };

      expect(() => validateV5StreamChunk(chunk)).not.toThrow();
    });

    it('should validate response-metadata chunks', () => {
      const chunk = {
        type: 'response-metadata',
        responseMetadata: { custom: 'value' },
      };

      expect(() => validateV5StreamChunk(chunk)).not.toThrow();
    });

    it('should throw for non-object chunks', () => {
      expect(() => validateV5StreamChunk('invalid')).toThrow('Stream chunk must be an object');
    });

    it('should throw for chunks without type', () => {
      expect(() => validateV5StreamChunk({ data: 'test' })).toThrow('Stream chunk must have a valid type');
    });

    it('should throw for unsupported chunk types', () => {
      expect(() => validateV5StreamChunk({ type: 'invalid-type' })).toThrow('Unsupported stream chunk type: invalid-type');
    });

    it('should throw for text-delta chunks with invalid textDelta', () => {
      expect(() => validateV5StreamChunk({ type: 'text-delta', textDelta: 123 })).toThrow('text-delta chunk must have string textDelta');
    });

    it('should throw for tool-call chunks without toolCallId', () => {
      expect(() => validateV5StreamChunk({ type: 'tool-call', toolName: 'test' })).toThrow('tool-call chunk must have string toolCallId');
    });

    it('should throw for tool-call-delta chunks without toolCallId', () => {
      expect(() => validateV5StreamChunk({ type: 'tool-call-delta', argsTextDelta: 'test' })).toThrow('tool-call-delta chunk must have string toolCallId');
    });

    it('should throw for error chunks with invalid error', () => {
      expect(() => validateV5StreamChunk({ type: 'error', error: 'not an error' })).toThrow('error chunk must have Error object');
    });
  });
});
