import { Tracer, type Span } from "@opentelemetry/api";
import {
  generateText,
  generateObject,
  type Schema,
  type GenerateObjectResult,
} from "ai";
import { type z } from "zod";

import { Attr } from "./otel/semconv/attributes";
import { createStartActiveSpan } from "./otel/startActiveSpan";
import { Pricing } from "./pricing";

type GenerateTextAddlOpts = {
  logPrompt?: boolean;
  logResponse?: boolean;
  additionalAttributes?: Record<string, string>;
};

function attemptToEnrichSpanWithPricing({
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
  const cost = Pricing.calculateCost(inputTokens, outputTokens, model);
  span.setAttribute(Attr.GenAI.Cost.Estimated, cost.toFixed(6));
}

/**
 * Wraps `generateText` with OpenTelemetry tracing.
 * We are not using `experimental_telemetry` because the Vercel SDK uses nonstandard attribute names.
 *
 * NOTE: Tool calls are currently not instrumented. But we also don't have any in the codebase.
 * Ideally we would make a wrapper that puts each tool call on its own span.
 * Talk to me if you need to instrument tool calls -cje
 *
 * @param op - The operation name. Requires the format `workflowName.taskName`
 * @param opts - The option for the `generateText` call. `experimental_telemetry` is removed because we add our own telemetry.
 * @param addlOpts - Additional options.
 * - `logPrompt` - Whether to log the prompt. (default: false)
 * - `logResponse` - Whether to log the response. (default: false)
 * - `additionalAttributes` - Additional attributes to set on the span.
 */
export async function generateTextWithSpan(
  tracer: Tracer, // TODO: Should we create a tracer ourselves or get one from the user?
  // TODO: is this too cute maybe? could also just split it up...
  op: `${string}.${string}`,
  opts: Omit<Parameters<typeof generateText>[0], "experimental_telemetry">,
  addlOpts?: GenerateTextAddlOpts
) {
  const { logPrompt = false, logResponse = false } = addlOpts ?? {};

  const opParts = op.split(".");
  const workflowName = opParts[0];
  const taskName = opParts[1];

  return createStartActiveSpan(tracer)(
    "gen_ai.call_llm",
    null,
    async (span) => {
      if (logPrompt) {
        if (opts.system) {
          span.setAttribute(Attr.GenAI.Prompt.System, opts.system);
        }
        if (opts.prompt) {
          span.setAttribute(
            Attr.GenAI.Prompt.Role,
            Attr.GenAI.Prompt.Role_Values.User
          );
          span.setAttribute(Attr.GenAI.Prompt.Text, opts.prompt);
        } else if (opts.messages) {
          if (typeof opts.messages === "string") {
            span.setAttribute(Attr.GenAI.Prompt.Text, opts.messages);
            span.setAttributes({
              [Attr.GenAI.Prompt.Role]: Attr.GenAI.Prompt.Role_Values.User,
              [Attr.GenAI.Prompt.Text]: opts.messages,
            });
          } else if (opts.messages.length > 0) {
            const last = opts.messages.slice(-1)[0];
            span.setAttributes({
              [Attr.GenAI.Prompt.Role]: last.role,
              [Attr.GenAI.Prompt.Text]:
                typeof last.content === "string"
                  ? last.content
                  : JSON.stringify(last.content),
            });
            if (opts.messages.length > 1) {
              span.setAttribute(
                Attr.GenAI.Prompt.PreviousMessages,
                JSON.stringify(opts.messages.slice(0, -1))
              );
            }
          }
        }
      }

      span.setAttributes({
        [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
        [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
        [Attr.GenAI.Request.Model]: opts.model.modelId,
        ...(opts.maxTokens
          ? { [Attr.GenAI.Request.MaxTokens]: opts.maxTokens }
          : {}),
        [Attr.GenAI.Provider]: opts.model.provider,
        ...(opts.frequencyPenalty
          ? { [Attr.GenAI.Request.FrequencyPenalty]: opts.frequencyPenalty }
          : {}),
        ...(opts.presencePenalty
          ? { [Attr.GenAI.Request.PresencePenalty]: opts.presencePenalty }
          : {}),
        [Attr.GenAI.System]: Attr.GenAI.System_Values.Vercel,
        [Attr.GenAI.Operation.WorkflowName]: workflowName,
        [Attr.GenAI.Operation.TaskName]: taskName,
      });

      if (addlOpts?.additionalAttributes) {
        span.setAttributes(addlOpts.additionalAttributes);
      }

      const completion = await generateText(opts);

      attemptToEnrichSpanWithPricing({
        span,
        model: opts.model.modelId,
        inputTokens: completion.usage.promptTokens,
        outputTokens: completion.usage.completionTokens,
      });

      span.setAttributes({
        [Attr.GenAI.Response.FinishReason]: completion.finishReason,
        [Attr.GenAI.Response.ID]: completion.response.id,
        [Attr.GenAI.Response.Model]: completion.response.modelId,
        [Attr.GenAI.Usage.InputTokens]: completion.usage.promptTokens,
        [Attr.GenAI.Usage.OutputTokens]: completion.usage.completionTokens,
      });

      if (logResponse && completion.text) {
        span.setAttribute(Attr.GenAI.Response.Text, completion.text);
      }

      if (
        completion.providerMetadata &&
        Object.keys(completion.providerMetadata).length > 0
      ) {
        span.setAttribute(
          Attr.GenAI.Response.ProviderMetadata,
          JSON.stringify(completion.providerMetadata)
        );
      }

      return completion;
    }
  );
}

// Define the specific options type for the schema-based generateObject overload
// Based on the typedef provided for generateObject<OBJECT>(options: ...)
interface CoreGenerateObjectOptions<T> {
  model: Parameters<typeof generateObject>[0]["model"];
  schema: z.Schema<T, z.ZodTypeDef, any> | Schema<T>;
  system?: string;
  prompt?: string;
  messages?: Parameters<typeof generateObject>[0]["messages"];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  abortSignal?: AbortSignal;
  schemaName?: string;
  schemaDescription?: string;
  mode?: "auto" | "json" | "tool";
  providerOptions?: Parameters<typeof generateObject>[0]["providerOptions"];
  experimental_providerMetadata?: Parameters<
    typeof generateObject
  >[0]["experimental_providerMetadata"];
  _internal?: {
    generateId?: () => string;
    currentDate?: () => Date;
  };
}

/**
 * Wraps `generateObject` with OpenTelemetry tracing.
 * We are not using `experimental_telemetry` because the Vercel SDK uses nonstandard attribute names.
 *
 * NOTE: Tool calls are currently not instrumented. But we also don't have any in the codebase.
 * Ideally we would make a wrapper that puts each tool call on its own span.
 * Talk to me if you need to instrument tool calls -cje
 *
 * @param op - The operation name. Requires the format `workflowName.taskName`
 * @param opts - The option for the `generateObject` call. `experimental_telemetry` is removed because we add our own telemetry.
 * @param addlOpts - Additional options.
 * - `logPrompt` - Whether to log the prompt. (default: false)
 * - `logResponse` - Whether to log the response. (default: false)
 * - `additionalAttributes` - Additional attributes to set on the span.
 */
export async function generateObjectWithSpan<T>(
  tracer: Tracer, // TODO: Should we create a tracer ourselves or get one from the user?
  // TODO: is this too cute maybe? could also just split it up...
  op: `${string}.${string}`,
  opts: CoreGenerateObjectOptions<T>,
  addlOpts?: GenerateTextAddlOpts
): Promise<GenerateObjectResult<T>> {
  const { logPrompt = false, logResponse = false } = addlOpts ?? {};

  const opParts = op.split(".");
  const workflowName = opParts[0];
  const taskName = opParts[1];

  return createStartActiveSpan(tracer)(
    "gen_ai.call_llm",
    null,
    async (span) => {
      if (logPrompt) {
        if (opts.system) {
          span.setAttribute(Attr.GenAI.Prompt.System, opts.system);
        }
        if (opts.prompt) {
          span.setAttribute(
            Attr.GenAI.Prompt.Role,
            Attr.GenAI.Prompt.Role_Values.User
          );
          span.setAttribute(Attr.GenAI.Prompt.Text, opts.prompt);
        } else if (opts.messages) {
          if (typeof opts.messages === "string") {
            span.setAttribute(Attr.GenAI.Prompt.Text, opts.messages);
            span.setAttributes({
              [Attr.GenAI.Prompt.Role]: Attr.GenAI.Prompt.Role_Values.User,
              [Attr.GenAI.Prompt.Text]: opts.messages,
            });
          } else if (opts.messages.length > 0) {
            const last = opts.messages.slice(-1)[0];
            span.setAttributes({
              [Attr.GenAI.Prompt.Role]: last.role,
              [Attr.GenAI.Prompt.Text]:
                typeof last.content === "string"
                  ? last.content
                  : JSON.stringify(last.content),
            });
            if (opts.messages.length > 1) {
              span.setAttribute(
                Attr.GenAI.Prompt.PreviousMessages,
                JSON.stringify(opts.messages.slice(0, -1))
              );
            }
          }
        }
      }

      span.setAttributes({
        [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
        [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Json, // TODO: @cje - is this correct? it's an object, not json. but that's not an option in semconv...
        [Attr.GenAI.Request.Model]: opts.model.modelId,
        ...(opts.maxTokens
          ? { [Attr.GenAI.Request.MaxTokens]: opts.maxTokens }
          : {}),
        [Attr.GenAI.Provider]: opts.model.provider,
        ...(opts.frequencyPenalty
          ? { [Attr.GenAI.Request.FrequencyPenalty]: opts.frequencyPenalty }
          : {}),
        ...(opts.presencePenalty
          ? { [Attr.GenAI.Request.PresencePenalty]: opts.presencePenalty }
          : {}),
        [Attr.GenAI.System]: Attr.GenAI.System_Values.Vercel,
        [Attr.GenAI.Operation.WorkflowName]: workflowName,
        [Attr.GenAI.Operation.TaskName]: taskName,
      });

      if (addlOpts?.additionalAttributes) {
        span.setAttributes(addlOpts.additionalAttributes);
      }

      const completion = await generateObject<T>(opts);

      attemptToEnrichSpanWithPricing({
        span,
        model: opts.model.modelId,
        inputTokens: completion.usage.promptTokens,
        outputTokens: completion.usage.completionTokens,
      });

      span.setAttributes({
        [Attr.GenAI.Response.FinishReason]: completion.finishReason,
        [Attr.GenAI.Response.ID]: completion.response.id,
        [Attr.GenAI.Response.Model]: completion.response.modelId,
        [Attr.GenAI.Usage.InputTokens]: completion.usage.promptTokens,
        [Attr.GenAI.Usage.OutputTokens]: completion.usage.completionTokens,
      });

      if (logResponse && completion.object) {
        span.setAttribute(
          Attr.GenAI.Response.Text,
          JSON.stringify(completion.object)
        );
      }

      if (
        completion.providerMetadata &&
        Object.keys(completion.providerMetadata).length > 0
      ) {
        span.setAttribute(
          Attr.GenAI.Response.ProviderMetadata,
          JSON.stringify(completion.providerMetadata)
        );
      }

      return completion;
    }
  );
}
