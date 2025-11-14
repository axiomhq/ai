// @vitest-environment node
// @vitest-pool forks

/**
 * Test showing multiple Eval() calls in one file
 */

import { afterAll, vi } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { ResolvedAxiomConfig } from '../../src/config/index';

// Setup
const fetchCalls: Array<{ url: string; evalName?: string }> = [];
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

global.fetch = vi.fn(async (url: string, _options?: any) => {
  fetchCalls.push({ url: String(url) });
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
console.log = (..._args: any[]) => {
  // Suppress output
};

// Mock instrumentation
vi.doMock('../../src/evals/instrument', async () => {
  const { trace: _trace } = await import('@opentelemetry/api');
  const tracer = tracerProvider.getTracer('axiom-eval-test');
  return {
    ensureInstrumentationInitialized: vi.fn(async () => {}),
    initInstrumentation: vi.fn(async () => {}),
    flush: vi.fn(async () => {
      await tracerProvider.forceFlush();
    }),
    startSpan: vi.fn((name: string, opts: any, ctx?: any) => tracer.startSpan(name, opts, ctx)),
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

vi.doMock('../../src/evals/context/storage', () => ({
  getAxiomConfig: vi.fn(() => mockConfig),
  setAxiomConfig: vi.fn(),
  getConfigScope: vi.fn(() => ({ getAllDefaultFlags: () => ({}) })),
  withEvalContext: vi.fn(async (_opts: any, fn: any) => await fn()),
  getEvalContext: vi.fn(() => ({ flags: {}, outOfScopeFlags: [] })),
}));

vi.doMock('../../src/evals/context/global-flags', () => ({
  getGlobalFlagOverrides: vi.fn(() => ({})),
  setGlobalFlagOverrides: vi.fn(),
}));

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

// Create scorers
const scorer1 = async ({ output: _output }: { output: any }) => ({ score: 1.0 });
Object.defineProperty(scorer1, 'name', { value: 'scorer-1' });

const scorer2 = async ({ output: _output }: { output: any }) => ({ score: 0.8 });
Object.defineProperty(scorer2, 'name', { value: 'scorer-2' });

// ===== FIRST EVAL =====
Eval('First-Eval', {
  data: async () => [{ input: 'input 1', expected: 'expected 1' }],
  task: async ({ input }) => `output for ${input}`,
  scorers: [scorer1 as any],
});

// ===== SECOND EVAL =====
Eval('Second-Eval', {
  data: async () => [
    { input: 'input A', expected: 'expected A' },
    { input: 'input B', expected: 'expected B' },
  ],
  task: async ({ input }) => `result for ${input}`,
  scorers: [scorer2 as any],
});

afterAll(async () => {
  console.log = originalLog;

  const spans = spanExporter.getFinishedSpans();

  console.log('\n=== MULTIPLE EVALS IN ONE FILE ===');
  console.log(`Total fetch calls: ${fetchCalls.length}`);
  console.log(`Total spans: ${spans.length}`);

  const firstEvalSpan = spans.find((s) => s.name.includes('First-Eval'));
  const secondEvalSpan = spans.find((s) => s.name.includes('Second-Eval'));

  if (!firstEvalSpan) throw new Error('Expected First Eval span');
  if (!secondEvalSpan) throw new Error('Expected Second Eval span');

  console.log('✓ Both evals ran');
  console.log(`✓ First Eval: ${firstEvalSpan.name}`);
  console.log(`✓ Second Eval: ${secondEvalSpan.name}`);

  // We should have 3 tests total (1 from First + 2 from Second)
  const caseSpans = spans.filter((s) => s.name.startsWith('case'));
  if (caseSpans.length !== 3) {
    throw new Error(`Expected 2 case spans, got ${caseSpans.length}`);
  }

  console.log(`✓ All 3 test cases ran\n`);

  await tracerProvider.shutdown();
  await spanExporter.shutdown();
});
