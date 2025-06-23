import { createVitest, registerConsoleShortcuts } from "vitest/node";
import { AxiomReporter } from "./reporter";
import { flush, startSpan } from "./instrument";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { Attr } from "../otel/semconv/attributes";

declare module "vitest" {
  export interface ProvidedContext {
    rootSpanId: string;
    traceId: string;
  }
}

const generateRunId = () => {
  return crypto.randomUUID()
}

export const runVitest = async (file: string) => {
  const vi = await createVitest(
    "test",
    {
      // root: process.cwd(),
      mode: "test",
      include: [file ? file : "**/*.eval.ts"],
      reporters: ['verbose', new AxiomReporter()],
      browser: undefined,
    }
  )

  const span = startSpan('gen_ai.eval', {
    attributes: {
      [Attr.GenAI.Operation.Name]: 'eval.run',
      [Attr.Eval.Run.ID]: generateRunId(),
      // TODO: where to get run name, type, iteration and tags?
    }
  })

  vi.provide('rootSpanId', span.spanContext().spanId)
  vi.provide('traceId', span.spanContext().traceId)

  await context.with(trace.setSpan(context.active(), span), async () => {
    try {
      await vi.start();
      span.setStatus({ code: SpanStatusCode.OK })
    } catch (e) {
      span.recordException(e as Error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      console.error(e)
    } finally {
      span.end()
    }
  })

  const dispose = registerConsoleShortcuts(
    vi,
    process.stdin,
    process.stdout
  );

  if (!vi.shouldKeepServer()) {
    dispose()
    await flush()
    await vi.close()
    process.exit(0);
  }

  await flush()
}
