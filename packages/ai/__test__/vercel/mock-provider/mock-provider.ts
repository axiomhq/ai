import type {
  EmbeddingModelV1,
  ImageModelV1,
  ImageModelV1CallOptions,
  ImageModelV1CallWarning,
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1CallWarning,
  LanguageModelV1FinishReason,
  LanguageModelV1FunctionToolCall,
  LanguageModelV1StreamPart,
  ProviderV1,
} from "@ai-sdk/provider";
import { MockEmbeddingModelV1 } from "ai/test";
import { MockImageModelV1 } from "./TEMP_mock-image-model-v1";
import { MockLanguageModelV1 } from "ai/test";

// Response types for different model behaviors
export interface MockLanguageModelResponse {
  text?: string;
  toolCalls?: LanguageModelV1FunctionToolCall[];
  finishReason?: LanguageModelV1FinishReason;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  warnings?: LanguageModelV1CallWarning[];
  reasoning?:
    | string
    | Array<
        | {
            type: "text";
            text: string;
            signature?: string;
          }
        | {
            type: "redacted";
            data: string;
          }
      >;
  delay?: number; // Simulate response delay
}

export interface MockStreamResponse {
  chunks: string[];
  delay?: number; // Delay between chunks
  finishReason?: LanguageModelV1FinishReason;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface MockEmbeddingResponse {
  embeddings: number[][];
  usage?: {
    tokens: number;
  };
}

export interface MockImageResponse {
  images: string[] | Uint8Array[];
  warnings?: ImageModelV1CallWarning[];
}

// Mock provider configuration
export interface MockProviderConfig {
  providerId?: string;
  defaultDelay?: number;
  throwOnMissingResponse?: boolean;
}

export class MockProvider implements ProviderV1 {
  private languageModelResponses = new Map<
    string,
    MockLanguageModelResponse[]
  >();
  private streamResponses = new Map<string, MockStreamResponse[]>();
  private embeddingResponses = new Map<string, MockEmbeddingResponse[]>();
  private imageResponses = new Map<string, MockImageResponse[]>();

  private languageModelCallCounts = new Map<string, number>();
  private embeddingCallCounts = new Map<string, number>();
  private imageCallCounts = new Map<string, number>();

  private config: MockProviderConfig;

  constructor(config: MockProviderConfig = {}) {
    this.config = {
      providerId: "mock-provider",
      defaultDelay: 0,
      throwOnMissingResponse: false,
      ...config,
    };
  }

