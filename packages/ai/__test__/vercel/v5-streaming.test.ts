import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { AxiomWrappedLanguageModelV2 } from '../../src/otel/vercel-v5';
import { 
  convertV5StreamChunk, 
  mergeToolCallDeltas, 
  finalizeStreamingData,
  validateV5StreamChunk,
  type V5StreamChunk,
  type AccumulatedToolCall 
} from '../../src/otel/message-conversion';
import type { LanguageModelV2, LanguageModelV2StreamPart } from '../../src/otel/vercel-v5';

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

// Mock LanguageModelV2 for testing
class MockLanguageModelV2 implements LanguageModelV2 {
  readonly specificationVersion = 'v2' as const;
  readonly provider = 'mock-provider';
  readonly modelId = 'mock-model';
  readonly providerOptions = { test: 'value' };

  private streamChunks: LanguageModelV2StreamPart[] = [];

  constructor(streamChunks: LanguageModelV2StreamPart[] = []) {
    this.streamChunks = streamChunks;
  }

  async doGenerate(options: any): Promise<any> {
    throw new Error('Not implemented for streaming tests');
  }

  async doStream(options: any): Promise<any> {
    const stream = new ReadableStream({
      start: (controller) => {
        for (const chunk of this.streamChunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return {
      stream,
      response: {
        id: 'test-response-id',
        timestamp: new Date(),
        modelId: this.modelId,
      },
    };
  }
}

describe('V5 Streaming Format Handling', () => {
  describe('Stream Chunk Processing', () => {
    it('should handle text-delta chunks', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'text-delta', textDelta: ' world' },
        { type: 'text-delta', textDelta: '!' },
        { type: 'finish', finishReason: 'stop' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      // Collect all chunks
      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(4);
      expect(collectedChunks[0].type).toBe('text-delta');
      expect(collectedChunks[0].textDelta).toBe('Hello');
      expect(collectedChunks[1].textDelta).toBe(' world');
      expect(collectedChunks[2].textDelta).toBe('!');
      expect(collectedChunks[3].type).toBe('finish');
    });

    it('should handle tool-call-delta chunks', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'tool-call-delta', toolCallId: 'call-1', toolName: 'calculator' },
        { type: 'tool-call-delta', toolCallId: 'call-1', argsTextDelta: '{"expression": "2+' },
        { type: 'tool-call-delta', toolCallId: 'call-1', argsTextDelta: '2"}' },
        { type: 'finish', finishReason: 'tool-calls' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Calculate 2+2' }] }],
      });

      // Collect all chunks
      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(4);
      expect(collectedChunks[0].type).toBe('tool-call-delta');
      expect(collectedChunks[0].toolCallId).toBe('call-1');
      expect(collectedChunks[0].toolName).toBe('calculator');
      expect(collectedChunks[1].argsTextDelta).toBe('{"expression": "2+');
      expect(collectedChunks[2].argsTextDelta).toBe('2"}');
    });

    it('should handle complete tool-call chunks', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { 
          type: 'tool-call', 
          toolCallId: 'call-1', 
          toolName: 'calculator', 
          args: { expression: '2+2' } 
        },
        { type: 'finish', finishReason: 'tool-calls' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Calculate 2+2' }] }],
      });

      // Collect all chunks
      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(2);
      expect(collectedChunks[0].type).toBe('tool-call');
      expect(collectedChunks[0].toolCallId).toBe('call-1');
      expect(collectedChunks[0].toolName).toBe('calculator');
      expect(collectedChunks[0].args).toEqual({ expression: '2+2' });
    });

    it('should handle response-metadata chunks', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'response-metadata', responseMetadata: { custom: 'value', tokens: 100 } },
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'finish', finishReason: 'stop' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      // Collect all chunks
      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(3);
      expect(collectedChunks[0].type).toBe('response-metadata');
      expect(collectedChunks[0].responseMetadata).toEqual({ custom: 'value', tokens: 100 });
    });

    it('should handle error chunks gracefully', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'error', error: new Error('Something went wrong') },
        { type: 'finish', finishReason: 'error' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      // Collect all chunks
      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(3);
      expect(collectedChunks[1].type).toBe('error');
      expect(collectedChunks[1].error).toBeInstanceOf(Error);
    });

    it('should handle unknown chunk types gracefully', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'unknown-type' as any, data: 'something' },
        { type: 'finish', finishReason: 'stop' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      // Should not throw and should pass through all chunks
      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(3);
    });
  });

  describe('Streaming Conversion Utilities', () => {
    it('should convert v5 stream chunks to v4 format', () => {
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

    it('should convert tool-call-delta chunks', () => {
      const v5Chunk: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        toolName: 'calculator',
        argsTextDelta: '{"expression":',
      };

      const v4Chunk = convertV5StreamChunk(v5Chunk);

      expect(v4Chunk).toEqual({
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        toolName: 'calculator',
        argsTextDelta: '{"expression":',
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

    it('should merge tool call deltas properly', () => {
      const accumulated = new Map<string, AccumulatedToolCall>();
      
      const chunk1: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        toolName: 'calculator',
        argsTextDelta: '{"expression": "2+',
      };

      const chunk2: V5StreamChunk = {
        type: 'tool-call-delta',
        toolCallId: 'call-1',
        argsTextDelta: '2"}',
      };

      mergeToolCallDeltas(accumulated, chunk1);
      mergeToolCallDeltas(accumulated, chunk2);

      const result = accumulated.get('call-1');
      expect(result).toBeDefined();
      expect(result?.toolCallId).toBe('call-1');
      expect(result?.toolName).toBe('calculator');
      expect(result?.args).toBe('{"expression": "2+2"}');
    });

    it('should finalize streaming data correctly', () => {
      const toolCalls = new Map<string, AccumulatedToolCall>();
      toolCalls.set('call-1', {
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression": "2+2"}',
        argsComplete: true,
      });

      const data = {
        fullText: 'Hello world',
        toolCalls,
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        finishReason: 'stop' as const,
        responseMetadata: { custom: 'value' },
      };

      const result = finalizeStreamingData(data);

      expect(result.text).toBe('Hello world');
      expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5 });
      expect(result.finishReason).toBe('stop');
      expect(result.providerMetadata).toEqual({ custom: 'value' });
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls?.[0]).toEqual({
        toolCallType: 'function',
        toolCallId: 'call-1',
        toolName: 'calculator',
        args: '{"expression": "2+2"}',
      });
    });

    it('should validate v5 stream chunks', () => {
      const validChunk = {
        type: 'text-delta',
        textDelta: 'Hello',
      };

      expect(() => validateV5StreamChunk(validChunk)).not.toThrow();

      const invalidChunk = {
        type: 'invalid-type',
        data: 'test',
      };

      expect(() => validateV5StreamChunk(invalidChunk)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed chunks gracefully', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'tool-call-delta', toolCallId: '', toolName: '' }, // Invalid
        { type: 'finish', finishReason: 'stop' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      // Should not throw
      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      expect(collectedChunks).toHaveLength(3);
    });

    it('should continue streaming when chunk processing fails', async () => {
      const chunks: LanguageModelV2StreamPart[] = [
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'tool-call-delta', toolCallId: 'call-1', toolName: 'test' },
        { type: 'text-delta', textDelta: ' World' },
        { type: 'finish', finishReason: 'stop' },
      ];

      const mockModel = new MockLanguageModelV2(chunks);
      const wrappedModel = new AxiomWrappedLanguageModelV2(mockModel);

      const result = await wrappedModel.doStream({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      const reader = result.stream.getReader();
      const collectedChunks: LanguageModelV2StreamPart[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          collectedChunks.push(value);
        }
      }

      // All chunks should be passed through
      expect(collectedChunks).toHaveLength(4);
      expect(collectedChunks[0].textDelta).toBe('Hello');
      expect(collectedChunks[2].textDelta).toBe(' World');
    });
  });
});
