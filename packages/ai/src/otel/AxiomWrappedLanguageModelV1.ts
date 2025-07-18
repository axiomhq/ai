import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1ObjectGenerationMode,
  type LanguageModelV1Prompt,
  type LanguageModelV1FunctionToolCall,
  type LanguageModelV1FinishReason,
  type LanguageModelV1TextPart,
  type LanguageModelV1ToolCallPart,
  type LanguageModelV1StreamPart,
  type LanguageModelV1ProviderMetadata,
} from '@ai-sdk/providerv1';

import { trace, propagation, type Span } from '@opentelemetry/api';

import type { OpenAIMessage, OpenAIUserContentPart } from './vercelTypes';
import { Attr, SCHEMA_BASE_URL, SCHEMA_VERSION } from './semconv/attributes';

import { createGenAISpanName } from './shared';
import { currentUnixTime } from 'src/util/currentUnixTime';
import { createStartActiveSpan } from './startActiveSpan';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';
import { createSimpleCompletion } from './completionUtils';
import { appendToolCalls, extractToolResultsFromRawPrompt } from '../util/promptUtils';
import packageJson from '../../package.json';

// TODO: @cje - use these instead of current `result` type
type DoGenerateReturn = Awaited<ReturnType<LanguageModelV1['doGenerate']>>;
type RawPrompt = DoGenerateReturn['rawCall']['rawPrompt'];
type RawSettings = DoGenerateReturn['rawCall']['rawSettings'];
// type DoStreamReturn = Awaited<ReturnType<LanguageModelV1['doStream']>>;

interface GenAiSpanContext {
  originalPrompt: OpenAIMessage[];
  rawCall?: {
    rawPrompt?: RawPrompt;
    rawSettings?: RawSettings;
  };
}

interface BuildSpanAttributesInput {
  modelId: string;
  context: GenAiSpanContext;
  result: {
    response?: { id?: string; modelId?: string };
    finishReason?: LanguageModelV1FinishReason;
    usage?: { promptTokens: number; completionTokens: number };
    text?: string;
    toolCalls?: LanguageModelV1FunctionToolCall[];
    providerMetadata?: LanguageModelV1ProviderMetadata;
  };
}

class ToolCallAggregator {
  private readonly calls: Record<string, LanguageModelV1FunctionToolCall> = {};

  handleChunk(chunk: LanguageModelV1StreamPart): void {
    switch (chunk.type) {
      case 'tool-call':
        this.calls[chunk.toolCallId] = {
          toolCallType: chunk.toolCallType,
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.args,
        };
        break;
      case 'tool-call-delta':
        if (!this.calls[chunk.toolCallId]) {
          this.calls[chunk.toolCallId] = {
            toolCallType: chunk.toolCallType,
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: '',
          };
        }
        this.calls[chunk.toolCallId].args += chunk.argsTextDelta;
        break;
    }
  }

  get result(): LanguageModelV1FunctionToolCall[] {
    return Object.values(this.calls);
  }
}

class TextAggregator {
  private content = '';

  feed(chunk: LanguageModelV1StreamPart): void {
    if (chunk.type === 'text-delta') {
      this.content += chunk.textDelta;
    }
  }

  get text(): string | undefined {
    return this.content || undefined;
  }
}

class StreamStats {
  private startTime: number;
  private timeToFirstToken?: number;
  private _usage?: { promptTokens: number; completionTokens: number };
  private _finishReason?: LanguageModelV1FinishReason;
  private _responseId?: string;
  private _responseModelId?: string;
  private _providerMetadata?: LanguageModelV1ProviderMetadata;

  constructor() {
    this.startTime = currentUnixTime();
  }

  feed(chunk: LanguageModelV1StreamPart): void {
    // Track time to first token on any chunk
    if (this.timeToFirstToken === undefined) {
      this.timeToFirstToken = currentUnixTime() - this.startTime;
    }

    switch (chunk.type) {
      case 'response-metadata':
        if (chunk.id) {
          this._responseId = chunk.id;
        }
        if (chunk.modelId) {
          this._responseModelId = chunk.modelId;
        }
        // @ts-expect-error - not included on vercel types but have seen references to this elsewhere. need to check out
        if (chunk.providerMetadata) {
          // @ts-expect-error - not included on vercel types but have seen references to this elsewhere. need to check out
          this._providerMetadata = chunk.providerMetadata;
        }
        break;
      case 'finish':
        this._usage = chunk.usage;
        this._finishReason = chunk.finishReason;
        break;
    }
  }

  get result() {
    return {
      response:
        this._responseId || this._responseModelId
          ? {
              id: this._responseId,
              modelId: this._responseModelId,
            }
          : undefined,
      finishReason: this._finishReason,
      usage: this._usage,
      providerMetadata: this._providerMetadata,
    };
  }

