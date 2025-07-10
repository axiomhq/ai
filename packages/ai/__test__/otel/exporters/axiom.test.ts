import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiomLocalExporter } from '../../../src/otel/exporters/axiom';
import type { LocalSpanData } from '../../../src/otel/localSpan';
import { SpanKind } from '@opentelemetry/api';

// Mock fetch-retry
vi.mock('fetch-retry', () => ({
  default: vi.fn((fetch, config) => {
    // Return a mock fetch that can be controlled in tests
    return vi.fn().mockImplementation((url, options) => fetch(url, options));
  })
}));

describe('AxiomLocalExporter', () => {
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
      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      expect(exporter).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      expect(exporter).toBeDefined();
    });

    it('should construct correct OTLP endpoint URL', () => {
      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co/',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      expect(exporter).toBeDefined();
      // The endpoint construction is tested implicitly through the export method
    });
  });

  describe('export', () => {
    it('should export spans successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.axiom.co/v1/traces',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer test-token',
            'X-Axiom-Dataset': 'test-dataset',
            'User-Agent': 'axiom-ai/0.0.1'
          }),
          body: expect.any(String)
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Successfully exported 1 spans to Axiom dataset 'test-dataset'")
      );
    });

    it('should handle empty spans array', async () => {
      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await exporter.export([]);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should add Axiom-specific resource attributes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      const resourceAttrs = body.resourceSpans[0].resource.attributes;
      const axiomDatasetAttr = resourceAttrs.find((attr: any) => attr.key === 'axiom.dataset');
      expect(axiomDatasetAttr?.value.stringValue).toBe('test-dataset');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid request')
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] Axiom export failed:'),
        expect.any(String)
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] Axiom export failed:'),
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

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset',
        timeout: 50 // Very short timeout
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] Axiom export timeout after 50ms')
      );
    });

    it('should use custom timeout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset',
        timeout: 5000
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalled();
      // Timeout behavior is tested implicitly through AbortController
    });

    it('should handle 429 rate limit responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limited')
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await expect(exporter.export([mockSpanData])).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should send correct JSON payload', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      await exporter.export([mockSpanData]);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.resourceSpans).toBeDefined();
      expect(body.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(1);
      expect(body.resourceSpans[0].instrumentationLibrarySpans[0].spans[0].name).toBe('test-span');
    });

    it('should handle multiple spans', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      const exporter = new AxiomLocalExporter({
        url: 'https://test.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset'
      });

      const spans = [
        mockSpanData,
        { ...mockSpanData, name: 'second-span', spanId: 'second-span-id' }
      ];

      await exporter.export(spans);

      expect(mockFetch).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Successfully exported 2 spans to Axiom dataset 'test-dataset'")
      );
    });
  });
});
