import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Span } from '@opentelemetry/api';
import {
  withSpanHandling,
  createStreamChildSpan,
  classifyToolError,
} from '../../../src/otel/utils/wrapperUtils';
import { Attr } from '../../../src/otel/semconv/attributes';

// Create mock objects first
const mockSpan = {
  setAttribute: vi.fn(),
  setAttributes: vi.fn(),
  updateName: vi.fn(),
  recordException: vi.fn(),
  setStatus: vi.fn(),
  end: vi.fn(),
} as unknown as Span;

const mockChildSpan = {
  setAttribute: vi.fn(),
  setAttributes: vi.fn(),
  updateName: vi.fn(),
  recordException: vi.fn(),
  setStatus: vi.fn(),
  end: vi.fn(),
} as unknown as Span;

const mockTracer = {
  startActiveSpan: vi.fn((_name, _options, fn) => {
    return fn(mockSpan);
  }),
  startSpan: vi.fn(() => mockChildSpan),
};

vi.mock('@opentelemetry/api', async () => {
  const actual = await vi.importActual('@opentelemetry/api');
  return {
    ...actual,
    trace: {
      ...(actual as any).trace,
      getTracerProvider: vi.fn(() => ({
        constructor: { name: 'MockTracerProvider' },
      })),
      getTracer: vi.fn(() => mockTracer),
      getActiveSpan: vi.fn(() => null),
      setSpan: vi.fn(() => mockContext),
    },
    context: {
      active: vi.fn(() => mockContext),
    },
    propagation: {
      getActiveBaggage: vi.fn(() => null),
    },
  };
});

vi.mock('../../../src/otel/initAxiomAI', async () => {
  const actual = await vi.importActual('../../../src/otel/initAxiomAI');
  return {
    ...actual,
    getGlobalTracer: vi.fn(() => mockTracer),
  };
});

const mockContext = {};

