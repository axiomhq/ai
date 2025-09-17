import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { wrapAISDKModel } from '../../src/otel/vercel';
import { withSpan } from '../../src/otel/withSpan';
import { generateText } from 'aiv4';
import { createMockProvider, mockResponses } from './mock-provider-v1/mock-provider';
import { SpanKind } from '@opentelemetry/api';
import { createOtelTestSetup } from '../helpers/otel-test-setup';

const otelTestSetup = createOtelTestSetup();

beforeAll(() => {
  otelTestSetup.setup();
});

beforeEach(() => {
  otelTestSetup.reset();
});

afterAll(async () => {
  await otelTestSetup.cleanup();
});

describe('span names', () => {
  it('should name the span after the model when wrapped in withSpan', async () => {
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, world!'));
    const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Hello, world!',
      });
    });

    const spans = otelTestSetup.getSpans();
    expect(spans.length).toBe(1);
    expect(spans[0].name).toBe('chat model-name');
  });

  it('should use the INTERNAL kind', async () => {
    // (if the model makes a http call, that would be a child span with CLIENT kind)
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, world!'));
    const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async () => {
      return await generateText({
        model,
        prompt: 'Hello, world!',
      });
    });

    const spans = otelTestSetup.getSpans();
    expect(spans[0].kind).toBe(SpanKind.INTERNAL);
  });

  it('should allow adding attributes in the callback', async () => {
    const mockProvider = createMockProvider();
    mockProvider.addLanguageModelResponse('test', mockResponses.text('Hello, world!'));
    const model = wrapAISDKModel(mockProvider.languageModel('model-name'));

    await withSpan({ capability: 'test-capability', step: 'test-step' }, async (span) => {
      span.setAttribute('foo', 'bar');

      return await generateText({
        model,
        prompt: 'Hello, world!',
      });
    });

    const spans = otelTestSetup.getSpans();
    expect(spans[0].attributes.foo).toBe('bar');
  });
});
