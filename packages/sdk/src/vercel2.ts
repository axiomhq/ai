import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  // type LanguageModelV1FinishReason,
  // type LanguageModelV1FunctionTool,
  // type LanguageModelV1FunctionToolCall,
  type LanguageModelV1ObjectGenerationMode,
  type LanguageModelV1Prompt,
  // type LanguageModelV1Prompt,
  // type LanguageModelV1ProviderDefinedTool,
  // type LanguageModelV1StreamPart,
  // type LanguageModelV1TextPart,
  // type LanguageModelV1ToolCallPart,
} from "@ai-sdk/provider";

import {
  context,
  trace,
  propagation,
  type Span,
  // SpanStatusCode,
  type Baggage,
  type Tracer,
} from "@opentelemetry/api";
import { Attr } from "./otel/semconv/attributes";
import { createStartActiveSpan } from "./otel/startActiveSpan";
import { attemptToEnrichSpanWithPricing } from "./vercel";

function currentUnixTime(): number {
  return Date.now() / 1000;
}

// Axiom AI Resources singleton for configuration management
class AxiomAIResources {
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

type Meta = {
  // TODO: BEFORE RELEASE - i think we will name these something else. but leaving like this for now to
  // not break
  workflow: string;
  task: string;
};
export function withSpan<T extends (...args: any[]) => Promise<any>>(
  meta: Meta,
  fn: (...args: Parameters<T>) => ReturnType<T>,
  opts?: {
    tracer?: Tracer;
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing?: boolean;
  }
): Promise<ReturnType<T>> {
  const tracer =
    opts?.tracer ??
    AxiomAIResources.getInstance().getTracer() ??
    trace.getTracer("@axiomhq/ai");

  const startActiveSpan = createStartActiveSpan(tracer);
  return startActiveSpan("gen_ai.call_llm", null, async (_span) => {
    const bag: Baggage = propagation.createBaggage({
      workflow: { value: meta.workflow },
      task: { value: meta.task },
      // TODO: maybe we can just check the active span name instead?
      __withspan_gen_ai_call: { value: "true" }, // Mark that we're inside withSpan
      ...(opts?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing && {
        __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing:
          { value: "true" },
      }),
    });

    const ctx = propagation.setBaggage(context.active(), bag);
    return await context.with(ctx, fn);
  });
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

  private async executeGenerate(
    options: LanguageModelV1CallOptions,
    span: Span
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
      headers: _headers,
      abortSignal: _abortSignal,
      stopSequences,
      responseFormat,
      inputFormat,
      mode,
      providerMetadata,
    } = options;

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

    // Set prompt attributes
    putPromptOnSpan(span, prompt);

    // Set request attributes
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: this.modelId,
      [Attr.GenAI.Provider]: this.provider,
      [Attr.GenAI.System]: Attr.GenAI.System_Values.Vercel,
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
    } else if (mode.type === "object-json") {
      if (mode.name) {
        span.setAttribute("gen_ai.request.object_name", mode.name);
      }
      if (mode.description) {
        span.setAttribute(
          "gen_ai.request.object_description",
          mode.description
        );
      }
      if (mode.schema) {
        span.setAttribute("gen_ai.request.object_has_schema", true);
      }
    } else if (mode.type === "object-tool") {
      span.setAttribute("gen_ai.request.object_tool_name", mode.tool.name);
    }

    // Set provider metadata if present in request
    if (providerMetadata && Object.keys(providerMetadata).length > 0) {
      span.setAttribute(
        "gen_ai.request.provider_metadata",
        JSON.stringify(providerMetadata)
      );
    }

    const ret = await this.model.doGenerate(options);

    // Set response attributes
    if (ret.response?.id) {
      span.setAttribute(Attr.GenAI.Response.ID, ret.response.id);
    }
    if (ret.response?.modelId) {
      span.setAttribute(Attr.GenAI.Response.Model, ret.response.modelId);
    }
    if (ret.finishReason) {
      span.setAttribute(Attr.GenAI.Response.FinishReason, ret.finishReason);
    }

