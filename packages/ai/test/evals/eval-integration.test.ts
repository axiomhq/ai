// @vitest-environment node
// @vitest-pool forks

/**
 * Integration test for Eval() that captures network calls, spans, and console output.
 *
 * IMPORTANT: Eval() must be called at the MODULE TOP-LEVEL, not inside it() blocks,
 * because it calls describe() to create vitest suites dynamically.
 */

import { afterAll, vi } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { ResolvedAxiomConfig } from '../../src/config/index';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';

// ===== SETUP: Capture side effects =====

const fetchCalls: Array<{ url: string; options: any }> = [];
const consoleOutput: string[] = [];
const spanExporter = new InMemorySpanExporter();

// Setup OTel tracer provider with in-memory exporter
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

// Mock fetch to capture network calls
global.fetch = vi.fn(async (url: string, options?: any) => {
  fetchCalls.push({ url: String(url), options });

  // Return empty baseline response for APL queries
  if (url.includes('_apl')) {
    return new Response(JSON.stringify({ matches: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return success for evaluation API calls
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}) as any;

// Mock console.log to capture output
const originalLog = console.log;
console.log = (...args: any[]) => {
  consoleOutput.push(args.map(String).join(' '));
};

// Mock the instrumentation module to use our test provider
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

// ===== CALL Eval() AT TOP LEVEL =====

const { Eval } = await import('../../src/evals/eval');

// Create scorer function with name property
const testScorer = async ({ output }: { output: any }) => {
  return {
    score: typeof output === 'string' && output.includes('output') ? 1.0 : 0.0,
  };
};
Object.defineProperty(testScorer, 'name', { value: 'test-scorer' });

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

// ===== ASSERTIONS: Run after all tests complete =====

afterAll(async () => {
  // Restore console
  console.log = originalLog;

  // Get all captured data
  const spans: ReadableSpan[] = spanExporter.getFinishedSpans();

  // Assert network calls
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

  // Assert span structure
  const evalSpan = spans.find((s) => s.name.includes('eval Integration-Test-Eval'));
  const caseSpans = spans.filter((s) => s.name.startsWith('case'));
  const taskSpans = spans.filter((s) => s.name === 'task');
  const scorerSpans = spans.filter((s) => s.name.includes('score'));

  if (!evalSpan) throw new Error('Expected eval span');
  if (caseSpans.length !== 2) throw new Error(`Expected 2 case spans, got ${caseSpans.length}`);
  if (taskSpans.length !== 2) throw new Error(`Expected 2 task spans, got ${taskSpans.length}`);
  if (scorerSpans.length !== 2) {
    throw new Error(`Expected 2 scorer spans, got ${scorerSpans.length}`);
  }

  // Assert span attributes
  const firstCaseSpan = caseSpans[0];
  const attrs = firstCaseSpan.attributes;

  if (!attrs['eval.case.input']) throw new Error('Expected eval.case.input attribute');
  if (!attrs['eval.case.output']) throw new Error('Expected eval.case.output attribute');
  if (!attrs['eval.case.scores']) throw new Error('Expected eval.case.scores attribute');

  // Cleanup
  await tracerProvider.shutdown();
  await spanExporter.shutdown();
});
