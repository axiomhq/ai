import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpanStatusCode } from '@opentelemetry/api';
import { onlineEval } from '../../src/online-evals/onlineEval';
import type { ScorerLike } from '../../src/evals/scorers';

function createTestScorer<TInput = unknown, TOutput = unknown>(
  name: string,
  fn: (args: {
    input?: TInput;
    output: TOutput;
  }) =>
    | { score: number | null; metadata?: Record<string, unknown> }
    | Promise<{ score: number | null; metadata?: Record<string, unknown> }>,
): ScorerLike<TInput, unknown, TOutput> {
  const scorer = fn as ScorerLike<TInput, unknown, TOutput>;
  Object.defineProperty(scorer, 'name', {
    value: name,
    configurable: true,
    enumerable: true,
  });
  return scorer;
}

const mockSpanContext = {
  traceId: 'test-trace-id-00000000000000000',
  spanId: 'parent-span-id-0',
  traceFlags: 1,
};

const mockScorerSpan = {
  setAttributes: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  spanContext: vi.fn(() => ({ traceId: 'test-trace-id', spanId: 'scorer-span-id', traceFlags: 1 })),
};

const mockEvalSpan = {
  setAttributes: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  spanContext: vi.fn(() => ({ traceId: 'test-trace-id', spanId: 'eval-span-id', traceFlags: 1 })),
};

const mockParentSpan = {
  setAttributes: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  spanContext: vi.fn(() => mockSpanContext),
};

const mockTracer = {
  startSpan: vi.fn((_name: string) => mockScorerSpan),
};

vi.mock('../../src/otel/initAxiomAI', () => ({
  getGlobalTracer: vi.fn(() => mockTracer),
}));

vi.mock('@opentelemetry/api', async () => {
  const actual = await vi.importActual('@opentelemetry/api');
  return {
    ...actual,
    trace: {
      setSpan: vi.fn((ctx) => ctx),
      getSpan: vi.fn(() => mockParentSpan),
    },
    context: {
      active: vi.fn(() => ({})),
      with: vi.fn((_ctx, fn) => fn()),
    },
  };
});

