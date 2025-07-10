import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  configureLocalExport, 
  disableLocalExport, 
  getLocalExportStatus, 
  flushLocalSpans,
  type LocalExportConfig,
  type AxiomConfig,
  type OtlpConfig,
  type ConsoleConfig,
  type CustomConfig 
} from '../../src/otel/localExport';
import { getSpanBuffer } from '../../src/otel/localSpan';

describe('localExport', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    disableLocalExport();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    disableLocalExport();
  });

  describe('configureLocalExport', () => {
    it('should configure axiom export with valid config', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'https://test.axiom.co',
          token: 'test-token',
          dataset: 'test-dataset'
        }
      };

      await configureLocalExport(config);
      expect(getLocalExportStatus()).toBe('axiom');
    });

    it('should configure otlp export with valid config', async () => {
      const config: LocalExportConfig = {
        type: 'otlp',
        config: {
          url: 'http://localhost:4318/v1/traces',
          headers: { 'api-key': 'test' }
        }
      };

      await configureLocalExport(config);
      expect(getLocalExportStatus()).toBe('otlp');
    });

    it('should configure console export with valid config', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: {
          format: 'json',
          includeAttributes: true
        }
      };

      await configureLocalExport(config);
      expect(getLocalExportStatus()).toBe('console');
    });

    it('should configure custom export with valid config', async () => {
      const mockExportFn = vi.fn();
      const config: LocalExportConfig = {
        type: 'custom',
        config: {
          exportFn: mockExportFn
        }
      };

      await configureLocalExport(config);
      expect(getLocalExportStatus()).toBe('custom');
    });

    it('should throw error for invalid axiom config', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: '',
          token: 'test-token',
          dataset: 'test-dataset'
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Axiom URL is required');
    });

    it('should throw error for invalid otlp config', async () => {
      const config: LocalExportConfig = {
        type: 'otlp',
        config: {
          url: ''
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('OTLP URL is required');
    });

    it('should throw error for invalid console config', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: {
          format: 'invalid' as any
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Console format must be "json" or "compact"');
    });

    it('should throw error for invalid custom config', async () => {
      const config: LocalExportConfig = {
        type: 'custom',
        config: {
          exportFn: 'not-a-function' as any
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Custom export function must be a function');
    });

    it('should validate timeout ranges', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'https://test.axiom.co',
          token: 'test-token',
          dataset: 'test-dataset',
          timeout: 100000 // Too high
        }
      };

      await expect(configureLocalExport(config)).rejects.toThrow('Axiom timeout must be between 1000ms and 60000ms (1-60 seconds)');
    });
  });

  describe('disableLocalExport', () => {
    it('should disable export and reset status', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: { format: 'compact' }
      };

      await configureLocalExport(config);
      expect(getLocalExportStatus()).toBe('console');

      disableLocalExport();
      expect(getLocalExportStatus()).toBe('none');
    });
  });

  describe('getLocalExportStatus', () => {
    it('should return none when no export configured', () => {
      expect(getLocalExportStatus()).toBe('none');
    });

    it('should return correct status for each export type', async () => {
      const configs: LocalExportConfig[] = [
        { type: 'axiom', config: { url: 'https://test.axiom.co', token: 'test-token-123', dataset: 'test-dataset' } },
        { type: 'otlp', config: { url: 'http://localhost:4318/v1/traces' } },
        { type: 'console', config: {} },
        { type: 'custom', config: { exportFn: () => {} } }
      ];

      for (const config of configs) {
        await configureLocalExport(config);
        expect(getLocalExportStatus()).toBe(config.type);
      }
    });
  });

  describe('flushLocalSpans', () => {
    it('should call forceFlush on span buffer', () => {
      const spanBuffer = getSpanBuffer();
      const flushSpy = vi.spyOn(spanBuffer, 'forceFlush');

      flushLocalSpans();
      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('console export functionality', () => {
    it('should output spans in compact format', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: { format: 'compact' }
      };

      await configureLocalExport(config);
      
      // Create a mock span data
      const mockSpans = [{
        name: 'test-span',
        startTime: 1000,
        endTime: 2000,
        attributes: { key: 'value' },
        kind: 0,
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
        events: [],
        links: [],
        exceptions: []
      }];

      // Manually call the export to test console output
      const spanBuffer = getSpanBuffer();
      const handlers = (spanBuffer as any).flushHandlers;
      expect(handlers.length).toBeGreaterThan(1); // Should have default + export handler

      // Trigger export handler
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] Console export (1 spans):')
      );
    });

    it('should output spans in json format', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: { format: 'json' }
      };

      await configureLocalExport(config);
      
      // Create a mock span data
      const mockSpans = [{
        name: 'test-span',
        startTime: 1000,
        endTime: 2000,
        attributes: { key: 'value' },
        kind: 0,
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
        events: [],
        links: [],
        exceptions: []
      }];

      // Manually call the export to test console output
      const spanBuffer = getSpanBuffer();
      const handlers = (spanBuffer as any).flushHandlers;
      
      // Trigger export handler
      await handlers[handlers.length - 1](mockSpans);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export] Console export (1 spans):')
      );
    });
  });

  describe('custom export functionality', () => {
    it('should call custom export function', async () => {
      const mockExportFn = vi.fn();
      const config: LocalExportConfig = {
        type: 'custom',
        config: { exportFn: mockExportFn }
      };

      await configureLocalExport(config);
      
      // Create a mock span data
      const mockSpans = [{
        name: 'test-span',
        startTime: 1000,
        endTime: 2000,
        attributes: { key: 'value' },
        kind: 0,
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
        events: [],
        links: [],
        exceptions: []
      }];

      // Manually call the export to test custom function
      const spanBuffer = getSpanBuffer();
      const handlers = (spanBuffer as any).flushHandlers;
      
      // Trigger export handler
      await handlers[handlers.length - 1](mockSpans);

      expect(mockExportFn).toHaveBeenCalledWith(mockSpans);
    });

    it('should handle async custom export function', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);
      const config: LocalExportConfig = {
        type: 'custom',
        config: { exportFn: mockExportFn }
      };

      await configureLocalExport(config);
      
      // Create a mock span data
      const mockSpans = [{
        name: 'test-span',
        startTime: 1000,
        endTime: 2000,
        attributes: { key: 'value' },
        kind: 0,
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
        events: [],
        links: [],
        exceptions: []
      }];

      // Manually call the export to test custom function
      const spanBuffer = getSpanBuffer();
      const handlers = (spanBuffer as any).flushHandlers;
      
      // Trigger export handler
      await handlers[handlers.length - 1](mockSpans);

      expect(mockExportFn).toHaveBeenCalledWith(mockSpans);
    });
  });

  describe('error handling', () => {
    it('should handle export errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockExportFn = vi.fn().mockRejectedValue(new Error('Export failed'));
      
      const config: LocalExportConfig = {
        type: 'custom',
        config: { exportFn: mockExportFn }
      };

      await configureLocalExport(config);
      
      // Create a mock span data
      const mockSpans = [{
        name: 'test-span',
        startTime: 1000,
        endTime: 2000,
        attributes: { key: 'value' },
        kind: 0,
        spanId: 'test-span-id',
        traceId: 'test-trace-id',
        events: [],
        links: [],
        exceptions: []
      }];

      // Manually call the export to test error handling
      const spanBuffer = getSpanBuffer();
      const handlers = (spanBuffer as any).flushHandlers;
      
      // Trigger export handler and wait for it to complete
      await handlers[handlers.length - 1](mockSpans);

      // The mockExportFn should have been called with retry logic
      expect(mockExportFn).toHaveBeenCalledWith(mockSpans);
      
      // Should have error logs from the ExportManager
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AxiomAI Export]')
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to export 1 spans')
      );
      
      errorSpy.mockRestore();
    }, 10000); // Increase timeout to account for retry logic
  });
});
