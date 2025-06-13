import { describe, expect, it, beforeAll } from "vitest";
import { wrapOpenAI } from "./openai";
import OpenAI from "openai";

describe("wrapOpenAI", () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("should wrap the OpenAI client", () => {
    const client = wrapOpenAI(new OpenAI());

    expect(client).toBeDefined();
  });

  it("should have completions", () => {
    const client = wrapOpenAI(new OpenAI());

    expect(client.chat.completions.create).toBeDefined();
  });

  it("should have responses", () => {
    const client = wrapOpenAI(new OpenAI());

    expect(client.responses.create).toBeDefined();
  });
});
