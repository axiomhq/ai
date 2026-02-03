/**
 * Aggregation functions for combining scores across multiple trials.
 *
 * Aggregators are functions that return a serializable config plus an `aggregate` function.
 * The config is stored on spans for UI display, while the function performs the actual computation.
 */

/**
 * Base type for aggregation configuration.
 * Contains a `type` identifier and an `aggregate` function for computing the final score.
 */
export type Aggregation<T extends string = string> = {
  type: T;
  threshold?: number;
  aggregate: (scores: number[]) => number;
};

/**
 * Computes the arithmetic mean of all trial scores.
 *
 * @example
 * ```typescript
 * Scorer('accuracy', fn, { aggregation: Mean() })
 * // scores [0.8, 0.6, 0.7] => 0.7
 * ```
 */
export const Mean = (): Aggregation<'mean'> => ({
  type: 'mean' as const,
  aggregate: (scores: number[]) =>
    scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length,
});

/**
 * Computes the median of all trial scores.
 *
 * @example
 * ```typescript
 * Scorer('latency', fn, { aggregation: Median() })
 * // scores [0.3, 0.9, 0.5] => 0.5
 * ```
 */
export const Median = (): Aggregation<'median'> => ({
  type: 'median' as const,
  aggregate: (scores: number[]) => {
    if (scores.length === 0) return 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
});

/**
 * Returns 1 if at least one trial score meets or exceeds the threshold, 0 otherwise.
 * Also known as "pass@k" in evaluation literature.
 *
 * @param opts.threshold - The minimum score required for a trial to pass
 *
 * @example
 * ```typescript
 * Scorer('tool-called', fn, { aggregation: PassAtK({ threshold: 0.8 }) })
 * // scores [0.5, 0.9, 0.6] => 1 (0.9 >= 0.8)
 * // scores [0.5, 0.6, 0.7] => 0 (none >= 0.8)
 * ```
 */
export const PassAtK = (opts: { threshold?: number } = {}): Aggregation<'pass@k'> => {
  const threshold = opts.threshold ?? 1;
  return {
    type: 'pass@k' as const,
    threshold,
    aggregate: (scores: number[]) => (scores.some((s) => s >= threshold) ? 1 : 0),
  };
};

/**
 * Returns 1 if all trial scores meet or exceed the threshold, 0 otherwise.
 * Also known as "pass^k" in evaluation literature.
 *
 * @param opts.threshold - The minimum score required for all trials to pass
 *
 * @example
 * ```typescript
 * Scorer('consistency', fn, { aggregation: PassHatK({ threshold: 0.9 }) })
 * // scores [0.95, 0.92, 0.91] => 1 (all >= 0.9)
 * // scores [0.95, 0.85, 0.91] => 0 (0.85 < 0.9)
 * ```
 */
export const PassHatK = (opts: { threshold?: number } = {}): Aggregation<'pass^k'> => {
  const threshold = opts.threshold ?? 1;
  return {
    type: 'pass^k' as const,
    threshold,
    aggregate: (scores: number[]) =>
      scores.length === 0 ? 0 : scores.every((s) => s >= threshold) ? 1 : 0,
  };
};

/**
 * User-friendly alias for PassAtK.
 * Returns 1 if at least one trial passes, 0 otherwise.
 *
 * @example
 * ```typescript
 * Scorer('tool-called', fn, { aggregation: AtLeastOneTrialPasses({ threshold: 0.8 }) })
 * ```
 */
export const AtLeastOneTrialPasses = PassAtK;

/**
 * User-friendly alias for PassHatK.
 * Returns 1 if all trials pass, 0 otherwise.
 *
 * @example
 * ```typescript
 * Scorer('consistency', fn, { aggregation: AllTrialsPass({ threshold: 0.9 }) })
 * ```
 */
export const AllTrialsPass = PassHatK;
