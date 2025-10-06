import {
  trace,
  context,
  propagation,
  type Span,
  SpanStatusCode,
  type AttributeValue,
  type Tracer,
} from '@opentelemetry/api';
import { Attr, SCHEMA_BASE_URL, SCHEMA_VERSION } from '../semconv/attributes';
import { createStartActiveSpan } from '../startActiveSpan';
import { WITHSPAN_BAGGAGE_KEY } from '../withSpanBaggageKey';

import { getGlobalTracer } from '../initAxiomAI';
// Removed import of createGenAISpanName since it's no longer exported
import packageJson from '../../../package.json';

/**
 * Classifies errors into low-cardinality types for OpenTelemetry error.type attribute
 * Reference: OTel spec § 7.22.5 for error.type guidelines
 *
 * Uses explicit mapping for useful error types, avoiding generic built-in errors
 * that are not actionable for observability dashboards.
 *
 * @returns string for actionable error types, undefined for unclassifiable errors
 */
function classifyError(err: unknown): string | undefined {
  if (err == null) return undefined;

  if (err instanceof Error) {
    const name = err.name.toLowerCase();

    // Explicit mapping for actionable error types
    if (name.includes('timeout')) return 'timeout';
    if (name.includes('abort')) return 'timeout'; // AbortError often means timeout
    if (name.includes('network') || name.includes('fetch')) return 'network';
    if (name.includes('validation')) return 'validation';
    if (name.includes('auth')) return 'authentication';
    if (name.includes('parse') || name.includes('json')) return 'parsing';
    if (name.includes('permission') || name.includes('forbidden')) return 'authorization';
    if (name.includes('rate') && name.includes('limit')) return 'rate_limit';
    if (name.includes('quota') || name.includes('limit')) return 'quota_exceeded';

    // Skip generic built-in errors (TypeError, ReferenceError, etc.)
    // They're not useful for observability dashboards
    return undefined;
  }

  return undefined; // Handles primitives thrown as errors
}

/**
 * Classifies tool-specific errors using duck-typing for cross-vendor compatibility
 * Handles node-fetch version differences and external API error patterns
 *
 * @param err The error to classify
 * @param span The span to set error attributes on
 */
export function classifyToolError(err: unknown, span: Span): void {
  // Enhanced error handling for OpenTelemetry compliance
  if (err instanceof Error) {
    span.recordException(err); // Error objects are compatible with Exception interface
  } else {
    // Convert primitives to compatible format
    span.recordException({
      message: String(err),
      name: 'UnknownError',
    });
  }

  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: err instanceof Error ? err.message : String(err),
  });

  let errorType = 'unknown';
  let statusCode: string | number | undefined;

  // Duck-type check for common error patterns (don't rely on inheritance)
  if (err && typeof err === 'object') {
    const errObj = err as any;
    const name = errObj.name?.toLowerCase() || '';
    const message = errObj.message?.toLowerCase() || '';

    if (name.includes('timeout') || name.includes('abort') || message.includes('timeout')) {
      errorType = 'timeout';
    } else if (
      name.includes('validation') ||
      errObj.code === 'VALIDATION_ERROR' ||
      message.includes('validation')
    ) {
      errorType = 'validation';
    } else if (
      name.includes('fetch') ||
      name.includes('network') ||
      message.includes('network') ||
      message.includes('fetch failed')
    ) {
      errorType = 'network';
      // Handle both node-fetch v2 (.code) and v3 (.status) patterns
      statusCode = errObj.status || errObj.code;
    } else if (
      name.includes('auth') ||
      message.includes('auth') ||
      message.includes('unauthorized')
    ) {
      errorType = 'authentication';
    } else if (
      name.includes('permission') ||
      name.includes('forbidden') ||
      message.includes('forbidden')
    ) {
      errorType = 'authorization';
    } else if (
      name.includes('rate') &&
      (name.includes('limit') || message.includes('rate limit'))
    ) {
      errorType = 'rate_limit';
    } else if (
      name.includes('quota') ||
      message.includes('quota') ||
      message.includes('limit exceeded')
    ) {
      errorType = 'quota_exceeded';
    } else if (
      name.includes('parse') ||
      name.includes('json') ||
      message.includes('json') ||
      message.includes('parse')
    ) {
      errorType = 'parsing';
    }
  }

  // MANDATORY: Standard OpenTelemetry error attributes
  span.setAttribute(Attr.Error.Type, errorType);
  if (err instanceof Error && err.message) {
    span.setAttribute(Attr.Error.Message, err.message);
  }

  // Standard HTTP attributes for network errors
  if (statusCode !== undefined) {
    span.setAttribute(Attr.HTTP.Response.StatusCode, statusCode as AttributeValue);
  }
}

/**
 * Check if the current tracer provider is a no-op
 * Uses safer detection that works with bundling/minification
 */
function isNoOpTracerProvider(): boolean {
  const provider = trace.getTracerProvider();

  // Check constructor name (may fail with bundling/minification)
  if (provider.constructor.name === 'NoopTracerProvider') {
    return true;
  }

  // Check if getTracer method exists before calling it (for test mocks)
  if (typeof (provider as any).getTracer !== 'function') {
    return true;
  }

  return false;
}

