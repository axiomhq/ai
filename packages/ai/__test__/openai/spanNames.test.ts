import {
  describe,
  expect,
  it,
  beforeAll,
  afterEach,
  beforeEach,
  vitest,
} from "vitest";
import { wrapOpenAI } from "../../src/otel/openai";
import OpenAI from "openai";
import { InMemorySpanExporter } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

let memoryExporter: InMemorySpanExporter;
let openai: OpenAI;

beforeAll(() => {
  const tracerProvider = new NodeTracerProvider();
  tracerProvider.register();
});

beforeEach(() => {
  memoryExporter = new InMemorySpanExporter();
  openai = wrapOpenAI(
    new OpenAI({
      apiKey: "test-key",
    })
  );
});

afterEach(() => {
  memoryExporter.reset();
  vitest.clearAllMocks();
});

describe("span names", () => {
  it.skip("creates a span for chat completions", async () => {
    const response = {
      // TODO: we stole this from arize, change
      id: "chatcmpl-8adq9JloOzNZ9TyuzrKyLpGXexh6p",
      object: "chat.completion",
      created: 1703743645,
      model: "gpt-3.5-turbo-0613",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "This is a test.",
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 5,
        total_tokens: 17,
      },
    };

    vitest.spyOn(openai, "post").mockImplementation(
      // @ts-expect-error - mocked response doesn't fully satisfy expected type
      async () => {
        return response;
      }
    );

    await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello" }],
      model: "gpt-4o-2024-11-20",
    });

    const spans = memoryExporter.getFinishedSpans();
    expect(spans.length).toBe(99);
  });
});