describe('wrapperUtils error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console warnings for clean test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('classifyError function integration', () => {
    it('should classify timeout errors correctly', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';

      const operation = vi.fn(async (_span, _context, _lease) => {
        throw timeoutError;
      });

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(timeoutError);
      }

      expect(mockTracer.startActiveSpan).toHaveBeenCalled();
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'timeout');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Message, 'Connection timeout');
    });

    it('should classify network errors correctly', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      const operation = vi.fn().mockRejectedValue(networkError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(networkError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'network');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        Attr.Error.Message,
        'Network request failed',
      );
    });

    it('should classify validation errors correctly', async () => {
      const validationError = new Error('Invalid input provided');
      validationError.name = 'ValidationError';

      const operation = vi.fn().mockRejectedValue(validationError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(validationError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'validation');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        Attr.Error.Message,
        'Invalid input provided',
      );
    });

    it('should classify authentication errors correctly', async () => {
      const authError = new Error('Authentication failed');
      authError.name = 'AuthenticationError';

      const operation = vi.fn().mockRejectedValue(authError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(authError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'authentication');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        Attr.Error.Message,
        'Authentication failed',
      );
    });

    it('should handle AbortError as timeout', async () => {
      const abortError = new Error('Request was aborted');
      abortError.name = 'AbortError';

      const operation = vi.fn().mockRejectedValue(abortError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(abortError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'timeout');
    });

    it('should return unknown for generic custom errors', async () => {
      const customError = new Error('Something went wrong');
      customError.name = 'CustomError';

      const operation = vi.fn().mockRejectedValue(customError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(customError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
    });

    it('should handle unknown error types', async () => {
      const unknownError = new Error('Unknown error');
      unknownError.name = '';

      const operation = vi.fn().mockRejectedValue(unknownError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(unknownError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
    });

    it('should handle non-Error objects', async () => {
      const stringError = 'String error';

      const operation = vi.fn().mockRejectedValue(stringError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(stringError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
      // Should not set error.message for non-Error objects
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith(Attr.Error.Message, expect.anything());
    });

    it('should handle null/undefined errors', async () => {
      const operation = vi.fn().mockRejectedValue(null);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(null);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
    });

    it('should classify parsing errors correctly', async () => {
      const parseError = new Error('JSON parse failed');
      parseError.name = 'ParseError';

      const operation = vi.fn().mockRejectedValue(parseError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(parseError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'parsing');
    });

    it('should classify authorization errors correctly', async () => {
      const authzError = new Error('Permission denied');
      authzError.name = 'PermissionError';

      const operation = vi.fn().mockRejectedValue(authzError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(authzError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'authorization');
    });

    it('should classify rate limit errors correctly', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';

      const operation = vi.fn().mockRejectedValue(rateLimitError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(rateLimitError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'rate_limit');
    });

    it('should classify quota exceeded errors correctly', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaError';

      const operation = vi.fn().mockRejectedValue(quotaError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(quotaError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'quota_exceeded');
    });

    it('should skip generic built-in errors like TypeError', async () => {
      const typeError = new TypeError('Cannot read property');

      const operation = vi.fn().mockRejectedValue(typeError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(typeError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
    });
  });

  describe('HTTP status code extraction', () => {
    it('should extract HTTP status code from Vercel AI SDK errors', async () => {
      const apiError = {
        message: 'API request failed',
        status: 429,
        statusText: 'Too Many Requests',
      };

      const operation = vi.fn().mockRejectedValue(apiError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(apiError);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.HTTP.Response.StatusCode, 429);
    });

    it('should not set HTTP status for errors without status property', async () => {
      const regularError = new Error('Regular error');

      const operation = vi.fn().mockRejectedValue(regularError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(regularError);
      }

      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith(
        Attr.HTTP.Response.StatusCode,
        expect.anything(),
      );
    });
  });

  describe('error message handling', () => {
    it('should not set error.message for empty messages', async () => {
      const errorWithoutMessage = new Error('');

      const operation = vi.fn().mockRejectedValue(errorWithoutMessage);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(errorWithoutMessage);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith(Attr.Error.Message, '');
    });

    it('should set error.message for non-empty messages', async () => {
      const errorWithMessage = new Error('Detailed error message');

      const operation = vi.fn().mockRejectedValue(errorWithMessage);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(errorWithMessage);
      }

      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        Attr.Error.Message,
        'Detailed error message',
      );
    });
  });

  describe('OpenTelemetry standard attributes', () => {
    it('should call recordException and setStatus for standard OTel compliance', async () => {
      const testError = new Error('Test error');

      const operation = vi.fn().mockRejectedValue(testError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(testError);
      }

      // The recordException and setStatus calls happen in startActiveSpan.ts
      // We're testing the integration here - that our callbacks are called
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Message, 'Test error');
    });

    it('should handle recordException for Error objects with proper typing', async () => {
      const testError = new Error('Type-safe error');

      const operation = vi.fn().mockRejectedValue(testError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(testError);
      }

      expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
    });

    it('should handle recordException for non-Error primitives', async () => {
      const stringError = 'primitive error';

      const operation = vi.fn().mockRejectedValue(stringError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(stringError);
      }

      // For primitive errors, recordException is handled in startActiveSpan
      // We verify the error attributes are set correctly
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
      // Should not set error.message for primitives in our current implementation
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith(Attr.Error.Message, expect.anything());
    });
  });

  describe('classifyError function behavior', () => {
    it('should return undefined for unclassifiable errors and fallback to unknown', async () => {
      // Test that classifyError returns undefined but the caller uses 'unknown' as fallback
      const unclassifiableError = new Error('Some random error');
      unclassifiableError.name = 'RandomError'; // Not in our classification list

      const operation = vi.fn().mockRejectedValue(unclassifiableError);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(unclassifiableError);
      }

      // The caller should use 'unknown' as fallback when classifyError returns undefined
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
    });

    it('should return undefined for null errors and fallback to unknown', async () => {
      const operation = vi.fn().mockRejectedValue(null);

      try {
        await withSpanHandling('test-model', operation);
      } catch (err) {
        expect(err).toBe(null);
      }

      // classifyError returns undefined for null, caller should use 'unknown'
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
    });
  });

  describe('stream error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('createStreamChildSpan', () => {
      it('should create a child span with correct attributes', () => {
        createStreamChildSpan(mockSpan, 'chat test-model stream');

        expect(mockTracer.startSpan).toHaveBeenCalledWith(
          'chat test-model stream',
          undefined,
          mockContext,
        );
      });
    });

    describe('classifyToolError', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('should handle Error objects with full error information', () => {
        const testError = new Error('Stream processing failed');
        testError.name = 'NetworkError';

        classifyToolError(testError, mockChildSpan);

        expect(mockChildSpan.recordException).toHaveBeenCalledWith(testError);
        expect(mockChildSpan.setStatus).toHaveBeenCalledWith({
          code: 2, // SpanStatusCode.ERROR
          message: 'Stream processing failed',
        });
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'network');
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(
          Attr.Error.Message,
          'Stream processing failed',
        );
      });

      it('should handle primitive errors', () => {
        const stringError = 'Stream failed with string error';

        classifyToolError(stringError, mockChildSpan);

        expect(mockChildSpan.recordException).toHaveBeenCalledWith({
          message: 'Stream failed with string error',
          name: 'UnknownError',
        });
        expect(mockChildSpan.setStatus).toHaveBeenCalledWith({
          code: 2, // SpanStatusCode.ERROR
          message: 'Stream failed with string error',
        });
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
        expect(mockChildSpan.setAttribute).not.toHaveBeenCalledWith(
          Attr.Error.Message,
          expect.anything(),
        );
      });

      it('should classify stream timeout errors correctly', () => {
        const timeoutError = new Error('Stream timeout');
        timeoutError.name = 'TimeoutError';

        classifyToolError(timeoutError, mockChildSpan);

        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'timeout');
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(
          Attr.Error.Message,
          'Stream timeout',
        );
      });

      it('should handle stream errors with HTTP status codes', () => {
        const apiError = {
          message: 'Stream API error',
          name: 'NetworkError',
          status: 503,
        };

        classifyToolError(apiError, mockChildSpan);

        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'network');
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.HTTP.Response.StatusCode, 503);
      });

      it('should handle parsing errors in stream chunks', () => {
        const parseError = new Error('Invalid JSON in stream chunk');
        parseError.name = 'ParseError';

        classifyToolError(parseError, mockChildSpan);

        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'parsing');
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(
          Attr.Error.Message,
          'Invalid JSON in stream chunk',
        );
      });

      it('should handle validation errors during stream processing', () => {
        const validationError = new Error('Invalid stream chunk format');
        validationError.name = 'ValidationError';

        classifyToolError(validationError, mockChildSpan);

        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'validation');
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(
          Attr.Error.Message,
          'Invalid stream chunk format',
        );
      });

      it('should not set error.message for empty messages', () => {
        const errorWithoutMessage = new Error('');
        errorWithoutMessage.name = 'TestError';

        classifyToolError(errorWithoutMessage, mockChildSpan);

        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
        expect(mockChildSpan.setAttribute).not.toHaveBeenCalledWith(Attr.Error.Message, '');
      });
    });

    describe('stream error lifecycle', () => {
      it('should properly end child span on error', () => {
        const childSpan = createStreamChildSpan(mockSpan, 'chat test-model stream');
        const streamError = new Error('Stream interrupted');

        classifyToolError(streamError, childSpan);
        childSpan.end();

        expect(mockChildSpan.end).toHaveBeenCalled();
        expect(mockChildSpan.setAttribute).toHaveBeenCalledWith(Attr.Error.Type, 'unknown');
      });
    });
  });
});
