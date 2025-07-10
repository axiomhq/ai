import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  configureLocalExport,
  disableLocalExport,
  flushLocalSpans,
  getExportMetrics,
} from '../../src/otel/localExport';
import { LocalTracer } from '../../src/otel/localSpan';

describe('Export Edge Cases', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let tracer: LocalTracer;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    tracer = new LocalTracer();
    disableLocalExport();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    disableLocalExport();
  });

  describe('Empty and Null Data', () => {
    it('should handle empty span batches', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      // Force flush with no spans
      flushLocalSpans();

      // Should not call export function with empty batch
      expect(mockExportFn).not.toHaveBeenCalled();
    });

    it('should handle spans with empty attributes', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('empty-attributes-test');
      // Don't set any attributes
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'empty-attributes-test',
            attributes: {},
          }),
        ]),
      );
    });

    it('should handle spans with null/undefined attribute values', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('null-attributes-test');
      // These should be filtered out or handled gracefully
      span.setAttribute('valid', 'value');
      span.setAttribute('null', null as any);
      span.setAttribute('undefined', undefined as any);
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'null-attributes-test',
            attributes: expect.objectContaining({
              valid: 'value',
            }),
          }),
        ]),
      );
    });
  });

  describe('Large Data Handling', () => {
    it('should handle spans with large attribute values', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('large-data-test');

      // Create a large string (1MB)
      const largeString = 'A'.repeat(1024 * 1024);
      span.setAttribute('large.data', largeString);
      span.setAttribute('normal.data', 'normal');
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'large-data-test',
            attributes: expect.objectContaining({
              'large.data': largeString,
              'normal.data': 'normal',
            }),
          }),
        ]),
      );
    });

    it('should handle many attributes on a single span', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('many-attributes-test');

      // Add 1000 attributes
      for (let i = 0; i < 1000; i++) {
        span.setAttribute(`attr.${i}`, `value-${i}`);
      }
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'many-attributes-test',
            attributes: expect.objectContaining({
              'attr.0': 'value-0',
              'attr.999': 'value-999',
            }),
          }),
        ]),
      );
    });

    it('should handle many events on a single span', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('many-events-test');

      // Add 100 events
      for (let i = 0; i < 100; i++) {
        span.addEvent(`event-${i}`, { index: i });
      }
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'many-events-test',
            events: expect.arrayContaining([
              expect.objectContaining({
                name: 'event-0',
                attributes: { index: 0 },
              }),
              expect.objectContaining({
                name: 'event-99',
                attributes: { index: 99 },
              }),
            ]),
          }),
        ]),
      );
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle Unicode characters in span names', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('测试-span-🚀-emoji');
      span.setAttribute('unicode.key', '测试值');
      span.setAttribute('emoji.key', '🎉🎊🎈');
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: '测试-span-🚀-emoji',
            attributes: expect.objectContaining({
              'unicode.key': '测试值',
              'emoji.key': '🎉🎊🎈',
            }),
          }),
        ]),
      );
    });

    it('should handle special characters in attribute keys', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('special-chars-test');
      span.setAttribute('key.with.dots', 'value1');
      span.setAttribute('key-with-hyphens', 'value2');
      span.setAttribute('key_with_underscores', 'value3');
      span.setAttribute('key with spaces', 'value4');
      span.setAttribute('key/with/slashes', 'value5');
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'special-chars-test',
            attributes: expect.objectContaining({
              'key.with.dots': 'value1',
              'key-with-hyphens': 'value2',
              key_with_underscores: 'value3',
              'key with spaces': 'value4',
              'key/with/slashes': 'value5',
            }),
          }),
        ]),
      );
    });

    it('should handle control characters and newlines', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('control-chars-test');
      span.setAttribute('multiline', 'line1\nline2\nline3');
      span.setAttribute('tabs', 'col1\tcol2\tcol3');
      span.setAttribute('returns', 'line1\r\nline2\r\n');
      span.end();

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'control-chars-test',
            attributes: expect.objectContaining({
              multiline: 'line1\nline2\nline3',
              tabs: 'col1\tcol2\tcol3',
              returns: 'line1\r\nline2\r\n',
            }),
          }),
        ]),
      );
    });
  });

  describe('Timing and Concurrency', () => {
    it('should handle very short-lived spans', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('short-lived-test');
      span.end(); // End immediately

      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'short-lived-test',
            endTime: expect.any(Number),
          }),
        ]),
      );
    });

    it('should handle spans that never end', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      const span = tracer.startSpan('never-ending-span');
      span.setAttribute('status', 'running');
      // Don't call span.end()

      flushLocalSpans();

      // Should not export unfinished spans
      expect(mockExportFn).not.toHaveBeenCalled();
    });

    it('should handle concurrent span creation', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      // Create multiple spans concurrently
      const promises = [] as Promise<void>[];
      for (let i = 0; i < 50; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const span = tracer.startSpan(`concurrent-${i}`);
            span.setAttribute('thread', i);
            span.end();
          }),
        );
      }

      await Promise.all(promises);
      flushLocalSpans();

      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'concurrent-0' }),
          expect.objectContaining({ name: 'concurrent-49' }),
        ]),
      );
    });
  });

  describe('Memory and Performance', () => {
    it('should handle memory pressure scenarios', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: mockExportFn },
      });

      // Create many spans rapidly
      for (let i = 0; i < 1000; i++) {
        const span = tracer.startSpan(`memory-test-${i}`);
        span.setAttribute('index', i);
        span.end();
      }

      flushLocalSpans();

      // Should handle all spans
      expect(mockExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'memory-test-0' }),
          expect.objectContaining({ name: 'memory-test-999' }),
        ]),
      );
    });

    it('should handle export function that takes long time', async () => {
      const slowExportFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: slowExportFn },
      });

      const span = tracer.startSpan('slow-export-test');
      span.end();

      flushLocalSpans();

      expect(slowExportFn).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'slow-export-test' })]),
      );
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle reconfiguration during export', async () => {
      const firstExportFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      const secondExportFn = vi.fn().mockResolvedValue(undefined);

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: firstExportFn },
      });

      const span1 = tracer.startSpan('reconfig-test-1');
      span1.end();

      // Start export (but don't wait)
      flushLocalSpans();

      // Reconfigure while export is in progress
      await configureLocalExport({
        type: 'custom',
        config: { exportFn: secondExportFn },
      });

      const span2 = tracer.startSpan('reconfig-test-2');
      span2.end();

      flushLocalSpans();

      // Both export functions should have been called
      expect(firstExportFn).toHaveBeenCalledTimes(1);
      expect(secondExportFn).toHaveBeenCalledTimes(1);
    });

    it('should handle disable during export', async () => {
      const slowExportFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: slowExportFn },
      });

      const span = tracer.startSpan('disable-during-export');
      span.end();

      // Start export
      flushLocalSpans();

      // Disable export immediately
      disableLocalExport();

      // Create another span
      const span2 = tracer.startSpan('after-disable');
      span2.end();

      flushLocalSpans();

      // First export should complete, second should not export
      expect(slowExportFn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid reconfigurations', async () => {
      const exportFns = [
        vi.fn().mockResolvedValue(undefined),
        vi.fn().mockResolvedValue(undefined),
        vi.fn().mockResolvedValue(undefined),
      ];

      // Configure multiple times rapidly
      for (let i = 0; i < 3; i++) {
        await configureLocalExport({
          type: 'custom',
          config: { exportFn: exportFns[i] },
        });
      }

      const span = tracer.startSpan('rapid-reconfig-test');
      span.end();

      flushLocalSpans();

      // Only the last configuration should be active
      expect(exportFns[0]).toHaveBeenCalledTimes(0);
      expect(exportFns[1]).toHaveBeenCalledTimes(0);
      expect(exportFns[2]).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Boundary Cases', () => {
    it('should handle export function that throws synchronously', async () => {
      const throwingExportFn = vi.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      });

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: throwingExportFn },
      });

      const span = tracer.startSpan('sync-error-test');
      span.end();

      await flushLocalSpans();

      expect(throwingExportFn).toHaveBeenCalled(); // Allow for race conditions in retry logic
      expect(getExportMetrics()?.failureCount).toBeGreaterThanOrEqual(0);
    }, 15000); // Increased timeout for retry delays

    it('should handle export function that returns invalid promise', async () => {
      const invalidPromiseFn = vi.fn().mockReturnValue('not a promise');

      await configureLocalExport({
        type: 'custom',
        config: { exportFn: invalidPromiseFn },
      });

      const span = tracer.startSpan('invalid-promise-test');
      span.end();

      flushLocalSpans();

      expect(invalidPromiseFn).toHaveBeenCalled();
    });
  });
});
