import { trace, propagation, type Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import { createStartActiveSpan } from './startActiveSpan';
import { currentUnixTime } from '../util/currentUnixTime';
import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions';
import { createGenAISpanName, type GenAIOperation, AxiomAIResources } from './shared';

// 🚨 temporarily commented out some stuff here that involves attributes we're no longer using in the vercel implementation

const WITHSPAN_BAGGAGE_KEY = '__withspan_gen_ai_call';

export function wrapOpenAI<T extends object>(openai: T): T {
  const oai: unknown = openai;
  if (
    oai &&
    typeof oai === 'object' &&
    'chat' in oai &&
    typeof oai.chat === 'object' &&
    oai.chat &&
    'completions' in oai.chat &&
    typeof oai.chat.completions === 'object' &&
    oai.chat.completions &&
    'create' in oai.chat.completions
  ) {
    return new AxiomWrappedOpenAI(oai as any) as unknown as T;
  } else {
    console.warn('Unsupported OpenAI library (potentially v3). Not wrapping.');
    return openai;
  }
}

class AxiomWrappedOpenAI {
  constructor(private client: OpenAI) {}

  private spanName(operation: GenAIOperation, model?: string): string {
    return createGenAISpanName(operation, model);
  }

  private async withSpanHandling<T>(
    operation: (span: Span) => Promise<T>,
    spanName: string,
  ): Promise<T> {
    const { tracer, mode } = AxiomAIResources.getInstance().getTracerWithModeDetection();
    
    // For local spans, skip baggage checking since it doesn't work with local context
    if (mode === 'local') {
      const startActiveSpan = createStartActiveSpan(tracer);
      return startActiveSpan(spanName, null, operation);
    }

    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan = bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === 'true';

    if (isWithinWithSpan) {
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error('Expected active span when within withSpan');
      }
      // Update the span name to be more descriptive
      activeSpan.updateName(spanName);
      return operation(activeSpan);
    } else {
      const startActiveSpan = createStartActiveSpan(tracer);
      return startActiveSpan(spanName, null, operation);
    }
  }

  private setPreCallAttributes(span: Span, options: ChatCompletionCreateParams) {
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
      [Attr.GenAI.Provider]: 'openai',
      [Attr.GenAI.System]: 'openai',
    });

    // Set prompt attributes
    if (messages) {
      // messages.forEach((msg: any) => {
      //   if (msg.role === "system") {
      //     span.setAttribute(Attr.GenAI.Prompt.System, msg.content);
      //   } else if (msg.role === "user") {
      //     span.setAttribute(Attr.GenAI.Prompt.Text, msg.content);
      //   }
      // });
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

  private setPreCallAttributesForResponses(span: Span, options: any) {
    const {
      model,
      input,
      instructions,
      // @ts-expect-error - NOTE: rest has a bunch of other stuff on it!
      ...rest
    } = options;

    // Set request attributes for responses API
    // Note: Both chat completions and responses API use "chat" operation per OpenTelemetry spec
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: model,
      [Attr.GenAI.Provider]: 'openai',
      [Attr.GenAI.System]: 'openai',
    });

    // Set prompt attributes for responses API
    // if (instructions) {
    //   span.setAttribute(Attr.GenAI.Prompt.System, instructions);
    // }
    // if (input) {
    //   span.setAttribute(Attr.GenAI.Prompt.Text, input);
    // }
  }

  private setPostCallAttributes(span: Span, result: ChatCompletion, startTime: number) {
    // Set total request duration
    const endTime = currentUnixTime();
    span.setAttribute('gen_ai.request.duration_ms', endTime - startTime);

    // Set response attributes
    if (result.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.id);
    }
    if (result.model) {
      span.setAttribute(Attr.GenAI.Response.Model, result.model);
    }
    if (result.choices[0]?.finish_reason) {
      // span.setAttribute(
      //   Attr.GenAI.Response.FinishReason,
      //   result.choices[0].finish_reason
      // );
    }

    // Set usage attributes
    if (result.usage) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.prompt_tokens);
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.completion_tokens);
    }

    // Set response text
    if (result.choices[0]?.message?.content) {
      span.setAttribute(Attr.GenAI.Response.Text, result.choices[0].message.content);
    }
  }

  private setPostCallAttributesForResponses(span: Span, result: any, startTime: number) {
    // Set total request duration
    const endTime = currentUnixTime();
    span.setAttribute('gen_ai.request.duration_ms', endTime - startTime);

    // Set response attributes for responses API
    if (result.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.id);
    }
    if (result.model) {
      span.setAttribute(Attr.GenAI.Response.Model, result.model);
    }

    // Set usage attributes if available
    if (result.usage) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.input_tokens || 0);
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.output_tokens || 0);
    }

    // Set response text for responses API
    if (result.output_text) {
      span.setAttribute(Attr.GenAI.Response.Text, result.output_text);
    }
  }

  chat = {
    completions: {
      create: (options: any) => {
        const spanName = this.spanName(Attr.GenAI.Operation.Name_Values.Chat, options.model);
        return this.withSpanHandling(async (span) => {
          this.setPreCallAttributes(span, options);

          const startTime = currentUnixTime();
          const result = await this.client.chat.completions.create(options);

          this.setPostCallAttributes(span, result, startTime);

          return result;
        }, spanName);
      },
    },
  };

  responses = {
    create: (options: any) => {
      const spanName = this.spanName(Attr.GenAI.Operation.Name_Values.Chat, options.model);
      return this.withSpanHandling(async (span) => {
        // Use responses-specific attributes
        this.setPreCallAttributesForResponses(span, options);

        const startTime = currentUnixTime();
        const result = await this.client.responses.create(options);

        this.setPostCallAttributesForResponses(span, result, startTime);

        return result;
      }, spanName);
    },
  };

  // Wrap other OpenAI methods as needed...
}
