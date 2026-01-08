import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFeedbackClient, Feedback } from '../../src/feedback';
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
  describe('thumb', () => {
    it('should return number feedback with value 1 for thumbs up', () => {
      const result = Feedback.thumb({ name: 'rating', value: 'up' });
      expect(result).toEqual({ kind: 'thumb', name: 'rating', value: 1 });
    });

    it('should return number feedback with value -1 for thumbs down', () => {
      const result = Feedback.thumb({ name: 'rating', value: 'down' });
      expect(result).toEqual({ kind: 'thumb', name: 'rating', value: -1 });
    });

    it('should preserve metadata', () => {
      const result = Feedback.thumb({ name: 'rating', value: 'up', metadata: { userId: '123' } });
      expect(result).toEqual({
        kind: 'thumb',
        name: 'rating',
        value: 1,
        metadata: { userId: '123' },
      });
    });
  });

  describe('thumbUp', () => {
    it('should return number feedback with value 1', () => {
      const result = Feedback.thumbUp({ name: 'helpful' });
      expect(result).toEqual({ kind: 'thumb', name: 'helpful', value: 1 });
    });
  });

  describe('thumbDown', () => {
    it('should return number feedback with value -1', () => {
      const result = Feedback.thumbDown({ name: 'helpful' });
      expect(result).toEqual({ kind: 'thumb', name: 'helpful', value: -1 });
    });
  });

  describe('number', () => {
    it('should return number feedback', () => {
      const result = Feedback.number({ name: 'score', value: 42 });
      expect(result).toEqual({ kind: 'number', name: 'score', value: 42 });
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

  describe('signal', () => {
    it('should return signal feedback', () => {
      const result = Feedback.signal({ name: 'clicked' });
      expect(result).toEqual({ kind: 'signal', name: 'clicked' });
    });
  });

  describe('enum', () => {
    it('should return text feedback for enum values', () => {
      const result = Feedback.enum({ name: 'category', value: 'bug' });
      expect(result).toEqual({ kind: 'text', name: 'category', value: 'bug' });
    });
  });
});

describe('createFeedbackClient', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('thumbUp', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.thumbUp({ name: 'rating' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',

      id: expect.any(String),
      kind: 'thumb',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'rating',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: 1,
    });
  });

  it('thumbDown', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.thumbDown({ name: 'rating' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'thumb',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'rating',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: -1,
    });
  });

  it('thumb', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.thumb({ name: 'rating', value: 'up' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'thumb',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'rating',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: 1,
    });
  });

  it('number', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.number({ name: 'score', value: 42 }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'number',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'score',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: 42,
    });
  });

  it('bool', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.bool({ name: 'verified', value: true }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'boolean',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'verified',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: true,
    });
  });

  it('text', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.text({ name: 'comment', value: 'Great!' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'text',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'comment',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: 'Great!',
    });
  });

  it('signal', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.signal({ name: 'clicked' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'signal',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'clicked',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
    });
  });

  it('enum', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.enum({ name: 'category', value: 'bug' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'text',
      links: {
        capability: 'test-cap',
        trace_id: 'trace-123',
      },
      name: 'category',
      schemaUrl: 'https://axiom.co/ai/schemas/0.0.2',
      value: 'bug',
    });
  });
});
