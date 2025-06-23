import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1ObjectGenerationMode,
  type LanguageModelV1Prompt,
  type LanguageModelV1FunctionToolCall,
  type LanguageModelV1FinishReason,
  type LanguageModelV1FunctionTool,
  type LanguageModelV1ProviderDefinedTool,
  type LanguageModelV1TextPart,
  type LanguageModelV1ToolCallPart,
} from "@ai-sdk/provider";

import { trace, propagation, type Span } from "@opentelemetry/api";
import { Attr } from "./semconv/attributes";
import { createStartActiveSpan } from "./startActiveSpan";
import { currentUnixTime } from "../util/currentUnixTime";
import { _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing } from "src/pricing";
import { WITHSPAN_BAGGAGE_KEY } from "./withSpanBaggageKey";
import { createGenAISpanName } from "./shared";

export function _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_attemptToEnrichSpanWithPricing({
  span,
  model,
  inputTokens,
  outputTokens,
}: {
  span: Span;
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const cost =
    _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing.calculateCost(
      inputTokens,
      outputTokens,
      model
    );
  span.setAttribute(Attr.GenAI.Cost.Estimated, cost.toFixed(6));
}

function formatCompletion({
  text,
  toolCalls,
  finishReason,
}: {
  text: string | undefined;
  toolCalls: LanguageModelV1FunctionToolCall[] | undefined;
  finishReason: LanguageModelV1FinishReason;
}) {
  return {
    role: "assistant",
    content:
      text ??
      (toolCalls
        ? toolCalls.length === 1 && toolCalls[0].toolName === "json"
          ? toolCalls[0].args
          : JSON.stringify(toolCalls)
        : ""),
    finish_reason: finishReason,
  };
}

function convertTools(
  tools: Array<LanguageModelV1FunctionTool | LanguageModelV1ProviderDefinedTool>
) {
  return tools.map((tool) => {
    const { type: _, ...rest } = tool;
    return {
      type: tool.type,
      function: rest,
    };
  });
}

function postProcessPrompt(prompt: LanguageModelV1Prompt): any[] {
  const results: any[] = [];
  for (const message of prompt) {
    switch (message.role) {
      case "system":
        results.push({
          role: "system",
          content: message.content,
        });
        break;
      case "assistant":
        const textPart = message.content.find(
          (part) => part.type === "text"
        ) as LanguageModelV1TextPart | undefined;
        const toolCallParts = message.content.filter(
          (part) => part.type === "tool-call"
        ) as LanguageModelV1ToolCallPart[];
        results.push({
          role: "assistant",
          content: textPart?.text || null,
          ...(toolCallParts.length > 0
            ? {
                tool_calls: toolCallParts.map((part) => ({
                  id: part.toolCallId,
                  function: {
                    name: part.toolName,
                    arguments: JSON.stringify(part.args),
                  },
                  type: "function" as const,
                })),
              }
            : {}),
        });
        break;
      case "user":
        results.push({
          role: "user",
          content: message.content.map((part) => {
            switch (part.type) {
              case "text":
                return {
                  type: "text",
                  text: part.text,
                  ...(part.providerMetadata
                    ? { providerMetadata: part.providerMetadata }
                    : {}),
                };
              case "image":
                return {
                  type: "image_url",
                  image_url: {
                    url: part.image.toString(),
                    ...(part.providerMetadata
                      ? { providerMetadata: part.providerMetadata }
                      : {}),
                  },
                };
              default:
                return part as any;
            }
          }),
        });
        break;
      case "tool":
        for (const part of message.content) {
          results.push({
            role: "tool",
            tool_call_id: part.toolCallId,
            content: JSON.stringify(part.result),
          });
        }
        break;
    }
  }
  return results;
}

export function wrapAISDKModel<T extends object>(model: T): T {
  const m = model as any;
  if (
    m?.specificationVersion === "v1" &&
    typeof m?.provider === "string" &&
    typeof m?.modelId === "string"
  ) {
    return new AxiomWrappedLanguageModelV1(m as LanguageModelV1) as any as T;
  } else {
    console.warn("Unsupported AI SDK model. Not wrapping.");
    return model;
  }
}

class AxiomWrappedLanguageModelV1 implements LanguageModelV1 {
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
    operation: (span: Span) => Promise<T>
  ): Promise<T> {
    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan =
      bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === "true";

    if (isWithinWithSpan) {
      // Reuse existing span created by withSpan
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error("Expected active span when within withSpan");
      }
      activeSpan.updateName(this.spanName());
      return operation(activeSpan);
    } else {
      // Create new span only if not within withSpan
      const tracer = trace.getTracer("@axiomhq/ai");
      const startActiveSpan = createStartActiveSpan(tracer);
      const name = this.spanName();

      return startActiveSpan(name, null, operation);
    }
  }

  async doGenerate(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span) => {
      this.setScopeAttributes(span);
      this.setPreCallAttributes(span, options);

      const res = await this.model.doGenerate(options);

      const resWithToolCalls = {
        ...res,
        toolCalls: res.toolCalls || undefined,
      };

      this.setPostCallAttributes(span, resWithToolCalls);

      return res;
    });
  }

  async doStream(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span) => {
      const startTime = currentUnixTime(); // Unix timestamp

      this.setScopeAttributes(span);

      this.setPreCallAttributes(span, options);

      const ret = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture the model ID here
      const modelId = this.modelId;

      // Track streaming metrics
      let timeToFirstToken: number | undefined = undefined;
      let usage:
        | {
            promptTokens: number;
            completionTokens: number;
          }
        | undefined = undefined;
      let fullText: string | undefined = undefined;
      const toolCallsMap: Record<string, any> = {};
      let finishReason: LanguageModelV1FinishReason | undefined = undefined;
      let responseId: string | undefined = undefined;
      let responseModelId: string | undefined = undefined;
      let responseProviderMetadata: any = undefined;

      return {
        ...ret,
        stream: ret.stream.pipeThrough(
          new TransformStream({
            transform(chunk: any, controller) {
              // Track time to first token
              if (timeToFirstToken === undefined) {
                timeToFirstToken = currentUnixTime() - startTime;
                span.setAttribute(
                  "gen_ai.response.time_to_first_token",
                  timeToFirstToken
                );
              }

              switch (chunk.type) {
                case "response-metadata":
                  if (chunk.id) {
                    responseId = chunk.id;
                  }
                  if (chunk.modelId) {
                    responseModelId = chunk.modelId;
                  }
                  if (chunk.providerMetadata) {
                    responseProviderMetadata = chunk.providerMetadata;
                  }
                  break;
                case "text-delta":
                  if (fullText === undefined) {
                    fullText = "";
                  }
                  fullText += chunk.textDelta;
                  break;
                case "tool-call":
                  toolCallsMap[chunk.toolCallId] = {
                    toolCallType: chunk.toolCallType,
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args: chunk.args,
                  };
                  break;
                case "tool-call-delta":
                  if (toolCallsMap[chunk.toolCallId] === undefined) {
                    toolCallsMap[chunk.toolCallId] = {
                      toolCallType: chunk.toolCallType,
                      toolCallId: chunk.toolCallId,
                      toolName: chunk.toolName,
                      args: "",
                    };
                  }
                  toolCallsMap[chunk.toolCallId].args += chunk.argsTextDelta;
                  break;
                case "finish":
                  usage = chunk.usage;
                  finishReason = chunk.finishReason;
                  break;
              }

              controller.enqueue(chunk);
            },
            async flush(controller) {
              // Convert toolCallsMap to array for postProcessOutput
              const toolCallsArray: LanguageModelV1FunctionToolCall[] =
                Object.values(toolCallsMap);

              // Construct result object for helper function
              const streamResult = {
                response:
                  responseId || responseModelId
                    ? {
                        id: responseId,
                        modelId: responseModelId,
                      }
                    : undefined,
                finishReason,
                usage,
                text: fullText,
                toolCalls:
                  toolCallsArray.length > 0 ? toolCallsArray : undefined,
                providerMetadata: responseProviderMetadata,
              };

              AxiomWrappedLanguageModelV1.setPostCallAttributesStatic(
                span,
                modelId,
                streamResult
              );

              controller.terminate();
            },
          })
        ),
      };
    });
  }

  private spanName(): string {
    // TODO: do we ever want to not use "chat"?
    return createGenAISpanName(
      Attr.GenAI.Operation.Name_Values.Chat,
      this.modelId
    );
  }

  private setScopeAttributes(span: Span) {
    const bag = propagation.getActiveBaggage();

    // Set workflow and task attributes from baggage
    if (bag) {
      if (bag.getEntry("workflow")?.value) {
        span.setAttribute(
          Attr.GenAI.Operation.WorkflowName,
          bag.getEntry("workflow")!.value
        );
      }
      if (bag.getEntry("task")?.value) {
        span.setAttribute(
          Attr.GenAI.Operation.TaskName,
          bag.getEntry("task")!.value
        );
      }
    }
  }

  private setPreCallAttributes(
    span: Span,
    options: LanguageModelV1CallOptions
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
      inputFormat,
      mode,
      providerMetadata,
    } = options;

    // Set prompt attributes (full conversation history)
    const processedPrompt = postProcessPrompt(prompt);
    span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));

    // Set request attributes
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: this.modelId,
      [Attr.GenAI.Provider]: this.provider,
      // TODO: there is currently no good way to get the system from the vercel sdk.
      // we would need a lookup table or regex stuff or similar. fragile either way.
      // @see: docs for `ATTR_GEN_AI_SYSTEM`)
      // [Attr.GenAI.System]: "_OTHER",
    });

    // Set optional request attributes
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

    // Set stop sequences
    if (stopSequences && stopSequences.length > 0) {
      span.setAttribute(
        Attr.GenAI.Request.StopSequences,
        JSON.stringify(stopSequences)
      );
    }

    // Set response format
    if (responseFormat) {
      span.setAttribute(Attr.GenAI.Output.Type, responseFormat.type);
    }

    // Set input format
    span.setAttribute("gen_ai.request.input_format", inputFormat);

    // Set mode information
    span.setAttribute("gen_ai.request.mode_type", mode.type);
    if (mode.type === "regular" && mode.tools) {
      span.setAttribute("gen_ai.request.tools_count", mode.tools.length);
      if (mode.toolChoice) {
        span.setAttribute(
          "gen_ai.request.tool_choice",
          typeof mode.toolChoice === "string"
            ? mode.toolChoice
            : JSON.stringify(mode.toolChoice)
        );
      }
    }

    // Set provider metadata if present in request
    if (providerMetadata && Object.keys(providerMetadata).length > 0) {
      span.setAttribute(
        "gen_ai.request.provider_metadata",
        JSON.stringify(providerMetadata)
      );
    }
  }

  // this is static because we would need to hold a reference to the instance in `executeStream` otherwise
  private static setPostCallAttributesStatic(
    span: Span,
    modelId: string,
    result: {
      response?: { id?: string; modelId?: string };
      finishReason?: LanguageModelV1FinishReason;
      usage?: { promptTokens: number; completionTokens: number };
      text?: string;
      toolCalls?: LanguageModelV1FunctionToolCall[];
      providerMetadata?: any;
    }
  ) {
    const bag = propagation.getActiveBaggage();

    // Set response attributes
    if (result.response?.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
    }
    if (result.response?.modelId) {
      span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
    }

    // Set usage attributes
    if (result.usage) {
      span.setAttribute(
        Attr.GenAI.Usage.InputTokens,
        result.usage.promptTokens
      );
      span.setAttribute(
        Attr.GenAI.Usage.OutputTokens,
        result.usage.completionTokens
      );
    }

    // Check for experimental pricing estimation (after we have usage data)
    const shouldEstimatePricing =
      bag?.getEntry(
        "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing"
      )?.value === "true";
    if (shouldEstimatePricing && result.usage) {
      _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_attemptToEnrichSpanWithPricing(
        {
          span,
          model: modelId,
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
        }
      );
    }

    // Set completion in proper format
    if (result.finishReason && (result.text || result.toolCalls)) {
      const completion = formatCompletion({
        text: result.text,
        toolCalls: result.toolCalls,
        finishReason: result.finishReason,
      });
      span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));
    }

    // Set provider metadata if available
    if (
      result.providerMetadata &&
      Object.keys(result.providerMetadata).length > 0
    ) {
      span.setAttribute(
        Attr.GenAI.Response.ProviderMetadata,
        JSON.stringify(result.providerMetadata)
      );
    }
  }

  private setPostCallAttributes(
    span: Span,
    result: {
      response?: { id?: string; modelId?: string };
      finishReason?: LanguageModelV1FinishReason;
      usage?: { promptTokens: number; completionTokens: number };
      text?: string;
      toolCalls?: LanguageModelV1FunctionToolCall[];
      providerMetadata?: any;
    }
  ) {
    AxiomWrappedLanguageModelV1.setPostCallAttributesStatic(
      span,
      this.modelId,
      result
    );
  }
}
