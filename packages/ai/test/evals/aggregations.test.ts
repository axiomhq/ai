import { describe, it, expect } from 'vitest';
import {
  Mean,
  Median,
  PassAtK,
  PassHatK,
  AtLeastOneTrialPasses,
  AllTrialsPass,
} from '../../src/evals/aggregations';

describe('Mean aggregation', () => {
  it('computes arithmetic mean of scores', () => {
    const agg = Mean();
    expect(agg.type).toBe('mean');
    expect(agg.aggregate([0.8, 0.6, 0.7])).toBeCloseTo(0.7);
  });

  it('handles single score', () => {
    expect(Mean().aggregate([0.5])).toBe(0.5);
  });

  it('handles empty array', () => {
    expect(Mean().aggregate([])).toBe(0);
  });

  it('handles all zeros', () => {
    expect(Mean().aggregate([0, 0, 0])).toBe(0);
  });

  it('handles all ones', () => {
    expect(Mean().aggregate([1, 1, 1])).toBe(1);
  });
});

describe('Median aggregation', () => {
  it('computes median of odd-length array', () => {
    const agg = Median();
    expect(agg.type).toBe('median');
    expect(agg.aggregate([0.3, 0.9, 0.5])).toBe(0.5);
  });

  it('computes median of even-length array', () => {
    expect(Median().aggregate([0.2, 0.4, 0.6, 0.8])).toBe(0.5);
  });

  it('handles single score', () => {
    expect(Median().aggregate([0.7])).toBe(0.7);
  });

  it('handles empty array', () => {
    expect(Median().aggregate([])).toBe(0);
  });

  it('handles unsorted input', () => {
    expect(Median().aggregate([0.9, 0.1, 0.5, 0.3, 0.7])).toBe(0.5);
  });
});

describe('PassAtK aggregation', () => {
  it('returns 1 if any score meets threshold', () => {
    const agg = PassAtK({ threshold: 0.8 });
    expect(agg.type).toBe('pass@k');
    expect(agg.threshold).toBe(0.8);
    expect(agg.aggregate([0.5, 0.9, 0.6])).toBe(1);
  });

  it('returns 0 if no score meets threshold', () => {
    expect(PassAtK({ threshold: 0.8 }).aggregate([0.5, 0.6, 0.7])).toBe(0);
  });

  it('returns 1 if score exactly equals threshold', () => {
    expect(PassAtK({ threshold: 0.8 }).aggregate([0.5, 0.8, 0.6])).toBe(1);
  });

  it('handles single passing score', () => {
    expect(PassAtK({ threshold: 0.5 }).aggregate([0.6])).toBe(1);
  });

  it('handles single failing score', () => {
    expect(PassAtK({ threshold: 0.5 }).aggregate([0.4])).toBe(0);
  });

  it('handles empty array', () => {
    expect(PassAtK({ threshold: 0.5 }).aggregate([])).toBe(0);
  });
});

describe('PassHatK aggregation', () => {
  it('returns 1 if all scores meet threshold', () => {
    const agg = PassHatK({ threshold: 0.9 });
    expect(agg.type).toBe('pass^k');
    expect(agg.threshold).toBe(0.9);
    expect(agg.aggregate([0.95, 0.92, 0.91])).toBe(1);
  });

  it('returns 0 if any score below threshold', () => {
    expect(PassHatK({ threshold: 0.9 }).aggregate([0.95, 0.85, 0.91])).toBe(0);
  });

  it('returns 1 if all scores exactly equal threshold', () => {
    expect(PassHatK({ threshold: 0.9 }).aggregate([0.9, 0.9, 0.9])).toBe(1);
  });

  it('handles single passing score', () => {
    expect(PassHatK({ threshold: 0.5 }).aggregate([0.6])).toBe(1);
  });

  it('handles single failing score', () => {
    expect(PassHatK({ threshold: 0.5 }).aggregate([0.4])).toBe(0);
  });

  it('handles empty array', () => {
    expect(PassHatK({ threshold: 0.5 }).aggregate([])).toBe(1);
  });
});

describe('User-friendly aliases', () => {
  it('AtLeastOneTrialPasses is alias for PassAtK', () => {
    expect(AtLeastOneTrialPasses).toBe(PassAtK);
    const agg = AtLeastOneTrialPasses({ threshold: 0.7 });
    expect(agg.type).toBe('pass@k');
    expect(agg.aggregate([0.5, 0.8])).toBe(1);
  });

  it('AllTrialsPass is alias for PassHatK', () => {
    expect(AllTrialsPass).toBe(PassHatK);
    const agg = AllTrialsPass({ threshold: 0.7 });
    expect(agg.type).toBe('pass^k');
    expect(agg.aggregate([0.8, 0.9])).toBe(1);
  });
});
