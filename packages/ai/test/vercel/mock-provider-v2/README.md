# Mock Provider for AI SDK V5 Testing

This directory contains the `MockProvider`, a mock provider implementation for testing AI SDK v5 applications without making real API calls.

It lets you configure different response scenarios, has built-in support for sequential responses (conversations), and includes automatic call counting and debugging utilities and response delay simulation for timing tests.

## Quick Start

```typescript
import { createMockProvider, mockResponses } from './mock-provider-v2';
import { generateText } from 'aiv5';

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
  warnOnInfiniteRepeat: true, // Warn when repeating last response infinitely
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
    usage: { inputTokens: 50, outputTokens: 200, totalTokens: 250 },
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
  type: 'tool-call' as const,
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

// This will throw the error
await expect(
  generateText({
    model: mockProvider.languageModel('error-model'),
    prompt: 'This will throw an error',
  }),
).rejects.toThrow('Model temporarily unavailable');
```

### Advanced Features

```typescript
// Custom response format with metadata
mockProvider.addLanguageModelResponse('custom-model', {
  content: [{ type: 'text', text: 'Custom response' }],
  finishReason: 'length',
  usage: { inputTokens: 100, outputTokens: 150, totalTokens: 250 },
  warnings: [{ type: 'other', message: 'Custom warning' }],
  delay: 200,
});

// Custom stream response with metadata
mockProvider.addStreamResponse('custom-stream', {
  chunks: ['Custom', ' stream'],
  finishReason: 'stop',
  streamStart: {
    warnings: [{ type: 'other', message: 'Stream warning' }],
  },
  responseMetadata: {
    id: 'custom-response-id',
    modelId: 'custom-model',
    timestamp: new Date(),
  },
});
```

## Testing Utilities

### Call Counting

```typescript
// Track how many times each model was called
expect(mockProvider.getCallCount('language', 'my-model')).toBe(3);
expect(mockProvider.getCallCount('stream', 'my-model')).toBe(2);
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
await expect(
  generateText({
    model: strictProvider.languageModel('unconfigured-model'),
    prompt: 'This will fail',
  }),
).rejects.toThrow('No mock response configured for language model: unconfigured-model');
```

## Integration with Feature Test Suite

The mock provider is designed to work with the AI SDK v5 feature testing infrastructure.

```typescript
const mockProvider = createMockProvider();
// Configure responses for all test scenarios...

// This mock provider can be used in place of real providers in tests
const languageModel = mockProvider.languageModel('test-model');
const embeddingModel = mockProvider.textEmbeddingModel('embed-model');
const imageModel = mockProvider.imageModel('image-model');
```

## API Reference

### MockProvider

#### Constructor

- `createMockProvider(config?: MockProviderConfig): MockProvider`

#### Methods

- `languageModel(modelId: string): LanguageModelV2`
- `textEmbeddingModel(modelId: string): EmbeddingModelV2<string>`
- `imageModel(modelId: string): ImageModelV2`
- `addLanguageModelResponse(modelId: string, response: MockLanguageModelResponse): this`
- `addStreamResponse(modelId: string, response: MockStreamResponse): this`
- `addEmbeddingResponse(modelId: string, response: MockEmbeddingResponse): this`
- `addImageResponse(modelId: string, response: MockImageResponse): this`
- `getCallCount(modelType: 'language' | 'stream' | 'embedding' | 'image', modelId: string): number`
- `reset(): void`

### mockResponses

Pre-built response builders:

- `mockResponses.text(text: string, options?: Partial<MockLanguageModelResponse>)`
- `mockResponses.textWithTools(text: string, toolCalls: LanguageModelV2ToolCall[], options?)`
- `mockResponses.stream(chunks: string[], options?: Partial<MockStreamResponse>)`
- `mockResponses.embedding(dimension?: number, count?: number)`
- `mockResponses.image(images?: string[] | string)`
- `mockResponses.error(message: string)`

## Differences from V4 Mock Provider

### Response Format Changes

- Language model responses use `content` array instead of `text` property
- Content items have explicit `type` field (`text`, `tool-call`, etc.)
- Usage tracking uses `inputTokens`, `outputTokens`, and `totalTokens` instead of `promptTokens` and `completionTokens`

### Stream Changes

- Stream parts include `stream-start` and `response-metadata` events
- Text content uses `{ type: 'text', text: string }` format

### Type Updates

- Uses `LanguageModelV2`, `EmbeddingModelV2`, `ImageModelV2` interfaces
- Updated to `ProviderV2` specification

The API surface remains the same, making migration straightforward - just update your response expectations to match the v5 format.
