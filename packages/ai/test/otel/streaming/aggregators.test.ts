import { describe, it, expect } from 'vitest';
import {
  ToolCallAggregator,
  TextAggregator,
  StreamStats,
  ToolCallAggregatorV2,
  TextAggregatorV2,
  StreamStatsV2,
} from '../../../src/otel/streaming/aggregators';
import type { LanguageModelV1StreamPart } from '@ai-sdk/providerv1';
import type { LanguageModelV2StreamPart } from '@ai-sdk/providerv2';

describe('StreamingAggregators', () => {
  describe('ToolCallAggregator', () => {
    it('should aggregate tool calls', () => {
      const aggregator = new ToolCallAggregator();

      const toolCallChunk: LanguageModelV1StreamPart = {
        type: 'tool-call',
        toolCallId: 'test-1',
        toolCallType: 'function',
        toolName: 'test-tool',
        args: '{"param": "value"}',
      };

      aggregator.handleChunk(toolCallChunk);

      expect(aggregator.result).toEqual([
        {
          toolCallId: 'test-1',
          toolCallType: 'function',
          toolName: 'test-tool',
          args: '{"param": "value"}',
        },
      ]);
    });

    it('should aggregate tool call deltas', () => {
      const aggregator = new ToolCallAggregator();

      const delta1: LanguageModelV1StreamPart = {
        type: 'tool-call-delta',
        toolCallId: 'test-1',
        toolCallType: 'function',
        toolName: 'test-tool',
        argsTextDelta: '{"param":',
      };

      const delta2: LanguageModelV1StreamPart = {
        type: 'tool-call-delta',
        toolCallId: 'test-1',
        toolCallType: 'function',
        toolName: 'test-tool',
        argsTextDelta: ' "value"}',
      };

      aggregator.handleChunk(delta1);
      aggregator.handleChunk(delta2);

      expect(aggregator.result).toEqual([
        {
          toolCallId: 'test-1',
          toolCallType: 'function',
          toolName: 'test-tool',
          args: '{"param": "value"}',
        },
      ]);
    });
  });

  describe('TextAggregator', () => {
    it('should aggregate text deltas', () => {
      const aggregator = new TextAggregator();

      const chunk1: LanguageModelV1StreamPart = {
        type: 'text-delta',
        textDelta: 'Hello ',
      };

      const chunk2: LanguageModelV1StreamPart = {
        type: 'text-delta',
        textDelta: 'world!',
      };

      aggregator.feed(chunk1);
      aggregator.feed(chunk2);

      expect(aggregator.text).toBe('Hello world!');
    });

    it('should return undefined for empty text', () => {
      const aggregator = new TextAggregator();
      expect(aggregator.text).toBeUndefined();
    });
  });

  describe('StreamStats', () => {
    it('should track response metadata', () => {
      const stats = new StreamStats();

      const metadataChunk: LanguageModelV1StreamPart = {
        type: 'response-metadata',
        id: 'test-123',
        modelId: 'test-model',
      };

      stats.feed(metadataChunk);

      expect(stats.result.response).toEqual({
        id: 'test-123',
        modelId: 'test-model',
      });
    });

    it('should track finish reason and usage', () => {
      const stats = new StreamStats();

      const finishChunk: LanguageModelV1StreamPart = {
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
        },
      };

      stats.feed(finishChunk);

      expect(stats.result.finishReason).toBe('stop');
      expect(stats.result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
      });
    });
  });

  describe('V2 Aggregators', () => {
    describe('ToolCallAggregatorV2', () => {
      it('should aggregate V2 tool calls', () => {
        const aggregator = new ToolCallAggregatorV2();

        const toolCallChunk: LanguageModelV2StreamPart = {
          type: 'tool-call',
          toolCallId: 'test-1',
          toolName: 'test-tool',
          input: '{"param": "value"}',
        };

        aggregator.handleChunk(toolCallChunk);

        expect(aggregator.result).toEqual([
          {
            type: 'tool-call',
            toolCallId: 'test-1',
            toolName: 'test-tool',
            input: '{"param": "value"}',
          },
        ]);
      });

      it('should handle multiple tool calls', () => {
        const aggregator = new ToolCallAggregatorV2();

        const toolCall1: LanguageModelV2StreamPart = {
          type: 'tool-call',
          toolCallId: 'test-1',
          toolName: 'test-tool-1',
          input: '{"param": "value1"}',
        };

        const toolCall2: LanguageModelV2StreamPart = {
          type: 'tool-call',
          toolCallId: 'test-2',
          toolName: 'test-tool-2',
          input: '{"param": "value2"}',
        };

        aggregator.handleChunk(toolCall1);
        aggregator.handleChunk(toolCall2);

        expect(aggregator.result).toHaveLength(2);
        expect(aggregator.result[0].toolCallId).toBe('test-1');
        expect(aggregator.result[1].toolCallId).toBe('test-2');
      });
    });

    describe('TextAggregatorV2', () => {
      it('should aggregate V2 text chunks', () => {
        const aggregator = new TextAggregatorV2();

        const chunk1: LanguageModelV2StreamPart = {
          id: 'test-1',
          type: 'text-start',
        };

        const chunk2: LanguageModelV2StreamPart = {
          id: 'test-2',
          type: 'text-delta',
          delta: 'Hello ',
        };

        const chunk3: LanguageModelV2StreamPart = {
          id: 'test-3',
          type: 'text-delta',
          delta: 'world!',
        };

        const chunk4: LanguageModelV2StreamPart = {
          id: 'test-4',
          type: 'text-end',
        };

        aggregator.feed(chunk1);
        aggregator.feed(chunk2);
        aggregator.feed(chunk3);
        aggregator.feed(chunk4);

        expect(aggregator.text).toBe('Hello world!');
      });

      it('should return undefined for empty text', () => {
        const aggregator = new TextAggregatorV2();
        expect(aggregator.text).toBeUndefined();
      });
    });

    describe('StreamStatsV2', () => {
      it('should track V2 response metadata', () => {
        const stats = new StreamStatsV2();

        const metadataChunk: LanguageModelV2StreamPart = {
          type: 'response-metadata',
          id: 'test-123',
          modelId: 'test-model',
          timestamp: new Date(),
        };

        stats.feed(metadataChunk);

        expect(stats.result.response).toEqual({
          id: 'test-123',
          modelId: 'test-model',
          timestamp: expect.any(Date),
        });
      });

      it('should track V2 finish reason and usage', () => {
        const stats = new StreamStatsV2();

        const finishChunk: LanguageModelV2StreamPart = {
          type: 'finish',
          finishReason: 'stop',
          usage: {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
          },
        };

        stats.feed(finishChunk);

        expect(stats.result.finishReason).toBe('stop');
        expect(stats.result.usage).toEqual({
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        });
      });

      it('should track time to first token', async () => {
        const stats = new StreamStatsV2();

        // Initially no first token time
        expect(stats.firstTokenTime).toBeUndefined();

        // Wait a tiny bit to ensure time passes
        await new Promise((resolve) => setTimeout(resolve, 100));

        const textChunk: LanguageModelV2StreamPart = {
          type: 'text-start',
          id: 'text-id',
        };

        stats.feed(textChunk);

        // Should now have first token time
        expect(stats.firstTokenTime).toBeGreaterThan(0);
      });
    });
  });
});