  get firstTokenTime(): number | undefined {
    return this.timeToFirstToken;
  }
}

export function isLanguageModelV1(model: unknown): model is LanguageModelV1 {
  return (
    model != null &&
    typeof model === 'object' &&
    'specificationVersion' in model &&
    'provider' in model &&
    'modelId' in model &&
    (model as any).specificationVersion === 'v1' &&
    typeof (model as any).provider === 'string' &&
    typeof (model as any).modelId === 'string'
  );
}

export class AxiomWrappedLanguageModelV1 implements LanguageModelV1 {
  constructor(private model: LanguageModelV1) {}

  get specificationVersion() {
    return this.model.specificationVersion;
  }

  get provider(): string {
    return this.model.provider;
  }

  get modelId(): string {
    return this.model.modelId;
  }

  get defaultObjectGenerationMode(): LanguageModelV1ObjectGenerationMode {
    return this.model.defaultObjectGenerationMode;
  }

  get supportsImageUrls(): boolean | undefined {
    return this.model.supportsImageUrls;
  }

  get supportsStructuredOutputs(): boolean | undefined {
    return this.model.supportsStructuredOutputs;
  }

  get supportsUrl(): ((url: URL) => boolean) | undefined {
    return this.model.supportsUrl;
  }

  private async withSpanHandling<T>(
    operation: (span: Span, context: GenAiSpanContext) => Promise<T>,
  ): Promise<T> {
    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan = bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === 'true';

    const context: GenAiSpanContext = {
      originalPrompt: [],
      rawCall: undefined,
    };

    if (isWithinWithSpan) {
      // Reuse existing span created by withSpan
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error('Expected active span when within withSpan');
      }
      activeSpan.updateName(this.spanName());
      return operation(activeSpan, context);
    } else {
      // Create new span only if not within withSpan
      const tracer = trace.getTracer('@axiomhq/ai');
      const startActiveSpan = createStartActiveSpan(tracer);
      const name = this.spanName();

      return startActiveSpan(name, null, (span) => operation(span, context));
    }
  }

  async doGenerate(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span, context) => {
      this.setScopeAttributes(span);
      this.setPreCallAttributes(span, options, context);

      const res = await this.model.doGenerate(options);

      // Store rawCall data in context for access in post-call processing
      context.rawCall = res.rawCall;

      const attrs = buildSpanAttributes({ modelId: this.modelId, context, result: res });
      span.setAttributes(attrs);

      return res;
    });
  }

  async doStream(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span, context) => {
      this.setScopeAttributes(span);
      this.setPreCallAttributes(span, options, context);

      const { stream, ...head } = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture values here
      const modelId = this.modelId;
      const spanContext = context;

      const stats = new StreamStats();
      const toolAggregator = new ToolCallAggregator();
      const textAggregator = new TextAggregator();

      return {
        ...head,
        stream: stream.pipeThrough(
          new TransformStream({
            transform(chunk: LanguageModelV1StreamPart, controller) {
              stats.feed(chunk);
              toolAggregator.handleChunk(chunk);
              textAggregator.feed(chunk);

              controller.enqueue(chunk);
            },
            async flush(controller) {
              const attrs = buildSpanAttributes({
                modelId,
                context: spanContext,
                result: {
                  ...head,
                  ...stats.result,
                  toolCalls: toolAggregator.result.length > 0 ? toolAggregator.result : undefined,
                  text: textAggregator.text,
                },
              });
              span.setAttributes(attrs);

              controller.terminate();
            },
          }),
        ),
      };
    });
  }

  private spanName(): string {
    return createGenAISpanName(Attr.GenAI.Operation.Name_Values.Chat, this.modelId);
  }

  private setScopeAttributes(span: Span) {
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

  private determineOutputType({
    responseFormat,
    mode,
  }: {
    responseFormat: LanguageModelV1CallOptions['responseFormat'];
    mode: LanguageModelV1CallOptions['mode'];
  }): string | undefined {
    if (responseFormat?.type) {
      switch (responseFormat.type) {
        case 'json':
          return Attr.GenAI.Output.Type_Values.Json;
        case 'text':
          return Attr.GenAI.Output.Type_Values.Text;
      }
    }

    if (mode?.type === 'object-json' || mode?.type === 'object-tool') {
      return Attr.GenAI.Output.Type_Values.Json;
    }

    if (mode?.type === 'regular') {
      return Attr.GenAI.Output.Type_Values.Text;
    }

    return undefined;
  }

  private setPreCallAttributes(
    span: Span,
    options: LanguageModelV1CallOptions,
    context: GenAiSpanContext,
  ) {
    const {
      prompt,
      maxTokens,
      frequencyPenalty,
      presencePenalty,
      temperature,
      topP,
      topK,
      seed,
      stopSequences,
      responseFormat,
      mode,
    } = options;

    // Set prompt attributes (full conversation history)
    const processedPrompt = postProcessPrompt(prompt);

    // Store the original prompt for later use in post-call processing
    context.originalPrompt = processedPrompt;

    span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));

    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Request.Model]: this.modelId,
      [Attr.GenAI.Provider]: this.model.provider,
      [Attr.Axiom.GenAI.SchemaURL]: `${SCHEMA_BASE_URL}${SCHEMA_VERSION}`,
      [Attr.Axiom.GenAI.SDK.Name]: packageJson.name,
      [Attr.Axiom.GenAI.SDK.Version]: packageJson.version,
    });

    const outputType = this.determineOutputType({ responseFormat, mode });
    if (outputType) {
      span.setAttribute(Attr.GenAI.Output.Type, outputType);
    }

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
}