    // Set usage attributes
    if (ret.usage) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, ret.usage.promptTokens);
      span.setAttribute(
        Attr.GenAI.Usage.OutputTokens,
        ret.usage.completionTokens
      );
    }

    // Check for experimental pricing estimation (after we have usage data)
    const shouldEstimatePricing =
      bag?.getEntry(
        "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing"
      )?.value === "true";
    if (shouldEstimatePricing && ret.usage) {
      attemptToEnrichSpanWithPricing({
        span,
        model: this.modelId,
        inputTokens: ret.usage.promptTokens,
        outputTokens: ret.usage.completionTokens,
      });
    }

    // Set response text (you may want to make this conditional based on a flag)
    if (ret.text) {
      span.setAttribute(Attr.GenAI.Response.Text, ret.text);
    }

    // Set provider metadata if available
    if (ret.providerMetadata && Object.keys(ret.providerMetadata).length > 0) {
      span.setAttribute(
        Attr.GenAI.Response.ProviderMetadata,
        JSON.stringify(ret.providerMetadata)
      );
    }

    console.log("tktk ret", ret.text);

    return ret;
  }

  // For the first cut, do not support custom span_info arguments. We can
  // propagate those via async local storage
  async doGenerate(options: LanguageModelV1CallOptions) {
    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan =
      bag?.getEntry("__withspan_gen_ai_call")?.value === "true";

    if (isWithinWithSpan) {
      // Reuse existing span created by withSpan
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error("Expected active span when within withSpan");
      }
      return this.executeGenerate(options, activeSpan);
    } else {
      // Create new span only if not within withSpan
      const tracer = trace.getTracer("@axiomhq/ai");
      const startActiveSpan = createStartActiveSpan(tracer);
      return startActiveSpan("gen_ai.call_llm", null, async (span) => {
        return await this.executeGenerate(options, span);
      });
    }
  }

  private async executeStream(options: LanguageModelV1CallOptions, span: Span) {
    const {
      prompt,
      maxTokens,
      frequencyPenalty,
      presencePenalty,
      temperature,
      topP,
      topK,
      seed,
      headers: _headers,
      abortSignal: _abortSignal,
      stopSequences,
      responseFormat,
      inputFormat,
      mode,
      providerMetadata,
    } = options;

    const bag = propagation.getActiveBaggage();
    const startTime = currentUnixTime(); // Unix timestamp

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

    // Set prompt attributes
    putPromptOnSpan(span, prompt);

    // Set request attributes (same as executeGenerate)
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: this.modelId,
      [Attr.GenAI.Provider]: this.provider,
      [Attr.GenAI.System]: Attr.GenAI.System_Values.Vercel,
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
    // TODO: all these string attrs need to be bikeshedded, i just made them up without too much consideration
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
    } else if (mode.type === "object-json") {
      if (mode.name) {
        span.setAttribute("gen_ai.request.object_name", mode.name);
      }
      if (mode.description) {
        span.setAttribute(
          "gen_ai.request.object_description",
          mode.description
        );
      }
      if (mode.schema) {
        span.setAttribute("gen_ai.request.object_has_schema", true);
      }
    } else if (mode.type === "object-tool") {
      span.setAttribute("gen_ai.request.object_tool_name", mode.tool.name);
    }

    // Set provider metadata if present in request
    if (providerMetadata && Object.keys(providerMetadata).length > 0) {
      span.setAttribute(
        "gen_ai.request.provider_metadata",
        JSON.stringify(providerMetadata)
      );
    }

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
    const toolCalls: Record<string, any> = {};
    let finishReason: string | undefined = undefined;
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
                toolCalls[chunk.toolCallId] = {
                  toolCallType: chunk.toolCallType,
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  args: chunk.args,
                };
                break;
              case "tool-call-delta":
                if (toolCalls[chunk.toolCallId] === undefined) {
                  toolCalls[chunk.toolCallId] = {
                    toolCallType: chunk.toolCallType,
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args: "",
                  };
                }
                toolCalls[chunk.toolCallId].args += chunk.argsTextDelta;
                break;
              case "finish":
                usage = chunk.usage;
                finishReason = chunk.finishReason;
                break;
            }

            controller.enqueue(chunk);
          },
          async flush(controller) {
            // Set final response attributes
            if (responseId) {
              span.setAttribute(Attr.GenAI.Response.ID, responseId);
            }
            if (responseModelId) {
              span.setAttribute(Attr.GenAI.Response.Model, responseModelId);
            }
            if (finishReason) {
              span.setAttribute(Attr.GenAI.Response.FinishReason, finishReason);
            }

            // Set usage attributes
            if (usage) {
              span.setAttribute(
                Attr.GenAI.Usage.InputTokens,
                usage.promptTokens
              );
              span.setAttribute(
                Attr.GenAI.Usage.OutputTokens,
                usage.completionTokens
              );
            }

            // Set response text
            if (fullText) {
              span.setAttribute(Attr.GenAI.Response.Text, fullText);
            }

            // Set provider metadata if available
            if (
              responseProviderMetadata &&
              Object.keys(responseProviderMetadata).length > 0
            ) {
              span.setAttribute(
                Attr.GenAI.Response.ProviderMetadata,
                JSON.stringify(responseProviderMetadata)
              );
            }

            // Check for experimental pricing estimation (after we have usage data)
            const shouldEstimatePricing =
              bag?.getEntry(
                "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing"
              )?.value === "true";
            if (shouldEstimatePricing && usage) {
              attemptToEnrichSpanWithPricing({
                span,
                model: modelId,
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
              });
            }

            // Log streaming metrics
            console.log("tktk stream completed", {
              timeToFirstToken,
              fullText: fullText?.substring(0, 100) + "...",
              toolCallsCount: Object.keys(toolCalls).length,
            });

            controller.terminate();
          },
        })
      ),
    };
  }

  async doStream(options: LanguageModelV1CallOptions) {
    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan =
      bag?.getEntry("__withspan_gen_ai_call")?.value === "true";

    if (isWithinWithSpan) {
      // Reuse existing span created by withSpan
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error("Expected active span when within withSpan");
      }
      return this.executeStream(options, activeSpan);
    } else {
      // Create new span only if not within withSpan
      const tracer = trace.getTracer("@axiomhq/ai");
      const startActiveSpan = createStartActiveSpan(tracer);
      return startActiveSpan("gen_ai.call_llm", null, async (span) => {
        return await this.executeStream(options, span);
      });
    }
  }

  // TODO: implement
  // - convertTools
  // - postProcessPrompt (we have putPromptOnSpan now but it's almost certainly wrong)
  // - postProcessOutput
}

