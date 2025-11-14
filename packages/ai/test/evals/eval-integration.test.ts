// @vitest-environment node
// @vitest-pool forks

/**
 * Integration test for Eval() that captures network calls and spans
 */

import { afterAll, vi } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { ResolvedAxiomConfig } from '../../src/config/index';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';

const fetchCalls: Array<{ url: string; options: any }> = [];
const consoleOutput: string[] = [];
const spanExporter = new InMemorySpanExporter();

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(spanExporter)],
});

const mockConfig: ResolvedAxiomConfig = {
  eval: {
    url: 'https://test.axiom.co',
    token: 'test-token',
    dataset: 'test-dataset',
    instrumentation: null,
    include: [],
    exclude: [],
    timeoutMs: 60_000,
  },
} as ResolvedAxiomConfig;

global.fetch = vi.fn(async (url: string, options?: any) => {
  fetchCalls.push({ url: String(url), options });

  if (url.includes('_apl')) {
    return new Response(JSON.stringify({ matches: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}) as any;

const originalLog = console.log;
console.log = (...args: any[]) => {
  consoleOutput.push(args.map(String).join(' '));
};

vi.doMock('../../src/evals/instrument', async () => {
  const { trace: _trace } = await import('@opentelemetry/api');
  const tracer = tracerProvider.getTracer('axiom-eval-test');

  return {
    ensureInstrumentationInitialized: vi.fn(async () => {}),
    initInstrumentation: vi.fn(async () => {}),
    flush: vi.fn(async () => {
      await tracerProvider.forceFlush();
    }),
    startSpan: vi.fn((name: string, opts: any, ctx?: any) => {
      return tracer.startSpan(name, opts, ctx);
    }),
    startActiveSpan: vi.fn(async (name: string, opts: any, fn: any, ctx?: any) => {
      const span = tracer.startSpan(name, opts, ctx);
      try {
        const result = await fn(span);
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    }),
  };
});

// Mock context storage
vi.doMock('../../src/evals/context/storage', () => ({
  getAxiomConfig: vi.fn(() => mockConfig),
  setAxiomConfig: vi.fn(),
  getConfigScope: vi.fn(() => ({
    getAllDefaultFlags: () => ({}),
  })),
  withEvalContext: vi.fn(async (_opts: any, fn: any) => {
    const result = await fn();
    return result;
  }),
  getEvalContext: vi.fn(() => ({
    flags: {},
    outOfScopeFlags: [],
  })),
}));

// Mock global flags
vi.doMock('../../src/evals/context/global-flags', () => ({
  getGlobalFlagOverrides: vi.fn(() => ({})),
  setGlobalFlagOverrides: vi.fn(),
}));

// Mock vitest inject() to provide context
vi.doMock('vitest', async () => {
  const actual = await vi.importActual('vitest');
  return {
    ...actual,
    inject: vi.fn((key: string) => {
      const context: Record<string, any> = {
        baseline: undefined,
        debug: false,
        list: false,
        overrides: {},
        axiomConfig: mockConfig,
        runId: 'test-run-123',
      };
      return context[key];
    }),
  };
});

const { Eval } = await import('../../src/evals/eval');
const { createScorer: Scorer } = await import('../../src/evals/scorers');

const testScorer = Scorer('test-scorer', async ({ output }: { output: any }) => {
  return {
    score: typeof output === 'string' && output.includes('output') ? 1.0 : 0.0,
  };
});

const scorer1 = Scorer('scorer-1', async ({ output: _output }: { output: any }) => ({
  score: 1.0,
}));

const scorer2 = Scorer('scorer-2', async ({ output: _output }: { output: any }) => ({
  score: 0.8,
}));

Eval('Integration-Test-Eval', {
  data: async () => [
    { input: 'test input 1', expected: 'expected output 1' },
    { input: 'test input 2', expected: 'expected output 2' },
  ],
  task: async ({ input }) => {
    return `output for ${input}`;
  },
  scorers: [testScorer as any],
});

Eval('Second-Eval', {
  data: async () => [{ input: 'input A', expected: 'expected A' }],
  task: async ({ input }) => `output for ${input}`,
  scorers: [scorer1 as any],
});

Eval('Third-Eval', {
  data: async () => [
    { input: 'input X', expected: 'expected X' },
    { input: 'input Y', expected: 'expected Y' },
  ],
  task: async ({ input }) => `result for ${input}`,
  scorers: [scorer2 as any],
});

afterAll(async () => {
  console.log = originalLog;

  const spans: ReadableSpan[] = spanExporter.getFinishedSpans();

  const baselineCall = fetchCalls.find((c) => c.url.includes('_apl'));
  const createCall = fetchCalls.find(
    (c) => c.url.includes('/api/evaluations/v3') && c.options?.method === 'POST',
  );
  const updateCall = fetchCalls.find(
    (c) => c.url.includes('/api/evaluations/v3') && c.options?.method === 'PATCH',
  );

  if (!baselineCall) throw new Error('Expected baseline query call');
  if (!createCall) throw new Error('Expected create evaluation call');
  if (!updateCall) throw new Error('Expected update evaluation call');

  // Assert span structure for Integration-Test-Eval (comprehensive)
  const evalSpan = spans.find((s) => s.name.includes('eval Integration-Test-Eval'));
  const allCaseSpans = spans.filter((s) => s.name.startsWith('case'));
  const integrationCaseSpans = allCaseSpans.slice(0, 2); // First 2 cases are from Integration-Test-Eval
  const taskSpans = spans.filter((s) => s.name === 'task');
  const scorerSpans = spans.filter((s) => s.name.includes('score'));

  if (!evalSpan) throw new Error('Expected eval span');
  if (integrationCaseSpans.length !== 2) {
    throw new Error(
      `Expected 2 Integration-Test-Eval case spans, got ${integrationCaseSpans.length}`,
    );
  }
  if (taskSpans.length < 2) {
    throw new Error(`Expected at least 2 task spans, got ${taskSpans.length}`);
  }
  if (scorerSpans.length < 2) {
    throw new Error(`Expected at least 2 scorer spans, got ${scorerSpans.length}`);
  }

  // Assert span attributes
  const firstCaseSpan = integrationCaseSpans[0];
  const attrs = firstCaseSpan.attributes;

  if (!attrs['eval.case.input']) throw new Error('Expected eval.case.input attribute');
  if (!attrs['eval.case.output']) throw new Error('Expected eval.case.output attribute');
  if (!attrs['eval.case.scores']) throw new Error('Expected eval.case.scores attribute');

  // Assert multiple evals ran (light validation)
  const secondEvalSpan = spans.find((s) => s.name.includes('Second-Eval'));
  const thirdEvalSpan = spans.find((s) => s.name.includes('Third-Eval'));

  if (!secondEvalSpan) throw new Error('Expected Second-Eval span');
  if (!thirdEvalSpan) throw new Error('Expected Third-Eval span');

  // Total case count should be 2 + 1 + 2 = 5
  if (allCaseSpans.length !== 5) {
    throw new Error(`Expected 5 total case spans, got ${allCaseSpans.length}`);
  }

  // Cleanup
  await tracerProvider.shutdown();
  await spanExporter.shutdown();
});