/**
 * Gets the appropriate tracer instance using global scope or fallbacks
 */
export function getTracer(): Tracer {
  const tracer = getGlobalTracer();

  if (isNoOpTracerProvider()) {
    const DEBUG = process.env.AXIOM_DEBUG === 'true';
    if (!DEBUG) {
      console.warn(
        '[AxiomAI] No TracerProvider registered - spans will be no-op. ' +
          'Make sure to call initAxiomAI() after your OpenTelemetry SDK has started (sdk.start()).',
      );
    }
  }

  return tracer;
}

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
 * Sets Axiom-specific base attributes on a span
 */
export function setAxiomBaseAttributes(span: Span): void {
  span.setAttributes({
    [Attr.Axiom.GenAI.SchemaURL]: `${SCHEMA_BASE_URL}${SCHEMA_VERSION}`,
    [Attr.Axiom.GenAI.SDK.Name]: packageJson.name,
    [Attr.Axiom.GenAI.SDK.Version]: packageJson.version,
  });
}

/**
 * Sets common base attributes on a span
 */
export function setBaseAttributes(span: Span, provider: string, modelId: string): void {
  span.setAttributes({
    [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
    [Attr.GenAI.Request.Model]: modelId,
  });

  const systemValue = mapVercelSDKProviderToOTelProvider(provider);
  if (systemValue) {
    span.setAttribute(Attr.GenAI.Provider.Name, systemValue);
  }

  setAxiomBaseAttributes(span);
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
 * Creates a child span for stream processing
 * This is used to capture errors that occur during stream processing,
 * after the parent span has ended
 */
export function createStreamChildSpan(parentSpan: Span, operationName: string): Span {
  const tracer = getTracer();

  // Create child span by setting parent context
  const spanContext = trace.setSpan(context.active(), parentSpan);
  const childSpan = tracer.startSpan(operationName, undefined, spanContext);

  return childSpan;
}

/**
 * Enhanced error handling for child spans with OpenTelemetry compliance
 */
export function handleStreamError(span: Span, err: unknown): void {
  // Enhanced error handling for OpenTelemetry compliance
  if (err instanceof Error) {
    span.recordException(err); // Error objects are compatible with Exception interface
  } else {
    // Convert primitives to compatible format
    span.recordException({
      message: String(err),
      name: 'UnknownError',
    });
  }

  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: err instanceof Error ? err.message : String(err),
  });

  // MANDATORY: Add OpenTelemetry error attributes for cross-vendor compatibility
  const errorType = classifyError(err);
  span.setAttribute(Attr.Error.Type, errorType ?? 'unknown');

  // OPTIONAL: Add human-readable error message
  if (err instanceof Error && err.message) {
    span.setAttribute(Attr.Error.Message, err.message);
  }

  // For Vercel AI SDK specific errors, add HTTP status if available
  if (err && typeof err === 'object' && 'status' in err) {
    span.setAttribute(Attr.HTTP.Response.StatusCode, err.status as AttributeValue);
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

    try {
      return await operation(activeSpan, context);
    } catch (err) {
      // Enhanced error handling for OpenTelemetry compliance
      if (err instanceof Error) {
        activeSpan.recordException(err); // Error objects are compatible with Exception interface
      } else {
        // Convert primitives to compatible format
        activeSpan.recordException({
          message: String(err),
          name: 'UnknownError',
        });
      }

      activeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });

      // MANDATORY: Add OpenTelemetry error attributes for cross-vendor compatibility
      const errorType = classifyError(err);
      activeSpan.setAttribute(Attr.Error.Type, errorType ?? 'unknown');

      // OPTIONAL: Add human-readable error message
      if (err instanceof Error && err.message) {
        activeSpan.setAttribute(Attr.Error.Message, err.message);
      }

      // For Vercel AI SDK specific errors, add HTTP status if available
      if (err && typeof err === 'object' && 'status' in err) {
        activeSpan.setAttribute(Attr.HTTP.Response.StatusCode, err.status as AttributeValue);
      }

      throw err;
    }
  } else {
    // Create new span only if not within withSpan
    const tracer = getTracer();
    const startActiveSpan = createStartActiveSpan(tracer);
    const name = createGenAISpanName(Attr.GenAI.Operation.Name_Values.Chat, modelId);

    return startActiveSpan(name, null, (span) => operation(span, context), {
      onError: (err, span) => {
        // Enhanced error handling for OpenTelemetry compliance
        // MANDATORY: Add OpenTelemetry error attributes for cross-vendor compatibility
        const errorType = classifyError(err);
        span.setAttribute(Attr.Error.Type, errorType ?? 'unknown');

        // OPTIONAL: Add human-readable error message
        if (err instanceof Error && err.message) {
          span.setAttribute(Attr.Error.Message, err.message);
        }

        // For Vercel AI SDK specific errors, add HTTP status if available
        if (err && typeof err === 'object' && 'status' in err) {
          span.setAttribute(Attr.HTTP.Response.StatusCode, err.status as AttributeValue);
        }
      },
    });
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

/**
 * Maps AI SDK provider IDs to OpenTelemetry gen_ai.provider.name values
 *
 * @param vercelSDKProvider - The provider ID from the AI SDK
 * @returns The corresponding `gen_ai.provider.name` value, or `undefined` if no match is found
 */
export function mapVercelSDKProviderToOTelProvider(vercelSDKProvider: string): string | undefined {
  if (vercelSDKProvider === 'openai-compatible') {
    // we don't know the real provider
    return undefined;
  }

  // exact matches
  switch (vercelSDKProvider) {
    case 'amazon-bedrock':
      return Attr.GenAI.Provider.Name_Values.AWSBedrock;
    case 'anthropic':
    case 'anthropic.messages':
      return Attr.GenAI.Provider.Name_Values.Anthropic;
    case 'assemblyai':
    case 'assemblyai.transcription':
      return Attr.GenAI.Provider.Name_Values.AssemblyAI;
    case 'deepgram':
    case 'deepgram.transcription':
      return Attr.GenAI.Provider.Name_Values.Deepgram;
    case 'gateway': // `import { gateway } from 'ai'`
      return Attr.GenAI.Provider.Name_Values.Vercel;
    case 'gladia':
    case 'gladia.transcription':
      return Attr.GenAI.Provider.Name_Values.Gladia;
    case 'google':
    case 'google.generative-ai':
      return Attr.GenAI.Provider.Name_Values.GCPGemini;
    case 'groq':
      return Attr.GenAI.Provider.Name_Values.Groq;
    case 'mistral':
      return Attr.GenAI.Provider.Name_Values.MistralAI;
    case 'openai':
      return Attr.GenAI.Provider.Name_Values.OpenAI;
    case 'perplexity':
      return Attr.GenAI.Provider.Name_Values.Perplexity;
    case 'replicate':
      return Attr.GenAI.Provider.Name_Values.Replicate;
    case 'revai':
    case 'revai.transcription':
      return Attr.GenAI.Provider.Name_Values.RevAI;
    case 'togetherai':
      return Attr.GenAI.Provider.Name_Values.TogetherAI;
    case 'xai':
      return Attr.GenAI.Provider.Name_Values.XAI;

    // startswith + fall through
    default: {
      if (vercelSDKProvider.startsWith('azure.')) {
        return Attr.GenAI.Provider.Name_Values.AzureAIOpenAI;
      }
      if (vercelSDKProvider.startsWith('cerebras.')) {
        return Attr.GenAI.Provider.Name_Values.Cerebras;
      }
      if (vercelSDKProvider.startsWith('cohere.')) {
        return Attr.GenAI.Provider.Name_Values.Cohere;
      }
      if (vercelSDKProvider.startsWith('deepinfra.')) {
        return Attr.GenAI.Provider.Name_Values.DeepInfra;
      }
      if (vercelSDKProvider.startsWith('deepseek.')) {
        return Attr.GenAI.Provider.Name_Values.Deepseek;
      }
      if (vercelSDKProvider.startsWith('elevenlabs.')) {
        return Attr.GenAI.Provider.Name_Values.ElevenLabs;
      }
      if (vercelSDKProvider.startsWith('fal.')) {
        return Attr.GenAI.Provider.Name_Values.Fal;
      }
      if (vercelSDKProvider.startsWith('fireworks.')) {
        return Attr.GenAI.Provider.Name_Values.Fireworks;
      }
      if (vercelSDKProvider.startsWith('google.vertex.')) {
        return Attr.GenAI.Provider.Name_Values.GCPVertexAI;
      }
      if (vercelSDKProvider.startsWith('groq.')) {
        return Attr.GenAI.Provider.Name_Values.Groq;
      }
      if (vercelSDKProvider.startsWith('hume.')) {
        return Attr.GenAI.Provider.Name_Values.Hume;
      }
      if (vercelSDKProvider.startsWith('lmnt.')) {
        return Attr.GenAI.Provider.Name_Values.Lmnt;
      }
      if (vercelSDKProvider.startsWith('luma.')) {
        return Attr.GenAI.Provider.Name_Values.Luma;
      }
      if (vercelSDKProvider.startsWith('mistral.')) {
        return Attr.GenAI.Provider.Name_Values.MistralAI;
      }
      if (vercelSDKProvider.startsWith('openai.')) {
        return Attr.GenAI.Provider.Name_Values.OpenAI;
      }
      if (vercelSDKProvider.startsWith('vercel.')) {
        return Attr.GenAI.Provider.Name_Values.Vercel;
      }
      if (vercelSDKProvider.startsWith('vertex.anthropic.')) {
        return Attr.GenAI.Provider.Name_Values.GCPVertexAI;
      }
      if (vercelSDKProvider.startsWith('xai.')) {
        return Attr.GenAI.Provider.Name_Values.XAI;
      }

      // most other openai-compatible providers use {providerName}.{chat|completion|embedding|image}
      const s = vercelSDKProvider.split('.');
      if (s.length === 2) {
        return s[0];
      }

      // For unknown providers, don't set the attribute
      return undefined;
    }
  }
}
