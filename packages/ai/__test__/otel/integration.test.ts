import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureLocalExport, disableLocalExport, flushLocalSpans } from '../../src/otel/localExport';
import { LocalTracer } from '../../src/otel/localSpan';

describe('Local Export Integration', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let tracer: LocalTracer;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    tracer = new LocalTracer();
    disableLocalExport();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    disableLocalExport();
  });

  it('should export spans to console in addition to default logging', async () => {
    // Configure console export
    await configureLocalExport({
      type: 'console',
      config: { format: 'compact' }
    });

    // Create a span
    const span = tracer.startSpan('test-span');
    span.setAttribute('test.key', 'test-value');
    span.end();

    // Force flush to trigger export
    flushLocalSpans();

    // Should have both default logging and export logging
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AxiomAI LocalSpans] Flushed 1 spans at')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AxiomAI Export] Console export (1 spans):')
    );
  });

  it('should work with custom export functions', async () => {
    const customExportFn = vi.fn();
    
    await configureLocalExport({
      type: 'custom',
      config: { exportFn: customExportFn }
    });

    // Create a span
    const span = tracer.startSpan('custom-test-span');
    span.setAttribute('custom.key', 'custom-value');
    span.end();

    // Force flush to trigger export
    flushLocalSpans();

    // Should have called custom export function
    expect(customExportFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'custom-test-span',
          attributes: expect.objectContaining({
            'custom.key': 'custom-value'
          })
        })
      ])
    );

    // Should still have default logging
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AxiomAI LocalSpans] Flushed 1 spans at')
    );
  });

  it('should handle multiple spans in batch', async () => {
    const customExportFn = vi.fn();
    
    await configureLocalExport({
      type: 'custom',
      config: { exportFn: customExportFn }
    });

    // Create multiple spans
    for (let i = 0; i < 5; i++) {
      const span = tracer.startSpan(`test-span-${i}`);
      span.setAttribute('span.index', i);
      span.end();
    }

    // Force flush to trigger export
    flushLocalSpans();

    // Should have called custom export function with all spans
    expect(customExportFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'test-span-0' }),
        expect.objectContaining({ name: 'test-span-1' }),
        expect.objectContaining({ name: 'test-span-2' }),
        expect.objectContaining({ name: 'test-span-3' }),
        expect.objectContaining({ name: 'test-span-4' })
      ])
    );

    expect(customExportFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ 
          attributes: expect.objectContaining({ 'span.index': 0 })
        }),
        expect.objectContaining({ 
          attributes: expect.objectContaining({ 'span.index': 1 })
        }),
        expect.objectContaining({ 
          attributes: expect.objectContaining({ 'span.index': 2 })
        }),
        expect.objectContaining({ 
          attributes: expect.objectContaining({ 'span.index': 3 })
        }),
        expect.objectContaining({ 
          attributes: expect.objectContaining({ 'span.index': 4 })
        })
      ])
    );
  });

  it('should continue working after reconfiguration', async () => {
    const firstExportFn = vi.fn();
    const secondExportFn = vi.fn();
    
    // First configuration
    await configureLocalExport({
      type: 'custom',
      config: { exportFn: firstExportFn }
    });

    // Create span with first config
    const span1 = tracer.startSpan('first-span');
    span1.end();
    flushLocalSpans();

    expect(firstExportFn).toHaveBeenCalledTimes(1);
    expect(secondExportFn).toHaveBeenCalledTimes(0);

    // Reconfigure
    await configureLocalExport({
      type: 'custom',
      config: { exportFn: secondExportFn }
    });

    // Create span with second config
    const span2 = tracer.startSpan('second-span');
    span2.end();
    flushLocalSpans();

    expect(firstExportFn).toHaveBeenCalledTimes(1); // Still 1
    expect(secondExportFn).toHaveBeenCalledTimes(1); // Now called
  });

  it('should work with async custom export functions', async () => {
    const asyncExportFn = vi.fn().mockResolvedValue(undefined);
    
    await configureLocalExport({
      type: 'custom',
      config: { exportFn: asyncExportFn }
    });

    // Create a span
    const span = tracer.startSpan('async-test-span');
    span.setAttribute('async.key', 'async-value');
    span.end();

    // Force flush to trigger export
    flushLocalSpans();

    // Should have called async export function
    expect(asyncExportFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'async-test-span',
          attributes: expect.objectContaining({
            'async.key': 'async-value'
          })
        })
      ])
    );
  });

  it('should disable export cleanly', async () => {
    const customExportFn = vi.fn();
    
    await configureLocalExport({
      type: 'custom',
      config: { exportFn: customExportFn }
    });

    // Create span with export enabled
    const span1 = tracer.startSpan('enabled-span');
    span1.end();
    flushLocalSpans();

    expect(customExportFn).toHaveBeenCalledTimes(1);

    // Disable export
    disableLocalExport();

    // Create span with export disabled
    const span2 = tracer.startSpan('disabled-span');
    span2.end();
    flushLocalSpans();

    // Should not have called export function again
    expect(customExportFn).toHaveBeenCalledTimes(1);
    
    // Should still have default logging
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AxiomAI LocalSpans] Flushed 1 spans at')
    );
  });
});
