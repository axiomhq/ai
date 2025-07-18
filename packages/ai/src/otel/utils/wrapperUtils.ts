import { trace, propagation, type Span } from '@opentelemetry/api';
import { Attr, SCHEMA_BASE_URL, SCHEMA_VERSION } from '../semconv/attributes';
import { createStartActiveSpan } from '../startActiveSpan';
import { WITHSPAN_BAGGAGE_KEY } from '../withSpanBaggageKey';
// Removed import of createGenAISpanName since it's no longer exported
import packageJson from '../../../package.json';

/**
 * Creates a standardized span name for GenAI operations
 */
function createGenAISpanName(operation: string, suffix?: string): string {
  return suffix ? `${operation} ${suffix}` : operation;
}

/**
 * Common span context interface for both V1 and V2
 */
export interface CommonSpanContext {
  originalPrompt: any[];
  rawCall?: any;
}

/**
 * Sets common scope attributes on a span from baggage
 */
export function setScopeAttributes(span: Span): void {
  const bag = propagation.getActiveBaggage();

  if (bag) {
    const capability = bag.getEntry('capability')?.value;
    if (capability) {
      span.setAttribute(Attr.GenAI.Capability.Name, capability);
    }

    const step = bag.getEntry('step')?.value;
    if (step) {
      span.setAttribute(Attr.GenAI.Step.Name, step);
    }
  }
}

/**
 * Sets common base attributes on a span
 */
export function setBaseAttributes(span: Span, provider: string, modelId: string): void {
  span.setAttributes({
    [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
    [Attr.GenAI.Request.Model]: modelId,
    [Attr.GenAI.Provider]: provider,
    [Attr.Axiom.GenAI.SchemaURL]: `${SCHEMA_BASE_URL}${SCHEMA_VERSION}`,
    [Attr.Axiom.GenAI.SDK.Name]: packageJson.name,
    [Attr.Axiom.GenAI.SDK.Version]: packageJson.version,
  });
}

/**
 * Sets common request parameter attributes on a span
 */
export function setRequestParameterAttributes(
  span: Span,
  params: {
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    seed?: number;
    stopSequences?: string[];
  },
): void {
  const {
    maxTokens,
    frequencyPenalty,
    presencePenalty,
    temperature,
    topP,
    topK,
    seed,
    stopSequences,
  } = params;

  if (maxTokens !== undefined) {
    span.setAttribute(Attr.GenAI.Request.MaxTokens, maxTokens);
  }
  if (frequencyPenalty !== undefined) {
    span.setAttribute(Attr.GenAI.Request.FrequencyPenalty, frequencyPenalty);
  }
  if (presencePenalty !== undefined) {
    span.setAttribute(Attr.GenAI.Request.PresencePenalty, presencePenalty);
  }
  if (temperature !== undefined) {
    span.setAttribute(Attr.GenAI.Request.Temperature, temperature);
  }
  if (topP !== undefined) {
    span.setAttribute(Attr.GenAI.Request.TopP, topP);
  }
  if (topK !== undefined) {
    span.setAttribute(Attr.GenAI.Request.TopK, topK);
  }
  if (seed !== undefined) {
    span.setAttribute(Attr.GenAI.Request.Seed, seed);
  }
  if (stopSequences && stopSequences.length > 0) {
    span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(stopSequences));
  }
}

/**
 * Common span handling logic for both V1 and V2
 */
export async function withSpanHandling<T>(
  modelId: string,
  operation: (span: Span, context: CommonSpanContext) => Promise<T>,
): Promise<T> {
  const bag = propagation.getActiveBaggage();
  const isWithinWithSpan = bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === 'true';

  const context: CommonSpanContext = {
    originalPrompt: [],
    rawCall: undefined,
  };

  if (isWithinWithSpan) {
    // Reuse existing span created by withSpan
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      throw new Error('Expected active span when within withSpan');
    }
    activeSpan.updateName(createGenAISpanName(Attr.GenAI.Operation.Name_Values.Chat, modelId));
    return operation(activeSpan, context);
  } else {
    // Create new span only if not within withSpan
    const tracer = trace.getTracer('@axiomhq/ai');
    const startActiveSpan = createStartActiveSpan(tracer);
    const name = createGenAISpanName(Attr.GenAI.Operation.Name_Values.Chat, modelId);

    return startActiveSpan(name, null, (span) => operation(span, context));
  }
}

/**
 * Sets common response attributes on a span
 */
export function setResponseAttributes(
  span: Span,
  response: {
    id?: string;
    modelId?: string;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      promptTokens?: number;
      completionTokens?: number;
    };
    finishReason?: string;
  },
): void {
  if (response.id) {
    span.setAttribute(Attr.GenAI.Response.ID, response.id);
  }
  if (response.modelId) {
    span.setAttribute(Attr.GenAI.Response.Model, response.modelId);
  }

  if (response.usage) {
    // Handle both V1 and V2 usage formats
    const inputTokens = response.usage.inputTokens ?? response.usage.promptTokens;
    const outputTokens = response.usage.outputTokens ?? response.usage.completionTokens;

    if (inputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, inputTokens);
    }
    if (outputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, outputTokens);
    }
  }

  if (response.finishReason) {
    span.setAttribute(Attr.GenAI.Response.FinishReasons, JSON.stringify([response.finishReason]));
  }
}

/**
 * Determines output type from response format - V1 version
 */
export function determineOutputTypeV1(options: {
  responseFormat?: { type?: string };
  mode?: { type?: string };
}): string | undefined {
  if (options.responseFormat?.type) {
    switch (options.responseFormat.type) {
      case 'json':
        return Attr.GenAI.Output.Type_Values.Json;
      case 'text':
        return Attr.GenAI.Output.Type_Values.Text;
    }
  }

  if (options.mode?.type === 'object-json' || options.mode?.type === 'object-tool') {
    return Attr.GenAI.Output.Type_Values.Json;
  }

  if (options.mode?.type === 'regular') {
    return Attr.GenAI.Output.Type_Values.Text;
  }

  return undefined;
}

/**
 * Determines output type from response format - V2 version
 */
export function determineOutputTypeV2(options: {
  responseFormat?: { type?: string };
}): string | undefined {
  if (options.responseFormat?.type) {
    switch (options.responseFormat.type) {
      case 'json':
        return Attr.GenAI.Output.Type_Values.Json;
      case 'text':
        return Attr.GenAI.Output.Type_Values.Text;
    }
  }

  return undefined;
}
