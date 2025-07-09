import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalSpan, LocalTracer, getSpanBuffer } from '../../src/otel/localSpan';
import { trace } from '@opentelemetry/api';
import { isLocalTracer } from '../../src/otel/startActiveSpan';

describe('LocalSpan', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create a span with basic attributes', () => {
    const span = new LocalSpan('test-span', 0);
    
    expect(span.isRecording()).toBe(true);
    
    span.setAttribute('key1', 'value1');
    span.setAttributes({ key2: 'value2', key3: 42 });
    span.updateName('updated-span');
    
    expect(span.isRecording()).toBe(true);
    
    span.end();
    
    expect(span.isRecording()).toBe(false);
  });

  it('should record exceptions', () => {
    const span = new LocalSpan('test-span', 0);
    
    const error = new Error('Test error');
    span.recordException(error);
    
    span.recordException('String error');
    
    span.end();
    
    expect(span.isRecording()).toBe(false);
  });

  it('should have a valid span context', () => {
    const span = new LocalSpan('test-span', 0);
    
    const context = span.spanContext();
    
    expect(context.traceId).toBeDefined();
    expect(context.spanId).toBeDefined();
    expect(context.traceFlags).toBe(0);
    expect(context.traceId.length).toBeGreaterThan(0);
    expect(context.spanId.length).toBeGreaterThan(0);
  });

  it('should not modify ended spans', () => {
    const span = new LocalSpan('test-span', 0);
    
    span.end();
    
    // These should not throw but also shouldn't modify the span
    span.setAttribute('key', 'value');
    span.setAttributes({ key: 'value' });
    span.updateName('new-name');
    span.recordException('error');
    
    expect(span.isRecording()).toBe(false);
  });
});

describe('LocalTracer', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create spans', () => {
    const tracer = new LocalTracer();
    
    const span = tracer.startSpan('test-span');
    
    expect(span.isRecording()).toBe(true);
    
    span.end();
    
    expect(span.isRecording()).toBe(false);
  });

  it('should handle startActiveSpan with function only', () => {
    const tracer = new LocalTracer();
    
    const result = tracer.startActiveSpan('test-span', (span) => {
      expect(span.isRecording()).toBe(true);
      span.setAttribute('test', 'value');
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
  });

  it('should handle startActiveSpan with options and function', () => {
    const tracer = new LocalTracer();
    
    const result = tracer.startActiveSpan('test-span', { kind: 1 }, (span) => {
      expect(span.isRecording()).toBe(true);
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
  });

  it('should handle startActiveSpan with options, context, and function', () => {
    const tracer = new LocalTracer();
    
    const result = tracer.startActiveSpan('test-span', { kind: 1 }, {} as any, (span) => {
      expect(span.isRecording()).toBe(true);
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
  });

  it('should handle exceptions in startActiveSpan', () => {
    const tracer = new LocalTracer();
    
    expect(() => {
      tracer.startActiveSpan('test-span', (span) => {
        throw new Error('Test error');
      });
    }).toThrow('Test error');
  });
});

describe('Span Buffer', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should flush spans manually', () => {
    const buffer = getSpanBuffer();
    
    const span = new LocalSpan('test-span', 0);
    span.setAttribute('test', 'value');
    span.end();
    
    // Force flush
    buffer.forceFlush();
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('isLocalTracer type guard', () => {
  it('should return true for LocalTracer instances', () => {
    const localTracer = new LocalTracer();
    
    expect(isLocalTracer(localTracer)).toBe(true);
  });
  
  it('should return false for regular OpenTelemetry tracer', () => {
    const regularTracer = trace.getTracer('test');
    
    expect(isLocalTracer(regularTracer)).toBe(false);
  });
  
  it('should return false for objects that look like tracers but are not LocalTracer', () => {
    const fakeTracer = {
      constructor: { name: 'FakeTracer' },
      startSpan: () => {},
      startActiveSpan: () => {}
    };
    
    expect(isLocalTracer(fakeTracer as any)).toBe(false);
  });
  
  it('should return false for objects without constructor property', () => {
    const objectWithoutConstructor = Object.create(null);
    objectWithoutConstructor.startSpan = () => {};
    
    expect(isLocalTracer(objectWithoutConstructor)).toBe(false);
  });
});
