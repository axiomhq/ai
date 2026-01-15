import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineEval } from '../../src/evals/builder';
import * as evalModule from '../../src/evals/eval';

vi.mock('../../src/evals/eval', () => ({
  Eval: vi.fn(),
}));

describe('EvalBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates builder and runs eval', () => {
    const params = {
      data: [{ input: 'test', expected: 'result' }],
      capability: 'test-cap',
      task: async ({ input }: { input: string }) => input.toUpperCase(),
      scorers: [],
    };

    defineEval('test-eval', params).run();

    expect(evalModule.Eval).toHaveBeenCalledWith('test-eval', expect.objectContaining(params));
  });

  it('withTrials sets trials option', () => {
    const params = {
      data: [{ input: 'test', expected: 'result' }],
      capability: 'test-cap',
      task: async ({ input }: { input: string }) => input,
      scorers: [],
    };

    defineEval('trial-eval', params).withTrials(3).run();

    expect(evalModule.Eval).toHaveBeenCalledWith(
      'trial-eval',
      expect.objectContaining({
        ...params,
        trials: 3,
      }),
    );
  });

  it('withTrials can be chained with other methods', () => {
    const params = {
      data: [{ input: 'test', expected: 'result' }],
      capability: 'test-cap',
      task: async ({ input }: { input: string }) => input,
      scorers: [],
    };

    defineEval('chained-eval', params).withTrials(5).withTimeout(10000).run();

    expect(evalModule.Eval).toHaveBeenCalledWith(
      'chained-eval',
      expect.objectContaining({
        trials: 5,
        timeout: 10000,
      }),
    );
  });

  it('run with suffix appends to name', () => {
    const params = {
      data: [{ input: 'test', expected: 'result' }],
      capability: 'test-cap',
      task: async ({ input }: { input: string }) => input,
      scorers: [],
    };

    defineEval('suffix-eval', params).withTrials(2).run('variant-a');

    expect(evalModule.Eval).toHaveBeenCalledWith(
      'suffix-eval:variant-a',
      expect.objectContaining({
        trials: 2,
      }),
    );
  });

  it('throws error when run is called twice', () => {
    const params = {
      data: [{ input: 'test', expected: 'result' }],
      capability: 'test-cap',
      task: async ({ input }: { input: string }) => input,
      scorers: [],
    };

    const builder = defineEval('double-run', params).withTrials(1);
    builder.run();

    expect(() => builder.run()).toThrow('has already been run');
  });
});
