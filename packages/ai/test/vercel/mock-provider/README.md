# Mock Provider for AI SDK Testing

This directory contains the `MockProvider`, a mock provider implementations for testing AI SDK applications without making real API calls.

It lets you configure different response scenarios, has built-in support for sequential responses (conversations), and includes automatic call counting and debugging utilities and response delay simulation for timing tests.

## Quick Start

```typescript
import { createMockProvider, mockResponses } from './mock-provider';
import { generateText } from 'ai';

// Create a mock provider
const mockProvider = createMockProvider();

// Configure a response
mockProvider.addLanguageModelResponse('my-model', mockResponses.text('Hello, world!'));

// Use it in your tests
const model = mockProvider.languageModel('my-model');
const result = await generateText({
  model,
  prompt: 'Say hello',
});

expect(result.text).toBe('Hello, world!');
```

## Core Concepts

### Provider Configuration

```typescript
const mockProvider = createMockProvider({
  providerId: 'my-test-provider', // Custom provider name
  throwOnMissingResponse: true, // Strict mode - throw if no response configured
  defaultDelay: 100, // Default delay for all responses
});
```

### Response Types

The mock provider supports different types of responses:

1. **Text Responses** - Simple text generation
2. **Tool Call Responses** - Responses with function calls
3. **Stream Responses** - Streaming text generation
4. **Embedding Responses** - Vector embeddings
5. **Image Responses** - Generated images
6. **Error Responses** - Simulated errors and warnings

## Usage Examples

### Basic Text Generation

```typescript
// Simple response
mockProvider.addLanguageModelResponse('gpt-4', mockResponses.text('I am a helpful AI assistant.'));

// Response with custom usage data
mockProvider.addLanguageModelResponse(
  'gpt-4',
  mockResponses.text('Complex answer', {
    usage: { promptTokens: 50, completionTokens: 200 },
    finishReason: 'stop',
  }),
);
```

### Sequential Responses (Conversations)

```typescript
// Set up a conversation sequence
mockProvider
  .addLanguageModelResponse('chat-model', mockResponses.text('Hi there!'))
  .addLanguageModelResponse('chat-model', mockResponses.text('How can I help?'))
  .addLanguageModelResponse('chat-model', mockResponses.text('Sure thing!'));

// Each call gets the next response
const model = mockProvider.languageModel('chat-model');
await generateText({ model, prompt: 'Hello' }); // "Hi there!"
await generateText({ model, prompt: 'What can you do?' }); // "How can I help?"
await generateText({ model, prompt: 'Help me code' }); // "Sure thing!"
await generateText({ model, prompt: 'Another question' }); // "Sure thing!" (reuses last)
```

### Tool Calls

```typescript
const toolCall = {
  toolCallType: 'function' as const,
  toolCallId: 'call-123',
  toolName: 'calculator',
  args: '{"expression": "2+2"}',
};

mockProvider.addLanguageModelResponse(
  'tool-model',
  mockResponses.textWithTools('Let me calculate that.', [toolCall]),
);

const result = await generateText({
  model: mockProvider.languageModel('tool-model'),
  prompt: 'What is 2+2?',
  tools: {
    calculator: {
      parameters: z.object({ expression: z.string() }),
      execute: async ({ expression }) => eval(expression).toString(),
    },
  },
});

expect(result.toolCalls).toHaveLength(1);
expect(result.toolResults[0].result).toBe('4');
```

### Streaming

```typescript
mockProvider.addStreamResponse('stream-model', mockResponses.stream(['Hello', ' ', 'world', '!']));

const result = streamText({
  model: mockProvider.languageModel('stream-model'),
  prompt: 'Say hello',
});

const chunks = [];
for await (const chunk of result.textStream) {
  chunks.push(chunk);
}

expect(chunks).toEqual(['Hello', ' ', 'world', '!']);
```

### Embeddings

```typescript
mockProvider.addEmbeddingResponse(
  'embed-model',
  mockResponses.embedding(512, 1), // 512 dimensions, 1 embedding
);

const result = await embed({
  model: mockProvider.textEmbeddingModel('embed-model'),
  value: 'Hello world',
});

expect(result.embedding).toHaveLength(512);
```

### Response Delays