// TODO: better name
function putPromptOnSpan(span: Span, prompt: LanguageModelV1Prompt) {
  prompt.forEach((p) => {
    // TODO: this is almost certainly wrong!!! Look at with Neil
    switch (p.role) {
      case "system":
        span.setAttribute(Attr.GenAI.Prompt.System, p.content);
        break;
      case "user":
        if (typeof p.content === "string") {
          span.setAttribute(Attr.GenAI.Prompt.Text, p.content);
        } else if (Array.isArray(p.content)) {
          // Handle array of content parts - extract text from all text parts
          if (p.content.some((part) => part.type !== "text")) {
            throw new Error(`TODO: handle - ${JSON.stringify(p.content)}`);
          }

          const textParts = p.content.map((part: any) => part.text);

          if (textParts.length === 0) {
            return;
          } else if (textParts.length === 1) {
            span.setAttribute(Attr.GenAI.Prompt.Text, textParts[0]);
          } else {
            span.setAttribute(
              Attr.GenAI.Prompt.Text,
              textParts.map((p, idx) => `[Part ${idx + 1}]: ${p}`).join("\n\n")
            );
          }
        } else {
          throw new Error(`TODO: handle - ${JSON.stringify(p.content)}`);
        }
        break;
      default:
        throw new Error(`TODO: handle - ${JSON.stringify(p.role)}`);
    }
  });
}
