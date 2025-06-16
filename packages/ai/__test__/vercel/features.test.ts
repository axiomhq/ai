import { describe, expect, it, beforeAll, beforeEach, afterAll } from "vitest";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { wrapAISDKModel } from "../../src/otel/vercel";
import { withSpan } from "../../src/otel/withSpan";
import { generateText } from "ai";
import {
  createMockProvider,
  mockResponses,
} from "./mock-provider/mock-provider";
import { SpanKind } from "@opentelemetry/api";

let memoryExporter: InMemorySpanExporter;
let tracerProvider: NodeTracerProvider;

beforeAll(() => {
  memoryExporter = new InMemorySpanExporter();
  const spanProcessor = new SimpleSpanProcessor(memoryExporter);
  tracerProvider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  });
  tracerProvider.register();
});

beforeEach(() => {
  memoryExporter.reset();
});

afterAll(async () => {
  await tracerProvider.shutdown();
  await memoryExporter.shutdown();
});

describe("span names", () => {
  it("should name the span after the model when wrapped in withSpan", async () => {
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse(
      "test",
      mockResponses.text("Hello, world!")
    );
    const model = wrapAISDKModel(mockProvider.languageModel("model-name"));

    await withSpan(
      { workflow: "test-workflow", task: "test-task" },
      async () => {
        return await generateText({
          model,
          prompt: "Hello, world!",
        });
      }
    );

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe("chat model-name");
  });

  it("should use the INTERNAL kind", async () => {
    // (if the model makes a http call, that would be a child span with CLIENT kind)
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse(
      "test",
      mockResponses.text("Hello, world!")
    );
    const model = wrapAISDKModel(mockProvider.languageModel("model-name"));

    await withSpan(
      { workflow: "test-workflow", task: "test-task" },
      async () => {
        return await generateText({
          model,
          prompt: "Hello, world!",
        });
      }
    );

    const spans = memoryExporter.getFinishedSpans();
    expect(spans[0].kind).toBe(SpanKind.INTERNAL);
  });

  it("should allow adding attributes in the callback", async () => {
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse(
      "test",
      mockResponses.text("Hello, world!")
    );
    const model = wrapAISDKModel(mockProvider.languageModel("model-name"));

    await withSpan(
      { workflow: "test-workflow", task: "test-task" },
      async (span) => {
        span.setAttribute("foo", "bar");

        return await generateText({
          model,
          prompt: "Hello, world!",
        });
      }
    );

    const spans = memoryExporter.getFinishedSpans();
    expect(spans[0].attributes.foo).toBe("bar");
  });
});