```typescript
// Simulate slow responses
mockProvider.addLanguageModelResponse(
  'slow-model',
  mockResponses.text('This took a while', { delay: 1000 }),
);

// Simulate slow streaming
mockProvider.addStreamResponse(
  'slow-stream',
  mockResponses.stream(['Slow', ' stream'], { delay: 500 }),
);
```

### Error Simulation

```typescript
// Simulate errors and warnings
mockProvider.addLanguageModelResponse(
  'error-model',
  mockResponses.error('Model temporarily unavailable'),
);

const result = await generateText({
  model: mockProvider.languageModel('error-model'),
  prompt: 'This will have warnings',
});

expect(result.warnings).toHaveLength(1);
expect(result.warnings[0].type).toBe('other');
```

### Advanced Features

```typescript
// Reasoning responses (for models that support it)
mockProvider.addLanguageModelResponse('reasoning-model', {
  text: 'The answer is 42.',
  reasoning: [
    { type: 'text', text: 'Let me think about this...' },
    { type: 'text', text: 'After careful consideration...' },
  ],
  finishReason: 'stop',
  usage: { promptTokens: 15, completionTokens: 25 },
});

// Custom response format
mockProvider.addLanguageModelResponse('custom-model', {
  text: 'Custom response',
  finishReason: 'length',
  usage: { promptTokens: 100, completionTokens: 150 },
  warnings: [{ type: 'other', message: 'Custom warning' }],
  delay: 200,
});
```

## Testing Utilities

### Call Counting

```typescript
// Track how many times each model was called
expect(mockProvider.getCallCount('language', 'my-model')).toBe(3);
expect(mockProvider.getCallCount('embedding', 'embed-model')).toBe(1);
expect(mockProvider.getCallCount('image', 'image-model')).toBe(0);
```

### Reset Between Tests

```typescript
beforeEach(() => {
  mockProvider.reset(); // Clear all responses and call counts
});
```

### Strict Mode

```typescript
// Throw errors if no response is configured (helpful for catching test setup issues)
const strictProvider = createMockProvider({
  throwOnMissingResponse: true,
});

// This will throw: "No mock response configured for language model: unconfigured-model"
await generateText({
  model: strictProvider.languageModel('unconfigured-model'),
  prompt: 'This will fail',
});
```

## Integration with Feature Test Suite

The mock provider is designed to work with the `createFeatureTestSuite` function from the AI SDK tests.

```typescript
import { createFeatureTestSuite, createLanguageModelWithCapabilities } from '@ai-sdk/ai/test';

const mockProvider = createMockProvider();
// Configure responses for all test scenarios...

const testSuite = createFeatureTestSuite({
  name: 'Mock Provider Tests',
  models: {
    languageModels: [
      createLanguageModelWithCapabilities(mockProvider.languageModel('test-model'), [
        'textCompletion',
        'toolCalls',
        'objectGeneration',
        'imageInput',
      ]),
    ],
    embeddingModels: [
      createEmbeddingModelWithCapabilities(mockProvider.textEmbeddingModel('embed-model')),
    ],
  },
});
```

## API Reference

### MockProvider

#### Constructor

- `createMockProvider(config?: MockProviderConfig): MockProvider`

#### Methods

- `languageModel(modelId: string): LanguageModelV1`
- `textEmbeddingModel(modelId: string): EmbeddingModelV1<string>`
- `imageModel(modelId: string): ImageModelV1`
- `addLanguageModelResponse(modelId: string, response: MockLanguageModelResponse): this`
- `addStreamResponse(modelId: string, response: MockStreamResponse): this`
- `addEmbeddingResponse(modelId: string, response: MockEmbeddingResponse): this`
- `addImageResponse(modelId: string, response: MockImageResponse): this`
- `getCallCount(modelType: 'language' | 'embedding' | 'image', modelId: string): number`
- `reset(): void`

### mockResponses

Pre-built response builders:

- `mockResponses.text(text: string, options?: Partial<MockLanguageModelResponse>)`
- `mockResponses.textWithTools(text: string, toolCalls: LanguageModelV1FunctionToolCall[], options?)`
- `mockResponses.stream(chunks: string[], options?: Partial<MockStreamResponse>)`
- `mockResponses.embedding(dimension?: number, count?: number)`
- `mockResponses.image(images?: string[] | string)`
- `mockResponses.error(message: string)`