describe('onlineEval', () => {
  const baseInput = 'test input';
  const baseOutput = 'test output';

  beforeEach(() => {
    vi.clearAllMocks();
    mockTracer.startSpan.mockImplementation((name: string) => {
      if (name.startsWith('score ')) {
        return mockScorerSpan;
      }
      return mockEvalSpan;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic execution', () => {
    it('does nothing when scorers array is empty', async () => {
      const results = await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [] });

      expect(results).toEqual({});
      expect(mockTracer.startSpan).not.toHaveBeenCalled();
    });

    it('executes a single scorer', async () => {
      const scorer = createTestScorer('test-scorer', async ({ output }) => ({
        score: output === 'test output' ? 1 : 0,
      }));

      await onlineEval(
        { capability: 'qa', step: 'answer' },
        { input: baseInput, output: baseOutput, scorers: [scorer] },
      );

      expect(mockTracer.startSpan).toHaveBeenCalled();
      expect(mockScorerSpan.end).toHaveBeenCalled();
    });

    it('executes multiple scorers in parallel', async () => {
      const scorer1 = createTestScorer('scorer-1', async () => ({ score: 0.8 }));
      const scorer2 = createTestScorer('scorer-2', async () => ({ score: 0.6 }));

      await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer1, scorer2] });

      // eval span + 2 scorer spans
      expect(mockTracer.startSpan).toHaveBeenCalledTimes(3);
    });

    it('accepts precomputed scores', async () => {
      await onlineEval(
        { capability: 'qa' },
        {
          output: baseOutput,
          scorers: [{ name: 'precomputed', score: 0.75, metadata: { decision: 'REDIRECT' } }],
        },
      );

      expect(mockTracer.startSpan).toHaveBeenCalledTimes(2);
      expect(mockScorerSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    });

    it('handles scorer errors gracefully', async () => {
      const failingScorer = createTestScorer('failing-scorer', async () => {
        throw new Error('Scorer failed');
      });

      const results = await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [failingScorer] },
      );

      expect(results['failing-scorer']).toBeDefined();
      expect(results['failing-scorer']?.error).toBe('Scorer failed');
      expect(mockScorerSpan.recordException).toHaveBeenCalled();
      expect(mockScorerSpan.setStatus).toHaveBeenCalledWith(
        expect.objectContaining({ code: SpanStatusCode.ERROR }),
      );
    });

    it('passes input and output to scorer', async () => {
      const receivedArgs: { input?: unknown; output?: unknown }[] = [];

      const scorer = createTestScorer('args-checker', async (args) => {
        receivedArgs.push(args);
        return { score: 1 };
      });

      const customInput = { query: 'hello' };
      const customOutput = { response: 'world' };

      await onlineEval(
        { capability: 'qa' },
        { input: customInput, output: customOutput, scorers: [scorer] },
      );

      expect(receivedArgs).toHaveLength(1);
      expect(receivedArgs[0].input).toEqual({ query: 'hello' });
      expect(receivedArgs[0].output).toEqual({ response: 'world' });
    });
  });

  describe('return value', () => {
    it('returns scorer results keyed by scorer name', async () => {
      const scorer = createTestScorer('test', async () => ({ score: 0.75 }));

      const results = await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [scorer] },
      );

      expect(Object.keys(results)).toEqual(['test']);
      expect(results['test']).toEqual({ name: 'test', score: 0.75 });
    });

    it('returns empty object when no scorers', async () => {
      const results = await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [] });
      expect(results).toEqual({});
    });

    it('returns empty object when all scorers are sampled out', async () => {
      const scorer = createTestScorer('test', async () => ({ score: 1 }));

      const results = await onlineEval(
        { capability: 'qa' },
        {
          output: baseOutput,
          scorers: [{ scorer, sampling: 0 }],
        },
      );

      expect(results).toEqual({});
      expect(mockTracer.startSpan).toHaveBeenCalledTimes(1);
    });

    it('returns named precomputed scores and errors', async () => {
      const results = await onlineEval(
        { capability: 'qa' },
        {
          output: baseOutput,
          scorers: [
            {
              name: 'route-decision',
              score: 0,
              metadata: { decision: 'REDIRECT' },
              error: 'manual-fail',
            },
          ],
        },
      );

      expect(results['route-decision']).toEqual({
        name: 'route-decision',
        score: 0,
        metadata: { decision: 'REDIRECT' },
        error: 'manual-fail',
      });
    });

    it('returns full precomputed scorer results', async () => {
      const results = await onlineEval(
        { capability: 'qa' },
        {
          output: baseOutput,
          scorers: [{ name: 'cached', score: 0.42, metadata: { source: 'cache' } }],
        },
      );

      expect(results['cached']).toEqual({
        name: 'cached',
        score: 0.42,
        metadata: { source: 'cache' },
      });
    });

    it('supports mixing scorer functions and precomputed scores', async () => {
      const scorer = createTestScorer('runtime-scorer', async () => ({ score: 0.9 }));

      const results = await onlineEval(
        { capability: 'qa' },
        {
          output: baseOutput,
          scorers: [scorer, { name: 'precomputed-scorer', score: 0.25 }],
        },
      );

      expect(Object.keys(results).sort()).toEqual(['precomputed-scorer', 'runtime-scorer']);
      expect(results['runtime-scorer']).toEqual({ name: 'runtime-scorer', score: 0.9 });
      expect(results['precomputed-scorer']).toEqual({ name: 'precomputed-scorer', score: 0.25 });
    });
  });

  describe('sampling', () => {
    it('always runs when scorer sampling is not configured', async () => {
      let executed = false;
      const scorer = createTestScorer('test', async () => {
        executed = true;
        return { score: 1 };
      });

      await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer] });
      expect(executed).toBe(true);
    });

    it('always runs when sampling rate is 1.0', async () => {
      let executed = false;
      const scorer = createTestScorer('test', async () => {
        executed = true;
        return { score: 1 };
      });

      await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [{ scorer, sampling: 1.0 }] },
      );
      expect(executed).toBe(true);
    });

    it('never runs when sampling rate is 0', async () => {
      let executed = false;
      const scorer = createTestScorer('test', async () => {
        executed = true;
        return { score: 1 };
      });

      await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [{ scorer, sampling: 0 }] },
      );
      expect(executed).toBe(false);
    });

    it('respects sampling rate probabilistically', async () => {
      let ranCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        let executed = false;
        const scorer = createTestScorer('test', async () => {
          executed = true;
          return { score: 1 };
        });

        await onlineEval(
          { capability: 'qa' },
          { output: baseOutput, scorers: [{ scorer, sampling: 0.5 }] },
        );
        if (executed) ranCount++;
      }

      expect(ranCount).toBeGreaterThan(20);
      expect(ranCount).toBeLessThan(80);
    });

    it('supports async sampling predicates', async () => {
      let executed = false;
      const scorer = createTestScorer('async-sampling', async () => {
        executed = true;
        return { score: 1 };
      });

      await onlineEval(
        { capability: 'qa' },
        {
          input: 'hello',
          output: baseOutput,
          scorers: [
            {
              scorer,
              sampling: async ({ input, output }) => {
                await new Promise((resolve) => setTimeout(resolve, 5));
                return input === 'hello' && output === baseOutput;
              },
            },
          ],
        },
      );

      expect(executed).toBe(true);
    });

    it('captures sampling predicate failures as scorer errors', async () => {
      const scorer = createTestScorer('sampled-failure', async () => ({ score: 1 }));

      const results = await onlineEval(
        { capability: 'qa' },
        {
          output: baseOutput,
          scorers: [
            {
              scorer,
              sampling: async () => {
                throw new Error('Sampling gate failed');
              },
            },
          ],
        },
      );

      expect(results['sampled-failure']?.score).toBeNull();
      expect(results['sampled-failure']?.error).toBe('Sampling gate failed');
    });
  });

  describe('duplicate scorer names', () => {
    it('marks eval span as error and returns empty object for duplicate names', async () => {
      const scorer1 = createTestScorer('duplicate', async () => ({ score: 1 }));
      const scorer2 = createTestScorer('duplicate', async () => ({ score: 0 }));

      const results = await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [scorer1, scorer2] },
      );

      expect(results).toEqual({});
      expect(mockEvalSpan.recordException).toHaveBeenCalled();
      expect(mockEvalSpan.setStatus).toHaveBeenCalledWith(
        expect.objectContaining({ code: SpanStatusCode.ERROR }),
      );
    });
  });

  describe('fire-and-forget behavior', () => {
    it('can be used with void for fire-and-forget', () => {
      const scorer = createTestScorer('async-scorer', async () => {
        return { score: 1 };
      });

      // void usage should not cause type errors or throw
      expect(() => {
        void onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer] });
      }).not.toThrow();
    });

    it('does not throw on errors', async () => {
      const failingScorer = createTestScorer('failing-async', async () => {
        throw new Error('Async failure');
      });

      // Should resolve without throwing
      const results = await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [failingScorer] },
      );

      expect(results['failing-async']).toBeDefined();
      expect(results['failing-async']?.error).toBeDefined();
    });
  });

  describe('span naming', () => {
    it('creates span with capability and step', async () => {
      const scorer = createTestScorer('test', async () => ({ score: 1 }));

      await onlineEval(
        { capability: 'qa', step: 'answer' },
        { output: baseOutput, scorers: [scorer] },
      );

      expect(mockTracer.startSpan).toHaveBeenCalledWith('eval qa/answer', expect.anything());
    });

    it('creates span with capability only when step is omitted', async () => {
      const scorer = createTestScorer('test', async () => ({ score: 1 }));

      await onlineEval({ capability: 'summarization' }, { output: baseOutput, scorers: [scorer] });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('eval summarization', expect.anything());
    });
  });

  describe('span links', () => {
    it('creates eval span with link to active span', async () => {
      const scorer = createTestScorer('test', async () => ({ score: 1 }));

      await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer] });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('eval qa', {
        links: [{ context: mockSpanContext }],
      });
    });

    it('creates eval span with explicit link', async () => {
      const { trace } = await import('@opentelemetry/api');
      const explicitSpanContext = {
        traceId: 'explicit-trace-id-0000000000000',
        spanId: 'explicit-span-0',
        traceFlags: 1,
      };
      const scorer = createTestScorer('test', async () => ({ score: 1 }));

      await onlineEval(
        { capability: 'qa', link: explicitSpanContext },
        { output: baseOutput, scorers: [scorer] },
      );

      // Explicit link takes priority — trace.getSpan should not be called
      expect(trace.getSpan).not.toHaveBeenCalled();
      expect(mockTracer.startSpan).toHaveBeenCalledWith('eval qa', {
        links: [{ context: explicitSpanContext }],
      });
    });

    it('creates eval span without link when no active span', async () => {
      const { trace } = await import('@opentelemetry/api');
      vi.mocked(trace.getSpan).mockReturnValueOnce(undefined);
      const scorer = createTestScorer('test', async () => ({ score: 1 }));

      await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer] });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('eval qa', {});
    });
  });

  describe('scorer metadata', () => {
    it('sets span attributes on successful execution', async () => {
      const scorer = createTestScorer('meta-scorer', async () => ({ score: 0.5 }));

      await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer] });

      expect(mockScorerSpan.setAttributes).toHaveBeenCalled();
      expect(mockScorerSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockScorerSpan.end).toHaveBeenCalled();
    });

    it('records exception on scorer failure', async () => {
      const error = new Error('Test error');
      const scorer = createTestScorer('error-scorer', async () => {
        throw error;
      });

      await onlineEval({ capability: 'qa' }, { output: baseOutput, scorers: [scorer] });

      expect(mockScorerSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockScorerSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test error',
      });
    });
  });

  describe('scorer without name', () => {
    it('uses function name as default', async () => {
      const scorer: ScorerLike = async () => ({ score: 1 });

      const results = await onlineEval(
        { capability: 'qa' },
        { output: baseOutput, scorers: [scorer] },
      );

      expect(Object.keys(results)).toHaveLength(1);
      expect(mockTracer.startSpan).toHaveBeenCalledWith(expect.stringContaining('score'));
    });
  });
});
