import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trace } from '@opentelemetry/api';
import {
  isOtelProviderActive,
  hasActiveSpan,
  hasActiveOtelInstrumentation,
  getOtelDebugInfo,
} from '../../src/otel/detection';

describe('OTel Detection', () => {
  let getTracerProviderSpy: any;
  let getActiveSpy: any;

  beforeEach(() => {
    getTracerProviderSpy = vi.spyOn(trace, 'getTracerProvider');
    getActiveSpy = vi.spyOn(trace, 'getActiveSpan');
  });

  afterEach(() => {
    getTracerProviderSpy.mockRestore();
    getActiveSpy.mockRestore();
  });

  describe('isOtelProviderActive', () => {
    it('should return false for NoopTracerProvider', () => {
      const mockProvider = {
        constructor: { name: 'NoopTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' },
        }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);

      expect(isOtelProviderActive()).toBe(false);
    });

    it('should return false for ProxyTracerProvider', () => {
      const mockProvider = {
        constructor: { name: 'ProxyTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' },
        }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);

      expect(isOtelProviderActive()).toBe(false);
    });

    it('should return true for active provider', () => {
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' },
        }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);

      expect(isOtelProviderActive()).toBe(true);
    });

    it('should return false on error', () => {
      getTracerProviderSpy.mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(isOtelProviderActive()).toBe(false);
    });
  });

  describe('hasActiveSpan', () => {
    it('should return false when no active span', () => {
      getActiveSpy.mockReturnValue(null);

      expect(hasActiveSpan()).toBe(false);
    });

    it('should return false when active span has invalid trace ID', () => {
      const mockSpan = {
        spanContext: () => ({ traceId: '0' }),
      };

      getActiveSpy.mockReturnValue(mockSpan);

      expect(hasActiveSpan()).toBe(false);
    });

    it('should return true when active span exists', () => {
      const mockSpan = {
        spanContext: () => ({ traceId: 'valid-trace-id' }),
      };

      getActiveSpy.mockReturnValue(mockSpan);

      expect(hasActiveSpan()).toBe(true);
    });

    it('should return false on error', () => {
      getActiveSpy.mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(hasActiveSpan()).toBe(false);
    });
  });

  describe('hasActiveOtelInstrumentation', () => {
    it('should return true if provider is active', () => {
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' },
        }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(null);

      expect(hasActiveOtelInstrumentation()).toBe(true);
    });

    it('should return true if active span exists', () => {
      const mockProvider = {
        constructor: { name: 'NoopTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' },
        }),
      };

      const mockSpan = {
        spanContext: () => ({ traceId: 'valid-trace-id' }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(mockSpan);

      expect(hasActiveOtelInstrumentation()).toBe(true);
    });

    it('should return false if neither provider nor span is active', () => {
      const mockProvider = {
        constructor: { name: 'NoopTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' },
        }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(null);

      expect(hasActiveOtelInstrumentation()).toBe(false);
    });
  });

  describe('getOtelDebugInfo', () => {
    it('should return debug information', () => {
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' },
        }),
      };

      const mockSpan = {
        spanContext: () => ({
          traceId: 'test-trace-id',
          spanId: 'test-span-id',
        }),
      };

      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(mockSpan);

      const debugInfo = getOtelDebugInfo();

      expect(debugInfo).toMatchObject({
        hasActiveProvider: true,
        hasActiveSpan: true,
        providerType: 'NodeTracerProvider',
        tracerType: 'Tracer',
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
      });
    });

    it('should handle errors gracefully', () => {
      getTracerProviderSpy.mockImplementation(() => {
        throw new Error('Test error');
      });

      const debugInfo = getOtelDebugInfo();

      expect(debugInfo).toMatchObject({
        hasActiveProvider: false,
        hasActiveSpan: false,
        providerType: 'unknown',
        tracerType: 'unknown',
      });
    });
  });
});
