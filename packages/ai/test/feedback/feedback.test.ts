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
    it('should return numerical feedback with value 1 for thumbs up', () => {
      const result = Feedback.thumb({ name: 'rating', value: 'up' });
      expect(result).toEqual({ kind: 'thumb', name: 'rating', value: 1 });
    });

    it('should return numerical feedback with value -1 for thumbs down', () => {
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
    it('should return numerical feedback with value 1', () => {
      const result = Feedback.thumbUp({ name: 'helpful' });
      expect(result).toEqual({ kind: 'thumb', name: 'helpful', value: 1 });
    });
  });

  describe('thumbDown', () => {
    it('should return numerical feedback with value -1', () => {
      const result = Feedback.thumbDown({ name: 'helpful' });
      expect(result).toEqual({ kind: 'thumb', name: 'helpful', value: -1 });
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

  it('numerical', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.numerical({ name: 'score', value: 42 }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'numerical',
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

  it('event', async () => {
    const client = createFeedbackClient({ token: 'test-token', dataset: 'test-dataset' });
    await client.sendFeedback(
      { traceId: 'trace-123', capability: 'test-cap' },
      Feedback.event({ name: 'clicked' }),
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toEqual({
      event: 'feedback',
      id: expect.any(String),
      kind: 'event',
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

  describe('onError', () => {
    it('should pass error and context on fetch failure', async () => {
      const networkError = new Error('Network error');
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(networkError)),
      );

      const onError = vi.fn();
      const client = createFeedbackClient(
        { token: 'test-token', dataset: 'test-dataset' },
        { onError },
      );

      const links = { traceId: 'trace-123', capability: 'test-cap' };
      const feedback = Feedback.thumbUp({ name: 'rating' });

      await client.sendFeedback(links, feedback);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(networkError, { links, feedback });
    });

    it('should pass error and context on non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() =>
          Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') }),
        ),
      );

      const onError = vi.fn();
      const client = createFeedbackClient(
        { token: 'test-token', dataset: 'test-dataset' },
        { onError },
      );

      const links = { traceId: 'trace-456', capability: 'my-cap', spanId: 'span-789' };
      const feedback = Feedback.numerical({ name: 'score', value: 5 });

      await client.sendFeedback(links, feedback);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        new Error('Failed to send feedback to Axiom: 401 Unauthorized'),
        { links, feedback },
      );
    });
  });
});
