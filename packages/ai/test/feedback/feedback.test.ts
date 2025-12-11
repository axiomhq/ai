import { describe, expect, it } from 'vitest';
import { Feedback } from '../../src/feedback';
import { getSuffix } from '../../src/util/feedback';

describe('getSuffix', () => {
  it('should return edge ingest path for edge URLs', () => {
    expect(getSuffix('https://edge.axiom.co', 'my-dataset')).toBe('/v1/ingest/my-dataset');
  });

  it('should return datasets ingest path for non-edge URLs', () => {
    expect(getSuffix('https://api.axiom.co', 'my-dataset')).toBe('/v1/datasets/my-dataset/ingest');
  });

  it('should handle custom URLs without edge', () => {
    expect(getSuffix('https://custom.example.com', 'test')).toBe('/v1/datasets/test/ingest');
  });
});

describe('Feedback helpers', () => {
  describe('thumbs', () => {
    it('should return numerical feedback with value 1 for thumbs up', () => {
      const result = Feedback.thumbs({ name: 'rating', value: 'up' });
      expect(result).toEqual({ kind: 'numerical', name: 'rating', value: 1 });
    });

    it('should return numerical feedback with value -1 for thumbs down', () => {
      const result = Feedback.thumbs({ name: 'rating', value: 'down' });
      expect(result).toEqual({ kind: 'numerical', name: 'rating', value: -1 });
    });

    it('should preserve metadata', () => {
      const result = Feedback.thumbs({ name: 'rating', value: 'up', metadata: { userId: '123' } });
      expect(result).toEqual({
        kind: 'numerical',
        name: 'rating',
        value: 1,
        metadata: { userId: '123' },
      });
    });
  });

  describe('thumbUp', () => {
    it('should return numerical feedback with value 1', () => {
      const result = Feedback.thumbUp({ name: 'helpful' });
      expect(result).toEqual({ kind: 'numerical', name: 'helpful', value: 1 });
    });
  });

  describe('thumbDown', () => {
    it('should return numerical feedback with value -1', () => {
      const result = Feedback.thumbDown({ name: 'helpful' });
      expect(result).toEqual({ kind: 'numerical', name: 'helpful', value: -1 });
    });
  });

  describe('numerical', () => {
    it('should return numerical feedback', () => {
      const result = Feedback.numerical({ name: 'score', value: 42 });
      expect(result).toEqual({ kind: 'numerical', name: 'score', value: 42 });
    });
  });

  describe('bool', () => {
    it('should return boolean feedback', () => {
      const result = Feedback.bool({ name: 'verified', value: true });
      expect(result).toEqual({ kind: 'boolean', name: 'verified', value: true });
    });
  });

  describe('text', () => {
    it('should return text feedback', () => {
      const result = Feedback.text({ name: 'comment', value: 'Great!' });
      expect(result).toEqual({ kind: 'text', name: 'comment', value: 'Great!' });
    });
  });

  describe('event', () => {
    it('should return event feedback', () => {
      const result = Feedback.event({ name: 'clicked' });
      expect(result).toEqual({ kind: 'event', name: 'clicked' });
    });
  });

  describe('enum', () => {
    it('should return text feedback for enum values', () => {
      const result = Feedback.enum({ name: 'category', value: 'bug' });
      expect(result).toEqual({ kind: 'text', name: 'category', value: 'bug' });
    });
  });
});
