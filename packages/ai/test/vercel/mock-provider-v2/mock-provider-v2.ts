import type {
  EmbeddingModelV2,
  ImageModelV2,
  ImageModelV2CallOptions,
  ImageModelV2CallWarning,
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2ResponseMetadata,
  LanguageModelV2StreamPart,
  LanguageModelV2ToolCall,
  LanguageModelV2Usage,
  ProviderV2,
} from '@ai-sdk/providerv2';
import { MockEmbeddingModelV2, MockLanguageModelV2 } from 'aiv5/test';

// Response types for different model behaviors
export interface MockLanguageModelResponse {
  content?: Array<LanguageModelV2Content>;
  finishReason?: LanguageModelV2FinishReason;
  usage?: LanguageModelV2Usage;
  warnings?: LanguageModelV2CallWarning[];
  delay?: number; // Simulate response delay
}

export interface MockStreamResponse {
  chunks: string[];
  delay?: number; // Delay between chunks
  finishReason?: LanguageModelV2FinishReason;
  usage?: LanguageModelV2Usage;
  streamStart?: {
    warnings?: LanguageModelV2CallWarning[];
  };
  responseMetadata?: LanguageModelV2ResponseMetadata;
}

export interface MockEmbeddingResponse {
  embeddings: number[][];
  usage?: {
    tokens: number;
  };
}

export interface MockImageResponse {
  images: string[] | Uint8Array[];
  warnings?: ImageModelV2CallWarning[];
}

// Mock provider configuration
export interface MockProviderConfig {
  providerId?: string;
  defaultDelay?: number;
  throwOnMissingResponse?: boolean;
  warnOnInfiniteRepeat?: boolean;
}

// Simple mock image model implementation
class MockImageModelV2 implements ImageModelV2 {
  readonly specificationVersion = 'v2' as const;
  readonly provider: string;
  readonly modelId: string;
  readonly maxImagesPerCall: number | undefined;

  constructor(
    private config: {
      provider: string;
      modelId: string;
      maxImagesPerCall?: number;
      doGenerate: ImageModelV2['doGenerate'];
    },
  ) {
    this.provider = config.provider;
    this.modelId = config.modelId;
    this.maxImagesPerCall = config.maxImagesPerCall;
  }

  doGenerate: ImageModelV2['doGenerate'] = (...args) => this.config.doGenerate(...args);
}

export class MockProvider implements ProviderV2 {
  private languageModelResponses = new Map<string, MockLanguageModelResponse[]>();
  private streamResponses = new Map<string, MockStreamResponse[]>();
  private embeddingResponses = new Map<string, MockEmbeddingResponse[]>();
  private imageResponses = new Map<string, MockImageResponse[]>();

  private languageModelCallCounts = new Map<string, number>();
  private streamCallCounts = new Map<string, number>();
  private embeddingCallCounts = new Map<string, number>();
  private imageCallCounts = new Map<string, number>();

  private config: MockProviderConfig;

  constructor(config: MockProviderConfig = {}) {
    this.config = {
      providerId: 'mock-provider',
      defaultDelay: 0,
      throwOnMissingResponse: false,
      warnOnInfiniteRepeat: true,
      ...config,
    };
  }

  // Language Model Methods
  languageModel(modelId: string): LanguageModelV2 {
    return new MockLanguageModelV2({
      provider: this.config.providerId!,
      modelId,
      doGenerate: async (_options: LanguageModelV2CallOptions) => {
        const callCount = this.languageModelCallCounts.get(modelId) || 0;
        this.languageModelCallCounts.set(modelId, callCount + 1);

        const responses = this.languageModelResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(`No mock response configured for language model: ${modelId}`);
          }
          return this.getDefaultLanguageModelResponse();
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        // Warn about infinite repeat if configured
        if (this.config.warnOnInfiniteRepeat && callCount >= responses.length) {
          console.warn(
            `Mock provider: Model "${modelId}" is repeating the last response infinitely. Call count: ${callCount + 1}, Available responses: ${responses.length}`,
          );
        }

        const effectiveDelay = response.delay ?? this.config.defaultDelay ?? 0;
        if (effectiveDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, effectiveDelay));
        }

        if (
          response.finishReason === 'error' &&
          response.warnings &&
          response.warnings.length > 0
        ) {
          const warning = response.warnings[0];
          const err = warning.type === 'other' ? warning.message : 'Unknown warning';
          throw new Error(err);
        }

        return {
          content: response.content || [{ type: 'text', text: 'Mock response' }],
          finishReason: response.finishReason || 'stop',
          usage: response.usage || {
            inputTokens: 10,
            outputTokens: 20,
            totalTokens: 30,
          },
          warnings: response.warnings || [],
          response: {
            id: 'mock-response-id',
            modelId,
            timestamp: new Date(),
          } satisfies LanguageModelV2ResponseMetadata,
        };
      },
      doStream: async (_options: LanguageModelV2CallOptions) => {
        const callCount = this.streamCallCounts.get(modelId) || 0;
        this.streamCallCounts.set(modelId, callCount + 1);

        const responses = this.streamResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(`No mock stream response configured for language model: ${modelId}`);
          }
          return this.getDefaultStreamResponse();
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        // Warn about infinite repeat if configured
        if (this.config.warnOnInfiniteRepeat && callCount >= responses.length) {
          console.warn(
            `Mock provider: Stream model "${modelId}" is repeating the last response infinitely. Call count: ${callCount + 1}, Available responses: ${responses.length}`,
          );
        }

