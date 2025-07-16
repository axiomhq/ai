import type { Tracer } from '@opentelemetry/api';

import type {
  GEN_AI_OPERATION_NAME_VALUE_CHAT,
  GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT,
  GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS,
  GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
  GEN_AI_OPERATION_NAME_VALUE_TEXT_COMPLETION,
} from './semconv/semconv_incubating';

// Axiom AI Resources singleton for configuration management
export class AxiomAIResources {
  private static instance: AxiomAIResources;
  private tracer: Tracer | undefined;

  private constructor() {}

  static getInstance(): AxiomAIResources {
    if (!AxiomAIResources.instance) {
      AxiomAIResources.instance = new AxiomAIResources();
    }
    return AxiomAIResources.instance;
  }

  init(config: { tracer: Tracer }): void {
    this.tracer = config.tracer;
  }

  getTracer(): Tracer | undefined {
    return this.tracer;
  }
}

export function initAxiomAI(config: { tracer: Tracer }) {
  AxiomAIResources.getInstance().init(config);
}

export type GenAIOperation =
  | typeof GEN_AI_OPERATION_NAME_VALUE_CHAT
  | typeof GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT
  | typeof GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS
  | typeof GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL
  | typeof GEN_AI_OPERATION_NAME_VALUE_TEXT_COMPLETION;

export function createGenAISpanName(operation: GenAIOperation, suffix?: string): string {
  return suffix ? `${operation} ${suffix}` : operation;
}

// Re-export completion types and utilities
export type {
  CompletionArray,
  CompletionArrayMessage,
  CompletionAssistantMessage,
  CompletionToolMessage,
  CompletionUserMessage,
  CompletionSystemMessage,
  CompletionToolCall,
  ToolCallMetadata,
  FormatToolCallsOptions,
  FormattedCompletionResult,
} from './completionTypes';

export {
  formatToolCallsInCompletion,
  formatV1ToolCallsInCompletion,
  aggregateStreamingToolCalls,
  createToolCallMetadata,
} from './completionUtils';
