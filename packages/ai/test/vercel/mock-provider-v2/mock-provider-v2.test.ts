import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateText, generateObject, streamText, embed } from 'aiv5';
import { createMockProvider, mockResponses } from './mock-provider-v2';
import { z } from 'zod';

describe('MockProvider V5 Example Usage', () => {
  let mockProvider: ReturnType<typeof createMockProvider>;

  beforeEach(() => {
    mockProvider = createMockProvider({
      providerId: 'test-provider',
      throwOnMissingResponse: false,
    });
  });

  describe('Language Model Tests', () => {
    it('should generate simple text', async () => {
      mockProvider.addLanguageModelResponse('test-model', mockResponses.text('Hello, world!'));

      const model = mockProvider.languageModel('test-model');
      const result = await generateText({
        model,
        prompt: 'Say hello',
      });

      expect(result.text).toBe('Hello, world!');
      expect(result.usage.inputTokens).toBe(10);
      expect(result.usage.outputTokens).toBe(13); // Length of "Hello, world!"
      expect(mockProvider.getCallCount('language', 'test-model')).toBe(1);
    });

    it('should handle multiple responses (conversation simulation)', async () => {
      // Setup multiple responses
      mockProvider
        .addLanguageModelResponse('chat-model', mockResponses.text('Hi there!'))
        .addLanguageModelResponse('chat-model', mockResponses.text('How can I help you?'))
        .addLanguageModelResponse('chat-model', mockResponses.text('Sure, I can do that.'));

      const model = mockProvider.languageModel('chat-model');

      // First call
      let result = await generateText({ model, prompt: 'Hello' });
      expect(result.text).toBe('Hi there!');

      // Second call gets the second response
      result = await generateText({ model, prompt: 'What can you do?' });
      expect(result.text).toBe('How can I help you?');

      // Third call gets the third response
      result = await generateText({ model, prompt: 'Can you help me code?' });
      expect(result.text).toBe('Sure, I can do that.');

      // Fourth call reuses the last response
      result = await generateText({ model, prompt: 'Another question' });
      expect(result.text).toBe('Sure, I can do that.');

      expect(mockProvider.getCallCount('language', 'chat-model')).toBe(4);
    });

    it('should generate text with tool calls', async () => {
      const toolCall = {
        type: 'tool-call' as const,
        toolCallType: 'function' as const,
        toolCallId: 'call-123',
        toolName: 'calculator',
        args: '{"expression": "2+2"}',
        input: '{"expression": "2+2"}',
      };

      mockProvider.addLanguageModelResponse(
        'tool-model',
        mockResponses.textWithTools('I need to calculate that.', [toolCall]),
      );

      const model = mockProvider.languageModel('tool-model');
      const result = await generateText({
        model,
        prompt: 'What is 2+2?',
        tools: {
          calculator: {
            parameters: z.object({
              expression: z.string(),
            }),
            execute: async ({ expression }) => eval(expression).toString(),
          },
        },
      });

      expect(result.text).toBe('I need to calculate that.');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls![0].toolName).toBe('calculator');
      expect(result.toolResults![0].output).toBe('4');
    });

    it('should simulate response delay', async () => {
      mockProvider.addLanguageModelResponse(
        'slow-model',
        mockResponses.text('Delayed response', { delay: 100 }),
      );

      const model = mockProvider.languageModel('slow-model');
      const startTime = Date.now();

      const result = await generateText({
        model,
        prompt: 'This should be slow',
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Account for timing variance
      expect(result.text).toBe('Delayed response');
    });

    it('should simulate errors and warnings', async () => {
      mockProvider.addLanguageModelResponse(
        'error-model',
        mockResponses.error('Model temporarily unavailable'),
      );

      const model = mockProvider.languageModel('error-model');

      await expect(
        generateText({
          model,
          prompt: 'This will throw an error',
        }),
      ).rejects.toThrow('Model temporarily unavailable');
    });
  });

  describe('Streaming Tests', () => {
    it('should stream text chunks', async () => {
      mockProvider.addStreamResponse(
        'stream-model',
        mockResponses.stream(['Hello', ' ', 'streaming', ' world!']),
      );

      const model = mockProvider.languageModel('stream-model');
      const result = streamText({
        model,
        prompt: 'Stream some text',
      });

      const chunks: string[] = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' ', 'streaming', ' world!']);
      expect((await result.usage).outputTokens).toBe(4); // Number of chunks
    });

    it('should stream with delay between chunks', async () => {
      mockProvider.addStreamResponse(
        'slow-stream-model',
        mockResponses.stream(['Slow', ' stream'], { delay: 50 }),
      );

      const model = mockProvider.languageModel('slow-stream-model');
      const result = streamText({
        model,
        prompt: 'Stream slowly',
      });

      const startTime = Date.now();
      const chunks: string[] = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
      }
      const elapsed = Date.now() - startTime;

      expect(chunks).toEqual(['Slow', ' stream']);
      expect(elapsed).toBeGreaterThanOrEqual(90); // 2 chunks * 50ms delay
    });
  });

  describe('Object Generation Tests', () => {
    it('should generate structured objects', async () => {
      const jsonResponse = {
        name: 'John Doe',
        age: 30,
        city: 'New York',
      };

      mockProvider.addLanguageModelResponse(
        'object-model',
        mockResponses.text(JSON.stringify(jsonResponse)),
      );

      const model = mockProvider.languageModel('object-model');
      const result = await generateObject({
        model,
        schema: z.object({
          name: z.string(),
          age: z.number(),
          city: z.string(),
        }),
        prompt: 'Generate a person object',
      });

      expect(result.object).toBeDefined();
    });
  });

  describe('Embedding Model Tests', () => {
    it('should generate embeddings', async () => {
      mockProvider.addEmbeddingResponse(
        'embed-model',
        mockResponses.embedding(512, 2), // 512 dimensions, 2 embeddings
      );

      const model = mockProvider.textEmbeddingModel('embed-model');
      const result = await embed({
        model,
        value: 'Test embedding',
      });

      expect(result.embedding).toHaveLength(512);
      expect(typeof result.embedding[0]).toBe('number');
      /**
       * 🚨 Usage comes from the pre-configured mock response (2 embeddings * 5 = 10),
       * not calculated from the actual request (1 value * 5 = 5).
       * This demonstrates the mock provider's ability to return specific usage scenarios.
       */
      expect(result.usage.tokens).toBe(10);
      expect(mockProvider.getCallCount('embedding', 'embed-model')).toBe(1);
    });
  });

  describe('Provider Management', () => {
    it('should track call counts correctly', async () => {
      mockProvider
        .addLanguageModelResponse('model-a', mockResponses.text('Response A'))
        .addLanguageModelResponse('model-b', mockResponses.text('Response B'));

      const modelA = mockProvider.languageModel('model-a');
      const modelB = mockProvider.languageModel('model-b');

      await generateText({ model: modelA, prompt: 'Test A' });
      await generateText({ model: modelA, prompt: 'Test A again' });
      await generateText({ model: modelB, prompt: 'Test B' });

      expect(mockProvider.getCallCount('language', 'model-a')).toBe(2);
      expect(mockProvider.getCallCount('language', 'model-b')).toBe(1);
      expect(mockProvider.getCallCount('language', 'nonexistent')).toBe(0);
    });

    it('should track streaming and non-streaming calls separately', async () => {
      mockProvider
        .addLanguageModelResponse('test-model', mockResponses.text('Non-stream response'))
        .addStreamResponse('test-model', mockResponses.stream(['Stream', ' response']));

      const model = mockProvider.languageModel('test-model');

      // Make one regular call
      await generateText({ model, prompt: 'Regular call' });

      // Make one streaming call
      const streamResult = streamText({ model, prompt: 'Stream call' });
      const chunks = [];
      for await (const chunk of streamResult.textStream) {
        chunks.push(chunk);
      }

      expect(mockProvider.getCallCount('language', 'test-model')).toBe(1);
      expect(mockProvider.getCallCount('stream', 'test-model')).toBe(1);
    });

    it('should reset properly', async () => {
      mockProvider.addLanguageModelResponse('test', mockResponses.text('Test'));
      await generateText({
        model: mockProvider.languageModel('test'),
        prompt: 'Test',
      });

      expect(mockProvider.getCallCount('language', 'test')).toBe(1);

      mockProvider.reset();
      expect(mockProvider.getCallCount('language', 'test')).toBe(0);
    });

    it('should handle missing responses gracefully', async () => {
      // No responses configured, should use defaults
      const model = mockProvider.languageModel('unconfigured-model');
      const result = await generateText({
        model,
        prompt: 'This model has no responses configured',
      });

      expect(result.text).toBe('Mock response'); // Default response
      expect(result.usage.inputTokens).toBe(10);
      expect(result.usage.outputTokens).toBe(20);
    });

    it('should throw on missing responses when configured strictly', async () => {
      const strictProvider = createMockProvider({
        throwOnMissingResponse: true,
      });

      const model = strictProvider.languageModel('unconfigured-model');

      await expect(
        generateText({
          model,
          prompt: 'This should fail',
        }),
      ).rejects.toThrow('No mock response configured for language model: unconfigured-model');
    });
  });

  describe('Advanced Scenarios', () => {
    it('should simulate reasoning responses', async () => {
      mockProvider.addLanguageModelResponse('reasoning-model', {
        content: [{ type: 'text', text: 'The answer is 42.' }],
        finishReason: 'stop',
        usage: { inputTokens: 15, outputTokens: 25, totalTokens: 40 },
      });

      const model = mockProvider.languageModel('reasoning-model');
      const result = await generateText({
        model,
        prompt: 'What is the meaning of life?',
      });

      expect(result.text).toBe('The answer is 42.');
    });

    it('should work with feature test suite capabilities', () => {
      // Example of how this could integrate with the feature test suite
      const provider = createMockProvider({ providerId: 'mock-test-provider' });

      // Configure responses for different test scenarios
      provider
        .addLanguageModelResponse('mock-model', mockResponses.text('Text generation works'))
        .addStreamResponse('mock-model', mockResponses.stream(['Streaming', ' works']))
        .addEmbeddingResponse('mock-embed', mockResponses.embedding(128))
        .addImageResponse('mock-image', mockResponses.image());

      // This mock provider could be used in place of real providers in the feature test suite
      const languageModel = provider.languageModel('mock-model');
      const embeddingModel = provider.textEmbeddingModel('mock-embed');
      const imageModel = provider.imageModel('image-model');

      expect(languageModel.provider).toBe('mock-test-provider');
      expect(embeddingModel.provider).toBe('mock-test-provider');
      expect(imageModel.provider).toBe('mock-test-provider');
    });

    it('should warn on infinite repeat when configured', async () => {
      const warnProvider = createMockProvider({
        warnOnInfiniteRepeat: true,
      });

      warnProvider.addLanguageModelResponse('limited-model', mockResponses.text('Only response'));

      const model = warnProvider.languageModel('limited-model');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // First call should not warn
      await generateText({ model, prompt: 'First call' });
      expect(consoleSpy).not.toHaveBeenCalled();

      // Second call should warn
      await generateText({ model, prompt: 'Second call' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Mock provider: Model "limited-model" is repeating the last response infinitely',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should support defaultDelay configuration', async () => {
      const delayProvider = createMockProvider({
        defaultDelay: 50,
      });

      delayProvider.addLanguageModelResponse('delay-model', mockResponses.text('Delayed response'));

      const model = delayProvider.languageModel('delay-model');
      const startTime = Date.now();

      await generateText({ model, prompt: 'This should be delayed' });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Account for timing variance
    });
  });
});