        return {
          stream: this.createMockStream(response),
        };
      },
    });
  }

  // Embedding Model Methods
  textEmbeddingModel(modelId: string): EmbeddingModelV2<string> {
    return new MockEmbeddingModelV2({
      provider: this.config.providerId!,
      modelId,
      doEmbed: async ({ values }: { values: string[] }) => {
        const callCount = this.embeddingCallCounts.get(modelId) || 0;
        this.embeddingCallCounts.set(modelId, callCount + 1);

        const responses = this.embeddingResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(`No mock response configured for embedding model: ${modelId}`);
          }
          return this.getDefaultEmbeddingResponse(values.length);
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        return {
          embeddings: response.embeddings.slice(0, values.length),
          usage: response.usage || { tokens: values.length * 5 },
        };
      },
    });
  }

  // Image Model Methods
  imageModel(modelId: string): ImageModelV2 {
    return new MockImageModelV2({
      provider: this.config.providerId!,
      modelId,
      doGenerate: async (_options: ImageModelV2CallOptions) => {
        const callCount = this.imageCallCounts.get(modelId) || 0;
        this.imageCallCounts.set(modelId, callCount + 1);

        const responses = this.imageResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(`No mock response configured for image model: ${modelId}`);
          }
          return this.getDefaultImageResponse();
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        return {
          images: response.images,
          warnings: response.warnings || [],
          response: {
            timestamp: new Date(),
            modelId,
            headers: {} as Record<string, string> | undefined,
          },
        };
      },
    });
  }

  // Configuration Methods
  addLanguageModelResponse(modelId: string, response: MockLanguageModelResponse): this {
    if (!this.languageModelResponses.has(modelId)) {
      this.languageModelResponses.set(modelId, []);
    }
    this.languageModelResponses.get(modelId)!.push(response);
    return this;
  }

  addStreamResponse(modelId: string, response: MockStreamResponse): this {
    if (!this.streamResponses.has(modelId)) {
      this.streamResponses.set(modelId, []);
    }
    this.streamResponses.get(modelId)!.push(response);
    return this;
  }

  addEmbeddingResponse(modelId: string, response: MockEmbeddingResponse): this {
    if (!this.embeddingResponses.has(modelId)) {
      this.embeddingResponses.set(modelId, []);
    }
    this.embeddingResponses.get(modelId)!.push(response);
    return this;
  }

  addImageResponse(modelId: string, response: MockImageResponse): this {
    if (!this.imageResponses.has(modelId)) {
      this.imageResponses.set(modelId, []);
    }
    this.imageResponses.get(modelId)!.push(response);
    return this;
  }

  // Utility Methods
  getCallCount(modelType: 'language' | 'stream' | 'embedding' | 'image', modelId: string): number {
    switch (modelType) {
      case 'language':
        return this.languageModelCallCounts.get(modelId) || 0;
      case 'stream':
        return this.streamCallCounts.get(modelId) || 0;
      case 'embedding':
        return this.embeddingCallCounts.get(modelId) || 0;
      case 'image':
        return this.imageCallCounts.get(modelId) || 0;
    }
  }

  reset(): void {
    this.languageModelResponses.clear();
    this.streamResponses.clear();
    this.embeddingResponses.clear();
    this.imageResponses.clear();
    this.languageModelCallCounts.clear();
    this.streamCallCounts.clear();
    this.embeddingCallCounts.clear();
    this.imageCallCounts.clear();
  }

  // Private helper methods
  private getDefaultLanguageModelResponse() {
    return {
      content: [{ type: 'text' as const, text: 'Mock response' }],
      finishReason: 'stop' as LanguageModelV2FinishReason,
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
      warnings: [],
      response: {
        id: 'mock-response-id',
        modelId: 'mock-model',
        timestamp: new Date(),
      },
    };
  }

  private getDefaultStreamResponse() {
    return {
      stream: this.createMockStream({
        chunks: ['Mock', ' stream', ' response'],
      }),
    };
  }

  private getDefaultEmbeddingResponse(count: number) {
    return {
      embeddings: Array(count).fill([0.1, 0.2, 0.3, 0.4, 0.5]),
      usage: { tokens: count * 5 },
    };
  }

  private getDefaultImageResponse() {
    // A simple 1x1 transparent PNG as base64
    const transparentPng =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    return {
      images: [transparentPng],
      warnings: [],
      response: {
        timestamp: new Date(),
        modelId: 'mock-model',
        headers: {} as Record<string, string> | undefined,
      },
    };
  }

  private createMockStream(
    response: MockStreamResponse,
  ): ReadableStream<LanguageModelV2StreamPart> {
    const config = this.config;
    return new ReadableStream({
      async start(controller) {
        try {
          // Stream start (customizable)
          controller.enqueue({
            type: 'stream-start',
            warnings: response.streamStart?.warnings || [],
          });

          // Response metadata (customizable)
          const metadata = response.responseMetadata || {
            id: 'mock-response-id',
            modelId: 'mock-model',
            timestamp: new Date(),
          };
          controller.enqueue({
            type: 'response-metadata',
            ...metadata,
          });

          // Check if this is an error response
          if (response.finishReason === 'error') {
            controller.enqueue({
              type: 'error',
              error: new Error('Test error'),
            });
            controller.close();
            return;
          }

          // Text chunks with defaultDelay support
          for (const chunk of response.chunks) {
            const effectiveDelay = response.delay ?? config.defaultDelay ?? 0;
            if (effectiveDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, effectiveDelay));
            }
            controller.enqueue({
              type: 'text',
              text: chunk,
            });
          }

          // Finish
          controller.enqueue({
            type: 'finish',
            finishReason: response.finishReason || 'stop',
            usage: response.usage || {
              inputTokens: 10,
              outputTokens: response.chunks.length,
              totalTokens: 10 + response.chunks.length,
            },
          });

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}

// Convenience factory functions
export function createMockProvider(config?: MockProviderConfig): MockProvider {
  return new MockProvider(config);
}

// Predefined response builders
export const mockResponses = {
  text: (
    text: string,
    options?: Partial<MockLanguageModelResponse>,
  ): MockLanguageModelResponse => ({
    content: [{ type: 'text', text }],
    finishReason: 'stop',
    usage: {
      inputTokens: 10,
      outputTokens: text.length,
      totalTokens: 10 + text.length,
    },
    ...options,
  }),

  textWithTools: (
    text: string,
    toolCalls: LanguageModelV2ToolCall[],
    options?: Partial<MockLanguageModelResponse>,
  ): MockLanguageModelResponse => ({
    content: [{ type: 'text', text }, ...toolCalls],
    finishReason: 'tool-calls',
    usage: {
      inputTokens: 10,
      outputTokens: text.length,
      totalTokens: 10 + text.length,
    },
    ...options,
  }),

  stream: (chunks: string[], options?: Partial<MockStreamResponse>): MockStreamResponse => ({
    chunks,
    finishReason: 'stop',
    usage: {
      inputTokens: 10,
      outputTokens: chunks.length,
      totalTokens: 10 + chunks.length,
    },
    ...options,
  }),

  embedding: (dimension: number = 512, count: number = 1): MockEmbeddingResponse => ({
    embeddings: Array(count)
      .fill(null)
      .map(() =>
        Array(dimension)
          .fill(0)
          .map(() => Math.random() - 0.5),
      ),
    usage: { tokens: count * 5 },
  }),

  image: (images?: string[] | string): MockImageResponse => ({
    images: Array.isArray(images)
      ? images
      : [
          images ||
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        ],
  }),

  error: (message: string): MockLanguageModelResponse => ({
    content: [],
    finishReason: 'error',
    warnings: [{ type: 'other', message }],
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  }),

  streamError: (_message: string): MockStreamResponse => ({
    chunks: [],
    finishReason: 'error',
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  }),
};
