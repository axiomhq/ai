import { trace, propagation, type Span } from "@opentelemetry/api";
import { Attr } from "./semconv/attributes";
import { createStartActiveSpan } from "./startActiveSpan";
import { currentUnixTime } from "../util/currentUnixTime";
import { _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing } from "src/pricing";
import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";

const WITHSPAN_BAGGAGE_KEY = "__withspan_gen_ai_call";

export function wrapOpenAI(client: OpenAI): OpenAI {
  return new AxiomWrappedOpenAI(client) as unknown as OpenAI;
}

class AxiomWrappedOpenAI {
  constructor(private client: OpenAI) {}

  private async withSpanHandling<T>(
    operation: (span: Span) => Promise<T>
  ): Promise<T> {
    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan =
      bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === "true";

    if (isWithinWithSpan) {
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error("Expected active span when within withSpan");
      }
      return operation(activeSpan);
    } else {
      const tracer = trace.getTracer("@axiomhq/ai");
      const startActiveSpan = createStartActiveSpan(tracer);
      return startActiveSpan("gen_ai.call_llm", null, operation);
    }
  }

  private setPreCallAttributes(
    span: Span,
    options: ChatCompletionCreateParams
  ) {
    const {
      model,
      messages,
      max_tokens,
      frequency_penalty,
      presence_penalty,
      temperature,
      top_p,
      n: _n,
      stream: _stream,
      stop,
      response_format,
      // @ts-expect-error - NOTE: rest has a bunch of other stuff on it!
      ...rest
    } = options;

    // Set request attributes
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: model,
      [Attr.GenAI.Provider]: "openai",
      [Attr.GenAI.System]: "openai",
    });

    // Set prompt attributes
    if (messages) {
      messages.forEach((msg: any) => {
        if (msg.role === "system") {
          span.setAttribute(Attr.GenAI.Prompt.System, msg.content);
        } else if (msg.role === "user") {
          span.setAttribute(Attr.GenAI.Prompt.Text, msg.content);
        }
      });
    }

    // Set optional request attributes
    if (max_tokens !== undefined && max_tokens !== null) {
      span.setAttribute(Attr.GenAI.Request.MaxTokens, max_tokens);
    }
    if (frequency_penalty !== undefined && frequency_penalty !== null) {
      span.setAttribute(Attr.GenAI.Request.FrequencyPenalty, frequency_penalty);
    }
    if (presence_penalty !== undefined && presence_penalty !== null) {
      span.setAttribute(Attr.GenAI.Request.PresencePenalty, presence_penalty);
    }
    if (temperature !== undefined && temperature !== null) {
      span.setAttribute(Attr.GenAI.Request.Temperature, temperature);
    }
    if (top_p !== undefined && top_p !== null) {
      span.setAttribute(Attr.GenAI.Request.TopP, top_p);
    }
    if (stop) {
      span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(stop));
    }
    if (response_format) {
      span.setAttribute(Attr.GenAI.Output.Type, response_format.type);
    }
  }

  private setPostCallAttributes(
    span: Span,
    result: ChatCompletion,
    startTime: number
  ) {
    const bag = propagation.getActiveBaggage();

    // Set total request duration
    const endTime = currentUnixTime();
    span.setAttribute("gen_ai.request.duration_ms", endTime - startTime);

    // Set response attributes
    if (result.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.id);
    }
    if (result.model) {
      span.setAttribute(Attr.GenAI.Response.Model, result.model);
    }
    if (result.choices[0]?.finish_reason) {
      span.setAttribute(
        Attr.GenAI.Response.FinishReason,
        result.choices[0].finish_reason
      );
    }

    // Set usage attributes
    if (result.usage) {
      span.setAttribute(
        Attr.GenAI.Usage.InputTokens,
        result.usage.prompt_tokens
      );
      span.setAttribute(
        Attr.GenAI.Usage.OutputTokens,
        result.usage.completion_tokens
      );

      // Check for experimental pricing estimation
      const shouldEstimatePricing =
        bag?.getEntry(
          "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing"
        )?.value === "true";
      if (shouldEstimatePricing) {
        _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing.calculateCost(
          result.usage.prompt_tokens,
          result.usage.completion_tokens,
          result.model
        );
      }
    }

    // Set response text
    if (result.choices[0]?.message?.content) {
      span.setAttribute(
        Attr.GenAI.Response.Text,
        result.choices[0].message.content
      );
    }
  }

  chat = {
    completions: {
      create: (options: any) => {
        return this.withSpanHandling(async (span) => {
          this.setPreCallAttributes(span, options);

          const startTime = currentUnixTime();
          const result = await this.client.chat.completions.create(options);

          this.setPostCallAttributes(span, result, startTime);

          return result;
        });
      },
    },
  };

  // Wrap other OpenAI methods as needed...
}