  // Language Model Methods
  languageModel(modelId: string): LanguageModelV1 {
    return new MockLanguageModelV1({
      provider: this.config.providerId!,
      modelId,
      defaultObjectGenerationMode: "json",
      doGenerate: async (options: LanguageModelV1CallOptions) => {
        const callCount = this.languageModelCallCounts.get(modelId) || 0;
        this.languageModelCallCounts.set(modelId, callCount + 1);

        const responses = this.languageModelResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(
              `No mock response configured for language model: ${modelId}`
            );
          }
          return this.getDefaultLanguageModelResponse();
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        if (response.delay) {
          await new Promise((resolve) => setTimeout(resolve, response.delay));
        }

        return {
          text: response.text || "",
          toolCalls: response.toolCalls,
          finishReason: response.finishReason || "stop",
          usage: response.usage || { promptTokens: 10, completionTokens: 20 },
          warnings: response.warnings || [],
          reasoning: response.reasoning,
          rawCall: { rawPrompt: options.prompt, rawSettings: {} },
          rawResponse: { headers: {} },
          providerMetadata: {},
          request: { body: "" },
          response: { id: "mock-response-id", modelId },
        };
      },
      doStream: async (options: LanguageModelV1CallOptions) => {
        const callCount = this.languageModelCallCounts.get(modelId) || 0;
        this.languageModelCallCounts.set(modelId, callCount + 1);

        const responses = this.streamResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(
              `No mock stream response configured for language model: ${modelId}`
            );
          }
          return this.getDefaultStreamResponse();
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        return {
          stream: this.createMockStream(response),
          rawCall: { rawPrompt: options.prompt, rawSettings: {} },
          rawResponse: { headers: {} },
          warnings: [],
          request: { body: "" },
        };
      },
    });
  }

  // Embedding Model Methods
  textEmbeddingModel(modelId: string): EmbeddingModelV1<string> {
    return new MockEmbeddingModelV1({
      provider: this.config.providerId!,
      modelId,
      doEmbed: async ({ values }: { values: string[] }) => {
        const callCount = this.embeddingCallCounts.get(modelId) || 0;
        this.embeddingCallCounts.set(modelId, callCount + 1);

        const responses = this.embeddingResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(
              `No mock response configured for embedding model: ${modelId}`
            );
          }
          return this.getDefaultEmbeddingResponse(values.length);
        }

        const response = responses[Math.min(callCount, responses.length - 1)];

        return {
          embeddings: response.embeddings.slice(0, values.length),
          usage: response.usage || { tokens: values.length * 5 },
          rawResponse: { headers: {} },
        };
      },
    });
  }

  // Image Model Methods
  imageModel(modelId: string): ImageModelV1 {
    return new MockImageModelV1({
      provider: this.config.providerId!,
      modelId,
      doGenerate: async (options: ImageModelV1CallOptions) => {
        const callCount = this.imageCallCounts.get(modelId) || 0;
        this.imageCallCounts.set(modelId, callCount + 1);

        const responses = this.imageResponses.get(modelId);
        if (!responses || responses.length === 0) {
          if (this.config.throwOnMissingResponse) {
            throw new Error(
              `No mock response configured for image model: ${modelId}`
            );
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
  addLanguageModelResponse(
    modelId: string,
    response: MockLanguageModelResponse
  ): this {
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
  getCallCount(
    modelType: "language" | "embedding" | "image",
    modelId: string
  ): number {
    switch (modelType) {
      case "language":
        return this.languageModelCallCounts.get(modelId) || 0;
      case "embedding":
        return this.embeddingCallCounts.get(modelId) || 0;
      case "image":
        return this.imageCallCounts.get(modelId) || 0;
    }
  }

  reset(): void {
    this.languageModelResponses.clear();
    this.streamResponses.clear();
    this.embeddingResponses.clear();
    this.imageResponses.clear();
    this.languageModelCallCounts.clear();
    this.embeddingCallCounts.clear();
    this.imageCallCounts.clear();
  }

  // Private helper methods
  private getDefaultLanguageModelResponse() {
    return {
      text: "Mock response",
      finishReason: "stop" as LanguageModelV1FinishReason,
      usage: { promptTokens: 10, completionTokens: 20 },
      warnings: [],
      rawCall: { rawPrompt: [], rawSettings: {} },
      rawResponse: { headers: {} },
      providerMetadata: {},
      request: { body: "" },
      response: { id: "mock-response-id", modelId: "mock-model" },
    };
  }

  private getDefaultStreamResponse() {
    return {
      stream: this.createMockStream({
        chunks: ["Mock", " stream", " response"],
      }),
      rawCall: { rawPrompt: [], rawSettings: {} },
      rawResponse: { headers: {} },
      warnings: [],
      request: { body: "" },
    };
  }

  private getDefaultEmbeddingResponse(count: number) {
    return {
      embeddings: Array(count).fill([0.1, 0.2, 0.3, 0.4, 0.5]),
      usage: { tokens: count * 5 },
      rawResponse: { headers: {} },
    };
  }

  private getDefaultImageResponse() {
    // A simple 1x1 transparent PNG as base64
    const transparentPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    return {
      images: [transparentPng],
      warnings: [],
      response: {
        timestamp: new Date(),
        modelId: "mock-model",
        headers: {} as Record<string, string> | undefined,
      },
    };
  }

  private createMockStream(
    response: MockStreamResponse
  ): ReadableStream<LanguageModelV1StreamPart> {
    return new ReadableStream({
      async start(controller) {
        // Response metadata
        controller.enqueue({
          type: "response-metadata",
          id: "mock-response-id",
          modelId: "mock-model",
        });

        // Text chunks
        for (const chunk of response.chunks) {
          if (response.delay) {
            await new Promise((resolve) => setTimeout(resolve, response.delay));
          }
          controller.enqueue({
            type: "text-delta",
            textDelta: chunk,
          });
        }

        // Finish
        controller.enqueue({
          type: "finish",
          finishReason: response.finishReason || "stop",
          usage: response.usage || {
            promptTokens: 10,
            completionTokens: response.chunks.length,
          },
          providerMetadata: {},
        });

        controller.close();
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
    options?: Partial<MockLanguageModelResponse>
  ): MockLanguageModelResponse => ({
    text,
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: text.length },
    ...options,
  }),

  textWithTools: (
    text: string,
    toolCalls: LanguageModelV1FunctionToolCall[],
    options?: Partial<MockLanguageModelResponse>
  ): MockLanguageModelResponse => ({
    text,
    toolCalls,
    finishReason: "tool-calls",
    usage: { promptTokens: 10, completionTokens: text.length },
    ...options,
  }),

  stream: (
    chunks: string[],
    options?: Partial<MockStreamResponse>
  ): MockStreamResponse => ({
    chunks,
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: chunks.length },
    ...options,
  }),

  embedding: (
    dimension: number = 512,
    count: number = 1
  ): MockEmbeddingResponse => ({
    embeddings: Array(count)
      .fill(null)
      .map(() =>
        Array(dimension)
          .fill(0)
          .map(() => Math.random() - 0.5)
      ),
    usage: { tokens: count * 5 },
  }),

  image: (images?: string[] | string): MockImageResponse => ({
    images: Array.isArray(images)
      ? images
      : [
          images ||
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        ],
  }),

  error: (message: string): MockLanguageModelResponse => ({
    text: "",
    finishReason: "error",
    warnings: [{ type: "other", message }],
    usage: { promptTokens: 0, completionTokens: 0 },
  }),
};
