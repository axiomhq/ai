import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  configureLocalExport, 
  disableLocalExport, 
  getExportMetrics,
  getCircuitBreakerState,
  resetCircuitBreaker,
  type LocalExportConfig,
  ExportError,
  ExportErrorType
} from '../../src/otel/localExport';
import { getSpanBuffer } from '../../src/otel/localSpan';

describe('Export Error Handling', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    disableLocalExport();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    disableLocalExport();
  });

  describe('Network Error Handling', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('AbortError');
      timeoutError.name = 'AbortError';
      const mockExportFn = vi.fn().mockRejectedValue(timeoutError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('timeout-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Export timeout')
      );
      expect(getExportMetrics()?.failureCount).toBe(1);
    }, 15000);

    it('should handle connection refused errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      const mockExportFn = vi.fn().mockRejectedValue(networkError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('network-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
      expect(getExportMetrics()?.failureCount).toBe(1);
    }, 15000);

    it('should handle DNS resolution errors', async () => {
      const dnsError = new Error('ENOTFOUND');
      const mockExportFn = vi.fn().mockRejectedValue(dnsError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('dns-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    }, 15000);
  });

  describe('HTTP Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      const authError = new Error('401 Unauthorized');
      const mockExportFn = vi.fn().mockRejectedValue(authError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('auth-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Check your authentication credentials')
      );
    });

    it('should handle 429 rate limit errors', async () => {
      const rateLimitError = new Error('429 Too Many Requests');
      const mockExportFn = vi.fn().mockRejectedValue(rateLimitError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('rate-limit-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
    }, 15000);

    it('should handle 500 server errors', async () => {
      const serverError = new Error('500 Internal Server Error');
      const mockExportFn = vi.fn().mockRejectedValue(serverError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('server-error-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Server error')
      );
    }, 15000);
  });

  describe('Retry Logic', () => {
    it('should retry network errors up to max attempts', async () => {
      const networkError = new Error('ECONNREFUSED');
      const mockExportFn = vi.fn().mockRejectedValue(networkError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('retry-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      // Should retry 3 times + initial attempt = 4 total calls
      expect(mockExportFn).toHaveBeenCalledTimes(4);
    }, 15000);

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('401 Unauthorized');
      const mockExportFn = vi.fn().mockRejectedValue(authError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('no-retry-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      // Should not retry auth errors
      expect(mockExportFn).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying on successful attempt', async () => {
      const mockExportFn = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('success-retry-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      // Should stop after successful third attempt
      expect(mockExportFn).toHaveBeenCalledTimes(3);
      expect(getExportMetrics()?.successCount).toBe(1);
    }, 15000);
  });

  describe('Export Metrics', () => {
    it('should track success metrics', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('metrics-success-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      const metrics = getExportMetrics();
      expect(metrics?.successCount).toBe(1);
      expect(metrics?.failureCount).toBe(0);
      expect(metrics?.totalAttempts).toBe(1);
      expect(metrics?.lastSuccessTime).toBeDefined();
    });

    it('should track failure metrics', async () => {
      const mockExportFn = vi.fn().mockRejectedValue(new Error('Test error'));

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('metrics-failure-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      const metrics = getExportMetrics();
      expect(metrics?.successCount).toBe(0);
      expect(metrics?.failureCount).toBe(1);
      expect(metrics?.totalAttempts).toBe(1);
      expect(metrics?.lastFailureTime).toBeDefined();
    }, 15000);

    it('should track failure types', async () => {
      const authError = new Error('401 Unauthorized');
      const mockExportFn = vi.fn().mockRejectedValue(authError);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn }
      });

      const mockSpans = [createMockSpan('failure-types-test')];
      const handlers = getExportHandlers();
      await handlers[handlers.length - 1](mockSpans);

      const metrics = getExportMetrics();
      expect(metrics?.failuresByType.authentication).toBe(1);
      expect(metrics?.failuresByType.network).toBe(0);
    });
  });

  describe('Configuration Validation Edge Cases', () => {
    it('should validate Axiom URL format', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'invalid-url',
          token: 'test-token',
          dataset: 'test-dataset'
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Invalid Axiom URL format');
    });

    it('should validate Axiom token length', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'https://test.axiom.co',
          token: 'short',
          dataset: 'test-dataset'
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Axiom token appears to be too short');
    });

    it('should validate dataset name characters', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'https://test.axiom.co',
          token: 'test-token-123',
          dataset: 'invalid dataset name!'
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Invalid dataset name');
    });

    it('should validate OTLP URL includes trace path', async () => {
      const config: LocalExportConfig = {
        type: 'otlp',
        config: {
          url: 'http://localhost:4318/wrong-path'
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('OTLP URL should include "/v1/traces" path');
    });
  });

  describe('Export Error Types', () => {
    it('should create ExportError with correct properties', () => {
      const error = new ExportError(
        ExportErrorType.NETWORK,
        'Network connection failed',
        true,
        new Error('Original error')
      );

      expect(error.type).toBe(ExportErrorType.NETWORK);
      expect(error.message).toBe('Network connection failed');
      expect(error.retryable).toBe(true);
      expect(error.originalError).toBeDefined();
      expect(error.name).toBe('ExportError');
    });

    it('should handle ExportError instanceof checks', () => {
      const error = new ExportError(
        ExportErrorType.AUTHENTICATION,
        'Auth failed',
        false
      );

      expect(error instanceof ExportError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  // Helper functions
  function createMockSpan(name: string) {
    return {
      name,
      startTime: 1000,
      endTime: 2000,
      attributes: { key: 'value' },
      kind: 0,
      spanId: `span-id-${name}`,
      traceId: `trace-id-${name}`,
      events: [],
      links: [],
      exceptions: []
    };
  }

  function getExportHandlers() {
    const spanBuffer = getSpanBuffer();
    return (spanBuffer as any).flushHandlers;
  }
});