function buildSpanAttributes(
  input: BuildSpanAttributesInput,
): Record<string, string | number | boolean | string[]> {
  const attributes: Record<string, string | number | boolean | string[]> = {};
  const { result, context } = input;

  // Update prompt to include tool calls and tool results if they exist
  // (we're putting the tool calls/results on the prompt for semantic
  // reasons, but we only have access to them post-call with the vercel sdk)
  if (result.toolCalls && result.toolCalls.length > 0) {
    const originalPrompt = context.originalPrompt || [];

    const toolResultsMap = extractToolResultsFromRawPrompt(
      (context.rawCall?.rawPrompt as any[]) || [],
    );

    const updatedPrompt = appendToolCalls(originalPrompt, result.toolCalls, toolResultsMap);

    attributes[Attr.GenAI.Prompt] = JSON.stringify(updatedPrompt);
  }

  // Create simple completion array with just assistant text
  if (result.text) {
    const completion = createSimpleCompletion({
      text: result.text,
    });
    attributes[Attr.GenAI.Completion] = JSON.stringify(completion);
  }

  if (result.response?.id) {
    attributes[Attr.GenAI.Response.ID] = result.response.id;
  }
  if (result.response?.modelId) {
    attributes[Attr.GenAI.Response.Model] = result.response.modelId;
  }

  if (result.usage) {
    attributes[Attr.GenAI.Usage.InputTokens] = result.usage.promptTokens;
    attributes[Attr.GenAI.Usage.OutputTokens] = result.usage.completionTokens;
  }

  if (result.finishReason) {
    attributes[Attr.GenAI.Response.FinishReasons] = JSON.stringify([result.finishReason]);
  }

  return attributes;
}

function postProcessPrompt(prompt: LanguageModelV1Prompt): OpenAIMessage[] {
  const results: OpenAIMessage[] = [];
  for (const message of prompt) {
    switch (message.role) {
      case 'system':
        results.push({
          role: 'system',
          content: message.content,
        });
        break;
      case 'assistant':
        const textPart = message.content.find((part) => part.type === 'text') as
          | LanguageModelV1TextPart
          | undefined;
        const toolCallParts = message.content.filter(
          (part) => part.type === 'tool-call',
        ) as LanguageModelV1ToolCallPart[];
        results.push({
          role: 'assistant',
          content: textPart?.text || null,
          ...(toolCallParts.length > 0
            ? {
                tool_calls: toolCallParts.map((part) => ({
                  id: part.toolCallId,
                  function: {
                    name: part.toolName,
                    arguments: JSON.stringify(part.args),
                  },
                  type: 'function',
                })),
              }
            : {}),
        });
        break;
      case 'user':
        results.push({
          role: 'user',
          content: message.content.map((part): OpenAIUserContentPart => {
            switch (part.type) {
              case 'text':
                return {
                  type: 'text',
                  text: part.text,
                  ...(part.providerMetadata ? { providerMetadata: part.providerMetadata } : {}),
                };
              case 'image':
                return {
                  type: 'image_url',
                  image_url: {
                    url: part.image.toString(),
                    ...(part.providerMetadata ? { providerMetadata: part.providerMetadata } : {}),
                  },
                };
              default:
                // Convert unknown content types to text for compatibility
                return {
                  type: 'text',
                  text:
                    `[${part.type}]` +
                    (typeof part === 'object' && part !== null
                      ? JSON.stringify(part)
                      : String(part)),
                };
            }
          }),
        });
        break;
      case 'tool':
        for (const part of message.content) {
          results.push({
            role: 'tool',
            tool_call_id: part.toolCallId,
            content: JSON.stringify(part.result),
          });
        }
        break;
    }
  }
  return results;
}
