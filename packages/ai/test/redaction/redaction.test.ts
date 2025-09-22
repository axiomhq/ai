import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { trace } from '@opentelemetry/api';
import { wrapLanguageModel, generateText } from 'aiv5';
import { createMockProvider, type MockProvider } from '../vercel/mock-provider-v2/mock-provider-v2';
import { axiomAIMiddleware } from '../../src/otel/middleware';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';
import { withSpan } from '../../src/otel/withSpan';
import { wrapTool } from '../../src/otel/wrapTool';
import { RedactionPolicy } from '../../src/otel/utils/redaction';
import { createOtelTestSetup } from '../helpers/otel-test-setup';

let mockProvider: MockProvider;
const otelTestSetup = createOtelTestSetup();

beforeAll(() => {
  otelTestSetup.setup();
});

beforeEach(() => {
  otelTestSetup.reset();

  mockProvider = createMockProvider();
  mockProvider.addLanguageModelResponse('gpt-4', {
    content: [{ type: 'text', text: 'Hello from test!' }],
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
  });

  resetAxiomAI();
});

afterAll(async () => {
  await otelTestSetup.cleanup();
});

describe('Redaction e2e tests', () => {
  it('RedactionPolicy.AxiomDefault defined in initAxiomAI - should capture all data', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({
      tracer,
      redactionPolicy: RedactionPolicy.AxiomDefault,
    });

    const model = mockProvider.languageModel('gpt-4');
    const instrumentedModel = wrapLanguageModel({
      model,
      middleware: axiomAIMiddleware({ model }),
    });

    await withSpan({ capability: 'test', step: 'test' }, async () => {
      return generateText({
        model: instrumentedModel,
        prompt: 'Test prompt for full capture',
      });
    });

    const spans = otelTestSetup.getSpans();
    const chatSpan = spans.find((s) => s.attributes['gen_ai.operation.name'] === 'chat');

    expect(chatSpan).toBeDefined();

    const inputMessages = chatSpan?.attributes['gen_ai.input.messages'];
    expect(inputMessages).toEqual(
      JSON.stringify([
        { role: 'user', content: [{ type: 'text', text: 'Test prompt for full capture' }] },
      ]),
    );

    const outputMessages = chatSpan?.attributes['gen_ai.output.messages'];
    expect(outputMessages).toEqual(
      JSON.stringify([{ role: 'assistant', content: 'Hello from test!' }]),
    );
  });

  it('RedactionPolicy.OpenTelemetryDefault defined in initAxiomAI - should redact sensitive data', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({
      tracer,
      redactionPolicy: RedactionPolicy.OpenTelemetryDefault,
    });

    const model = mockProvider.languageModel('gpt-4');
    const instrumentedModel = wrapLanguageModel({
      model,
      middleware: axiomAIMiddleware({ model }),
    });

    await withSpan({ capability: 'test', step: 'test' }, async () => {
      return generateText({
        model: instrumentedModel,
        prompt: 'Sensitive prompt to redact',
      });
    });

    const spans = otelTestSetup.getSpans();
    const chatSpan = spans.find((s) => s.attributes['gen_ai.operation.name'] === 'chat');

    expect(chatSpan).toBeDefined();
    // Should have model/usage but NO message content
    expect(chatSpan!.attributes['gen_ai.request.model']).toBe('gpt-4');
    expect(chatSpan!.attributes['gen_ai.usage.input_tokens']).toBe(10);
    expect(chatSpan!.attributes['gen_ai.usage.output_tokens']).toBe(15);

    // Should NOT have input/output messages
    expect(chatSpan!.attributes['gen_ai.input.messages']).toBeUndefined();
    expect(chatSpan!.attributes['gen_ai.output.messages']).toBeUndefined();
  });

  it('RedactionPolicy.AxiomDefault defined in withSpan - should capture all data', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({ tracer });

    const model = mockProvider.languageModel('gpt-4');
    const instrumentedModel = wrapLanguageModel({
      model,
      middleware: axiomAIMiddleware({ model }),
    });

    await withSpan(
      { capability: 'test', step: 'test' },
      async () => {
        return generateText({
          model: instrumentedModel,
          prompt: 'Test prompt for local full capture',
        });
      },
      { redactionPolicy: RedactionPolicy.AxiomDefault },
    );

    const spans = otelTestSetup.getSpans();
    const chatSpan = spans.find((s) => s.attributes['gen_ai.operation.name'] === 'chat');

    expect(chatSpan).toBeDefined();

    const inputMessages = chatSpan?.attributes['gen_ai.input.messages'];
    expect(inputMessages).toEqual(
      JSON.stringify([
        { role: 'user', content: [{ type: 'text', text: 'Test prompt for local full capture' }] },
      ]),
    );

    const outputMessages = chatSpan?.attributes['gen_ai.output.messages'];
    expect(outputMessages).toEqual(
      JSON.stringify([{ role: 'assistant', content: 'Hello from test!' }]),
    );
  });

  it('RedactionPolicy.OpenTelemetryDefault defined in withSpan - should redact sensitive data', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({ tracer });

    const model = mockProvider.languageModel('gpt-4');
    const instrumentedModel = wrapLanguageModel({
      model,
      middleware: axiomAIMiddleware({ model }),
    });

    await withSpan(
      { capability: 'test', step: 'test' },
      async () => {
        return generateText({
          model: instrumentedModel,
          prompt: 'Sensitive local prompt to redact',
        });
      },
      { redactionPolicy: RedactionPolicy.OpenTelemetryDefault },
    );

    const spans = otelTestSetup.getSpans();
    const chatSpan = spans.find((s) => s.attributes['gen_ai.operation.name'] === 'chat');

    expect(chatSpan).toBeDefined();
    // Should have metadata but NO content
    expect(chatSpan!.attributes['gen_ai.request.model']).toBe('gpt-4');
    expect(chatSpan!.attributes['gen_ai.input.messages']).toBeUndefined();
    expect(chatSpan!.attributes['gen_ai.output.messages']).toBeUndefined();
  });

  it('withSpan policy should override global policy', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({
      tracer,
      redactionPolicy: RedactionPolicy.AxiomDefault,
    });

    const model = mockProvider.languageModel('gpt-4');
    const instrumentedModel = wrapLanguageModel({
      model,
      middleware: axiomAIMiddleware({ model }),
    });

    await withSpan(
      { capability: 'test', step: 'test' },
      async () => {
        return generateText({
          model: instrumentedModel,
          prompt: 'This should be redacted despite global policy',
        });
      },
      { redactionPolicy: RedactionPolicy.OpenTelemetryDefault },
    );

    const spans = otelTestSetup.getSpans();
    const chatSpan = spans.find((s) => s.attributes['gen_ai.operation.name'] === 'chat');

    expect(chatSpan).toBeDefined();
    // Despite global AxiomDefault, local override should win
    expect(chatSpan!.attributes['gen_ai.request.model']).toBe('gpt-4');
    expect(chatSpan!.attributes['gen_ai.input.messages']).toBeUndefined();
    expect(chatSpan!.attributes['gen_ai.output.messages']).toBeUndefined();
  });

  it('RedactionPolicy.OpenTelemetryDefault - should not mirror tool payload', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({
      tracer,
      redactionPolicy: RedactionPolicy.OpenTelemetryDefault,
    });

    const mockTool = {
      description: 'Test tool for redaction',
      execute: async (args: any) => ({ result: 'Tool executed with ' + args.input }),
    };

    const wrappedTool = wrapTool('testTool', mockTool);

    await withSpan({ capability: 'test', step: 'test' }, async () => {
      return wrappedTool.execute({ input: 'sensitive data' });
    });

    const spans = otelTestSetup.getSpans();
    const toolSpan = spans.find((s) => s.attributes['gen_ai.tool.name'] === 'testTool');

    expect(toolSpan).toBeDefined();
    expect(toolSpan!.attributes['gen_ai.tool.name']).toBe('testTool');
    expect(toolSpan!.attributes['gen_ai.tool.description']).toBe('Test tool for redaction');
    expect(toolSpan!.attributes['gen_ai.tool.arguments']).toBeUndefined();
    expect(toolSpan!.attributes['gen_ai.tool.message']).toBeUndefined();
  });

  it('RedactionPolicy.AxiomDefault - should mirror tool payload', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({
      tracer,
      redactionPolicy: RedactionPolicy.AxiomDefault,
    });

    const mockTool = {
      description: 'Test tool for mirroring',
      execute: async (args: any) => ({ result: 'Success: ' + args.input }),
    };

    const wrappedTool = wrapTool('mirrorTool', mockTool);

    await withSpan({ capability: 'test', step: 'test' }, async () => {
      return wrappedTool.execute({ input: 'test data' });
    });

    const spans = otelTestSetup.getSpans();
    const toolSpan = spans.find((s) => s.attributes['gen_ai.tool.name'] === 'mirrorTool');

    expect(toolSpan).toBeDefined();
    expect(toolSpan!.attributes['gen_ai.tool.name']).toBe('mirrorTool');
    expect(toolSpan!.attributes['gen_ai.tool.description']).toBe('Test tool for mirroring');
    expect(toolSpan!.attributes['gen_ai.tool.arguments']).toBe(
      JSON.stringify({ input: 'test data' }),
    );
    expect(toolSpan!.attributes['gen_ai.tool.message']).toBe(
      JSON.stringify({ result: 'Success: test data' }),
    );
  });

  it('Custom policy - should capture messages but not mirror tool payload', async () => {
    const tracer = trace.getTracer('test');
    initAxiomAI({
      tracer,
      redactionPolicy: { captureMessageContent: 'full', mirrorToolPayloadOnToolSpan: false },
    });

    const model = mockProvider.languageModel('gpt-4');
    const instrumentedModel = wrapLanguageModel({
      model,
      middleware: axiomAIMiddleware({ model }),
    });

    const mockTool = {
      description: 'Mixed policy tool',
      execute: async (_args: any) => ({ result: 'mixed' }),
    };
    const wrappedTool = wrapTool('mixedTool', mockTool);

    await withSpan({ capability: 'test', step: 'test' }, async () => {
      const aiResult = await generateText({
        model: instrumentedModel,
        prompt: 'Mixed policy test',
      });
      const toolResult = await wrappedTool.execute({});
      return { aiResult, toolResult };
    });

    const spans = otelTestSetup.getSpans();
    const chatSpan = spans.find((s) => s.attributes['gen_ai.operation.name'] === 'chat');
    const toolSpan = spans.find((s) => s.attributes['gen_ai.tool.name'] === 'mixedTool');

    expect(chatSpan).toBeDefined();
    expect(toolSpan).toBeDefined();

    // Chat span should have messages (captureMessageContent: 'full')
    expect(chatSpan!.attributes['gen_ai.input.messages']).toBeDefined();
    expect(chatSpan!.attributes['gen_ai.output.messages']).toBeDefined();

    // Tool span should NOT have payload (mirrorToolPayloadOnToolSpan: false)
    expect(toolSpan!.attributes['gen_ai.tool.arguments']).toBeUndefined();
    expect(toolSpan!.attributes['gen_ai.tool.message']).toBeUndefined();
  });
});
