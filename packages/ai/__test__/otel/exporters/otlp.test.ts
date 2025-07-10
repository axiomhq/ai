import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OtlpLocalExporter } from '../../../src/otel/exporters/otlp';
import type { LocalSpanData } from '../../../src/otel/localSpan';
import { SpanKind } from '@opentelemetry/api';

// Mock fetch-retry
vi.mock('fetch-retry', () => ({
  default: vi.fn((fetch, config) => {
    // Return a mock fetch that can be controlled in tests
    return vi.fn().mockImplementation((url, options) => fetch(url, options));
  })
}));

describe('OtlpLocalExporter', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockSpanData: LocalSpanData = {
    name: 'test-span',
    startTime: 1000,
    endTime: 2000,
    attributes: { 'test.attr': 'value' },
    status: { code: 1, message: 'OK' },
    kind: SpanKind.CLIENT,
    parentSpanId: 'parent-span-id',
    spanId: 'test-span-id',
    traceId: 'test-trace-id',
    events: [],
    links: [],
    exceptions: []
  };

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create exporter with required config', () => {
      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      expect(exporter).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      expect(exporter).toBeDefined();
    });

    it('should accept custom headers', () => {
      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces',
        headers: { 'api-key': 'test-key' }
      });

      expect(exporter).toBeDefined();
    });
  });

  describe('export', () => {
    it('should export spans successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4318/v1/traces',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: expect.any(String)
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully exported 1 spans to OTLP endpoint')
      );
    });

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces',
        headers: { 
          'authorization': 'Bearer test-token',
          'x-custom-header': 'custom-value'
        }
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4318/v1/traces',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': 'Bearer test-token',
            'x-custom-header': 'custom-value'
          })
        })
      );
    });

    it('should handle empty spans array', async () => {
      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await exporter.export([]);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send correct OTLP JSON payload', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.resourceSpans).toBeDefined();
      expect(body.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(1);
      expect(body.resourceSpans[0].instrumentationLibrarySpans[0].spans[0].name).toBe('test-span');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] OTLP export failed:'),
        expect.any(String)
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] OTLP export failed:'),
        expect.any(String)
      );
    });

    it('should handle timeout', async () => {
      // Mock a slow response that respects AbortController
      mockFetch.mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              statusText: 'OK'
            });
          }, 100);
          
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new DOMException('Operation was aborted', 'AbortError'));
            });
          }
        });
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces',
        timeout: 50 // Very short timeout
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] OTLP export timeout after 50ms')
      );
    });

    it('should use custom timeout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces',
        timeout: 5000
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalled();
      // Timeout behavior is tested implicitly through AbortController
    });

    it('should handle 5xx server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle multiple spans', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      const spans = [
        mockSpanData,
        { ...mockSpanData, name: 'second-span', spanId: 'second-span-id' }
      ];

      await exporter.export(spans);

      expect(mockFetch).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully exported 2 spans to OTLP endpoint')
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(2);
    });

    it('should work with different OTLP endpoints', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const testUrls = [
        'http://localhost:4318/v1/traces',
        'https://jaeger.example.com/api/traces',
        'https://grafana.example.com/otlp/v1/traces'
      ];

      for (const url of testUrls) {
        const exporter = new OtlpLocalExporter({ url });
        await exporter.export([mockSpanData]);
        
        expect(mockFetch).toHaveBeenCalledWith(
          url,
          expect.objectContaining({
            method: 'POST'
          })
        );
      }
    });

    it('should include resource attributes in OTLP format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await exporter.export([mockSpanData]);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      const resourceAttrs = body.resourceSpans[0].resource.attributes;
      expect(resourceAttrs).toHaveLength(4);
      
      const serviceNameAttr = resourceAttrs.find((attr: any) => attr.key === 'service.name');
      expect(serviceNameAttr?.value.stringValue).toBe('axiom-ai');
      
      const serviceVersionAttr = resourceAttrs.find((attr: any) => attr.key === 'service.version');
      expect(serviceVersionAttr?.value.stringValue).toBe('0.0.1');
    });

    it('should use correct instrumentation library info', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new OtlpLocalExporter({
        url: 'http://localhost:4318/v1/traces'
      });

      await exporter.export([mockSpanData]);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      const instrumentationLibrary = body.resourceSpans[0].instrumentationLibrarySpans[0].instrumentationLibrary;
      expect(instrumentationLibrary.name).toBe('@axiomhq/ai');
      expect(instrumentationLibrary.version).toBe('0.0.1');
    });
  });
});
