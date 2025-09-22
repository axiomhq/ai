import { describe, it, expect } from 'vitest';
import { withEvalContext, withFlagOverrides } from '../../src/evals/context/storage';
import { flag, overrideFlags } from '../../src/context';

describe('EvalContext Overlay Isolation', () => {
  it('should override flags', () => {
    withEvalContext({ initialFlags: { foo: 'bar' } }, () => {
      expect(flag('foo', 'this_will_get_ignored')).toBe('bar');

      // First level override
      overrideFlags({ foo: 'baz' });
      expect(flag('foo', 'this_will_get_ignored')).toBe('baz');

      // Second level override
      overrideFlags({ foo: 'biz' });
      expect(flag('temperature', 1.0)).toBe(1.0); // latest override wins
    });
  });

  it('should isolate flag overrides between parallel operations', async () => {
    const baseContext = { initialFlags: { foo: 'bar' } };

    const [resultA, resultB] = await Promise.all([
      withEvalContext(baseContext, () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            overrideFlags({ foo: 'promise1' });
            resolve(flag('foo', 'this_will_get_ignored'));
          }, 100);
        });
      }),
      withEvalContext(baseContext, () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            overrideFlags({ foo: 'promise2' });
            resolve(flag('foo', 'this_will_get_ignored'));
          }, 1);
        });
      }),
    ]);

    expect(resultA).toBe('promise1');
    expect(resultB).toBe('promise2');
  });

  it('should properly isolate nested contexts with flag inheritance', async () => {
    await withEvalContext({ initialFlags: { temperature: 0.7 } }, () => {
      return new Promise<void>((resolve) => {
        overrideFlags({ temperature: 0.5, model: 'gpt-4' });
        expect(flag('temperature', 0.0)).toBe(0.5);
        expect(flag('model', 'default')).toBe('gpt-4');

        withFlagOverrides({ temperature: 0.1, topP: 0.9 }, () => {
          // Nested context should see inner overrides and inherited values
          expect(flag('temperature', 0.0)).toBe(0.1); // overridden in nested
          expect(flag('model', 'default')).toBe('gpt-4'); // inherited from parent
          expect(flag('topP', 0.5)).toBe(0.9); // new in nested
        });

        // Back to outer context - should not see nested overrides
        expect(flag('temperature', 0.0)).toBe(0.5);
        expect(flag('model', 'default')).toBe('gpt-4');
        expect(flag('topP', 0.5)).toBe(0.5); // default, not nested override

        resolve();
      });
    });
  });

  it('should handle complex concurrent nested operations', async () => {
    const operations = Array.from({ length: 3 }, (_, i) =>
      withEvalContext({ initialFlags: { base: 'shared' } }, () => {
        return new Promise<{ outer: string; inner: string; base: string }>((resolve) => {
          setTimeout(() => {
            overrideFlags({ operationId: `op-${i}` });

            // Nested operation with additional override
            withFlagOverrides({ nestedId: `nested-${i}`, operationId: `inner-${i}` }, () => {
              setTimeout(() => {
                resolve({
                  outer: flag('operationId', 'none'), // Should be inner-{i} due to nested override
                  inner: flag('nestedId', 'none'), // Should be nested-{i}
                  base: flag('base', 'none'), // Should be 'shared' from initial
                });
              }, Math.random() * 30);
            });
          }, Math.random() * 50);
        });
      }),
    );

    const results = await Promise.all(operations);

    results.forEach((result, i) => {
      expect(result.outer).toBe(`inner-${i}`); // Nested override wins
      expect(result.inner).toBe(`nested-${i}`); // Nested-specific value
      expect(result.base).toBe('shared'); // Inherited from initial context
    });
  });

  it('should maintain isolation during async operations with delays', async () => {
    const results = await Promise.all([
      // Operation 1: Long delay, then override
      withEvalContext({ initialFlags: {} }, () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            overrideFlags({ asyncFlag: 'slow' });
            setTimeout(() => {
              resolve(flag('asyncFlag', 'default'));
            }, 30);
          }, 100);
        });
      }),

      // Operation 2: Short delay, different override
      withEvalContext({ initialFlags: {} }, () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            overrideFlags({ asyncFlag: 'fast' });
            resolve(flag('asyncFlag', 'default'));
          }, 20);
        });
      }),

      // Operation 3: No override, should see default
      withEvalContext({ initialFlags: {} }, () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(flag('asyncFlag', 'default'));
          }, 60);
        });
      }),
    ]);

    expect(results[0]).toBe('slow');
    expect(results[1]).toBe('fast');
    expect(results[2]).toBe('default');
  });
});
