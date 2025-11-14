// @vitest-environment node
// @vitest-pool forks

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { context, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { ResolvedAxiomConfig } from '../../src/config/index';

type Hook = NonNullable<ResolvedAxiomConfig['eval']['instrumentation']>;

interface TestHookOverrides {
  hook?: Hook | null;
  url?: string;
  token?: string | undefined;
  dataset?: string;
  orgId?: string | undefined;
}

const createConfig = (overrides: TestHookOverrides = {}) => {
  const hook: Hook | null | undefined = overrides.hook ?? null;

  return {
    eval: {
      url: overrides.url ?? 'https://example.com',
      token: overrides.token ?? 'token-123',
      dataset: overrides.dataset ?? 'dataset-123',
      orgId: overrides.orgId ?? 'org-123',
      instrumentation: hook,
      include: [],
      exclude: [],
      timeoutMs: 60_000,
    },
  } as ResolvedAxiomConfig;
};

beforeEach(() => {
  (globalThis as any).__SDK_VERSION__ = 'test-version';
});

afterEach(() => {
  trace.disable();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe.sequential('eval instrumentation', () => {
  it('calls instrumentation hook with resolved connection details', async () => {
    const hook = vi.fn(() => ({
      provider: { forceFlush: vi.fn().mockResolvedValue(undefined) } as any,
    }));

    const { initInstrumentation } = await import('../../src/evals/instrument');
    await initInstrumentation({
      enabled: true,
      config: createConfig({ hook }),
    });

    expect(hook).toHaveBeenCalledWith({
      dataset: 'dataset-123',
      token: 'token-123',
      url: 'https://example.com',
      orgId: 'org-123',
    });
  });

  it('flushes user-provided tracer providers', async () => {
    const flushSpy = vi.fn().mockResolvedValue(undefined);
    const hook = vi.fn(() => ({
      provider: { forceFlush: flushSpy } as any,
    }));

    const { initInstrumentation, flush } = await import('../../src/evals/instrument');
    await initInstrumentation({
      enabled: true,
      config: createConfig({ hook }),
    });

    await flush();

    expect(flushSpy).toHaveBeenCalled();
  });

  it('keeps trace context across eval and app spans when user instrumentation is present', async () => {
    const provider = new NodeTracerProvider({
      resource: resourceFromAttributes({ 'service.name': 'app-service' }),
    });
    provider.register();

    const hook = vi.fn(() => ({ provider }));

    const { initInstrumentation, startSpan } = await import('../../src/evals/instrument');

    await initInstrumentation({
      enabled: true,
      config: createConfig({ hook }),
    });

    const evalSpan = startSpan('eval-span', {});
    const appTraceId = await context.with(trace.setSpan(context.active(), evalSpan), async () => {
      const appSpan = trace.getTracer('app-service').startSpan('app-span');
      const traceId = appSpan.spanContext().traceId;
      appSpan.end();
      return traceId;
    });

    expect(appTraceId).toEqual(evalSpan.spanContext().traceId);
    evalSpan.end();

    await provider.shutdown();
  });

  it('creates eval spans with service.name="axiom" and app spans with user service.name', async () => {
    const axiomExporter = new InMemorySpanExporter();
    const appExporter = new InMemorySpanExporter();

    const appProvider = new NodeTracerProvider({
      resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'my-app' }),
      spanProcessors: [new SimpleSpanProcessor(appExporter)],
    });
    appProvider.register();

    const appTracer = appProvider.getTracer('my-app-tracer');
    const hook = vi.fn(() => ({ provider: appProvider, tracer: appTracer }));

    vi.doMock('@opentelemetry/exporter-trace-otlp-http', () => ({
      OTLPTraceExporter: vi.fn(() => axiomExporter),
    }));

    const { initInstrumentation, startSpan, flush } = await import('../../src/evals/instrument');

    await initInstrumentation({
      enabled: true,
      config: createConfig({ hook }),
    });

    const evalSpan = startSpan('eval-span', {});
    const evalTraceId = evalSpan.spanContext().traceId;

    await context.with(trace.setSpan(context.active(), evalSpan), async () => {
      const appSpan = appTracer.startSpan('app-span');
      appSpan.end();
    });

    evalSpan.end();
    await flush();

    const axiomSpans = axiomExporter.getFinishedSpans();
    const appSpans = appExporter.getFinishedSpans();

    const evalSpanExported = axiomSpans.find((s) => s.name === 'eval-span');
    const appSpanExported = appSpans.find((s) => s.name === 'app-span');

    expect(evalSpanExported).toBeDefined();
    expect(appSpanExported).toBeDefined();

    expect(evalSpanExported?.resource.attributes[ATTR_SERVICE_NAME]).toBe('axiom');
    expect(appSpanExported?.resource.attributes[ATTR_SERVICE_NAME]).toBe('my-app');

    expect(evalSpanExported?.spanContext().traceId).toBe(evalTraceId);
    expect(appSpanExported?.spanContext().traceId).toBe(evalTraceId);

    await appProvider.shutdown();
  });

  it('worker process: app spans incorrectly get axiom service name when hook is not restored', async () => {
    const axiomExporter = new InMemorySpanExporter();
    const appExporter = new InMemorySpanExporter();

    const appProvider = new NodeTracerProvider({
      resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'my-worker-app' }),
      spanProcessors: [new SimpleSpanProcessor(appExporter)],
    });
    appProvider.register();

    const userHook: Hook = () => ({
      provider: appProvider,
    });

    vi.doMock('@opentelemetry/exporter-trace-otlp-http', () => ({
      OTLPTraceExporter: vi.fn(() => axiomExporter),
    }));

    vi.doMock('../../src/config/loader', () => ({
      loadConfig: vi.fn(async () => ({
        config: createConfig({ hook: userHook }),
      })),
    }));

    const { initInstrumentation, startSpan, flush } = await import('../../src/evals/instrument');

    await initInstrumentation({
      enabled: true,
      config: createConfig({ hook: null }),
    });

    const evalSpan = startSpan('worker-eval-span', {});

    await context.with(trace.setSpan(context.active(), evalSpan), async () => {
      const appSpan = trace.getTracer('app-tracer').startSpan('app-span');
      appSpan.end();
    });

    evalSpan.end();
    await flush();

    const axiomSpans = axiomExporter.getFinishedSpans();

    const evalSpanExported = axiomSpans.find((s) => s.name === 'worker-eval-span');
    expect(evalSpanExported).toBeDefined();
    expect(evalSpanExported?.resource.attributes[ATTR_SERVICE_NAME]).toBe('axiom');

    const appSpanExported = appExporter.getFinishedSpans().find((s) => s.name === 'app-span');
    expect(appSpanExported).toBeDefined();
    expect(appSpanExported?.resource.attributes[ATTR_SERVICE_NAME]).toBe('my-worker-app');

    await appProvider.shutdown();
  });
});
