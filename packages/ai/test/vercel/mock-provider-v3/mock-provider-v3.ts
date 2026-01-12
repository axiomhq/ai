import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3ResponseMetadata,
  LanguageModelV3StreamPart,
  LanguageModelV3ToolCall,
  LanguageModelV3Usage,
} from '@ai-sdk/providerv3';
import { MockLanguageModelV3 } from 'aiv6/test';

// V3 structured token usage
export interface MockLanguageModelV3Usage {
  inputTokens?: {
    total?: number;
    cacheRead?: number;
    cacheWrite?: number;
    noCache?: number;
  };
  outputTokens?: {
    total?: number;
    text?: number;
    reasoning?: number;
  };
}

// Response types for different model behaviors
export interface MockLanguageModelResponse {
  content?: Array<LanguageModelV3Content>;
  finishReason?: LanguageModelV3FinishReason;
  usage?: MockLanguageModelV3Usage;
  delay?: number;
}

export interface MockStreamResponse {
  chunks: string[];
  delay?: number;
  finishReason?: LanguageModelV3FinishReason;
  usage?: MockLanguageModelV3Usage;
  responseMetadata?: LanguageModelV3ResponseMetadata;
}

// Mock provider configuration
export interface MockProviderConfig {
  providerId?: string;
  defaultDelay?: number;
  throwOnMissingResponse?: boolean;
  warnOnInfiniteRepeat?: boolean;
}

// Default finish reason for V3
const defaultFinishReason: LanguageModelV3FinishReason = { unified: 'stop', raw: undefined };

export class MockProvider {
  private languageModelResponses = new Map<string, MockLanguageModelResponse[]>();
  private streamResponses = new Map<string, MockStreamResponse[]>();

  private languageModelCallCounts = new Map<string, number>();
  private streamCallCounts = new Map<string, number>();

  private config: MockProviderConfig;
  private providerOptions: Record<string, Record<string, any>> = {};

  constructor(config: MockProviderConfig = {}) {
    this.config = {
      providerId: 'mock.completion',
      defaultDelay: 0,
      throwOnMissingResponse: false,
      warnOnInfiniteRepeat: false,
      ...config,
    };
  }

  private setProviderOptions(options: LanguageModelV3CallOptions) {
    this.providerOptions = options.providerOptions || {};
  }

  // Language Model Methods
  languageModel(modelId: string): LanguageModelV3 {
    return new MockLanguageModelV3({
      provider: this.config.providerId!,
      modelId,
      doGenerate: async (options: LanguageModelV3CallOptions) => {
        this.setProviderOptions(options);
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

        if (this.config.warnOnInfiniteRepeat && callCount >= responses.length) {
          console.warn(
            `Mock provider: Model "${modelId}" is repeating the last response infinitely. Call count: ${callCount + 1}, Available responses: ${responses.length}`,
          );
        }

        const effectiveDelay = response.delay ?? this.config.defaultDelay ?? 0;
        if (effectiveDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, effectiveDelay));
        }

        return {
          content: response.content || [{ type: 'text', text: 'Mock response' }],
          finishReason: response.finishReason || defaultFinishReason,
          usage: this.toV3Usage(response.usage),
          warnings: [],
          response: {
            id: 'mock-response-id',
            modelId,
            timestamp: new Date(),
          } satisfies LanguageModelV3ResponseMetadata,
        };
      },
      doStream: async (_options: LanguageModelV3CallOptions) => {
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

  // Utility Methods
  getCallCount(modelType: 'language' | 'stream', modelId: string): number {
    switch (modelType) {
      case 'language':
        return this.languageModelCallCounts.get(modelId) || 0;
      case 'stream':
        return this.streamCallCounts.get(modelId) || 0;
    }
  }

  getProviderMetadata(): Record<string, Record<string, any>> {
    return this.providerOptions;
  }

  reset(): void {
    this.languageModelResponses.clear();
    this.streamResponses.clear();
    this.languageModelCallCounts.clear();
    this.streamCallCounts.clear();
    this.providerOptions = {};
  }

  // Private helper methods
  private toV3Usage(usage?: MockLanguageModelV3Usage): LanguageModelV3Usage {
    return {
      inputTokens: {
        total: usage?.inputTokens?.total ?? 10,
        cacheRead: usage?.inputTokens?.cacheRead,
        cacheWrite: usage?.inputTokens?.cacheWrite,
        noCache: usage?.inputTokens?.noCache,
      },
      outputTokens: {
        total: usage?.outputTokens?.total ?? 20,
        text: usage?.outputTokens?.text,
        reasoning: usage?.outputTokens?.reasoning,
      },
    };
  }

  private getDefaultLanguageModelResponse() {
    return {
      content: [{ type: 'text' as const, text: 'Mock response' }],
      finishReason: defaultFinishReason,
      usage: this.toV3Usage(),
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

  private createMockStream(response: MockStreamResponse): ReadableStream<LanguageModelV3StreamPart> {
    const config = this.config;
    const toV3Usage = this.toV3Usage.bind(this);

    return new ReadableStream({
      async start(controller) {
        try {
          // Stream start
          controller.enqueue({
            type: 'stream-start',
            warnings: [],
          });

          // Response metadata
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
          if (response.finishReason?.unified === 'error') {
            controller.enqueue({
              type: 'error',
              error: new Error('Test error'),
            });
            controller.close();
            return;
          }

          if (response.chunks.length > 0) {
            controller.enqueue({
              type: 'text-start',
              id: 'text-id',
            });

            for (const chunk of response.chunks) {
              const effectiveDelay = response.delay ?? config.defaultDelay ?? 0;
              if (effectiveDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, effectiveDelay));
              }
              controller.enqueue({
                type: 'text-delta',
                id: 'text-id',
                delta: chunk,
              });
            }

            controller.enqueue({
              type: 'text-end',
              id: 'text-id',
            });
          }

          controller.enqueue({
            type: 'finish',
            finishReason: response.finishReason || defaultFinishReason,
            usage: toV3Usage(response.usage),
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

// Predefined response builders with V3 structures
export const mockResponses = {
  text: (text: string, options?: Partial<MockLanguageModelResponse>): MockLanguageModelResponse => ({
    content: [{ type: 'text', text }],
    finishReason: { unified: 'stop', raw: undefined },
    usage: {
      inputTokens: { total: 10 },
      outputTokens: { total: text.length },
    },
    ...options,
  }),

  textWithTools: (
    text: string,
    toolCalls: LanguageModelV3ToolCall[],
    options?: Partial<MockLanguageModelResponse>,
  ): MockLanguageModelResponse => ({
    content: [{ type: 'text', text }, ...toolCalls],
    finishReason: { unified: 'tool-calls', raw: undefined },
    usage: {
      inputTokens: { total: 10 },
      outputTokens: { total: text.length },
    },
    ...options,
  }),

  stream: (chunks: string[], options?: Partial<MockStreamResponse>): MockStreamResponse => ({
    chunks,
    finishReason: { unified: 'stop', raw: undefined },
    usage: {
      inputTokens: { total: 10 },
      outputTokens: { total: chunks.length },
    },
    ...options,
  }),

  error: (message: string): MockLanguageModelResponse => ({
    content: [],
    finishReason: { unified: 'error', raw: message },
    usage: {
      inputTokens: { total: 0 },
      outputTokens: { total: 0 },
    },
  }),

  streamError: (_message: string): MockStreamResponse => ({
    chunks: [],
    finishReason: { unified: 'error', raw: undefined },
    usage: {
      inputTokens: { total: 0 },
      outputTokens: { total: 0 },
    },
  }),
};
