import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trace } from '@opentelemetry/api';
import { AxiomAIResources, initAxiomAI } from '../../src/otel/shared';
import { LocalTracer } from '../../src/otel/localSpan';

describe('Three-Mode Detection System', () => {
  let getTracerProviderSpy: any;
  let getActiveSpy: any;
  let mockTracer: any;
  let resources: AxiomAIResources;
  
  beforeEach(() => {
    // Reset singleton
    (AxiomAIResources as any).instance = undefined;
    resources = AxiomAIResources.getInstance();
    
    // Setup spies
    getTracerProviderSpy = vi.spyOn(trace, 'getTracerProvider');
    getActiveSpy = vi.spyOn(trace, 'getActiveSpan');
    
    // Create mock tracer
    mockTracer = {
      startSpan: vi.fn(),
      startActiveSpan: vi.fn(),
    };
  });

  afterEach(() => {
    getTracerProviderSpy.mockRestore();
    getActiveSpy.mockRestore();
  });

  describe('Mode 1: initAxiomAI called with tracer', () => {
    it('should use provided tracer', () => {
      initAxiomAI({ tracer: mockTracer });
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('configured');
      expect(result.tracer).toBe(mockTracer);
    });

    it('should return configured mode even with active OTel', () => {
      // Setup active OTel
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      
      initAxiomAI({ tracer: mockTracer });
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('configured');
      expect(result.tracer).toBe(mockTracer);
    });

    it('should work with null tracer explicitly passed', () => {
      initAxiomAI({ tracer: undefined });
      
      const fallbackTracer = { startSpan: vi.fn() };
      vi.spyOn(trace, 'getTracer').mockReturnValue(fallbackTracer as any);
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('fallback');
      expect(result.tracer).toBe(fallbackTracer);
    });
  });

  describe('Mode 2: initAxiomAI called without tracer', () => {
    it('should use fallback tracer', () => {
      const fallbackTracer = { startSpan: vi.fn() };
      vi.spyOn(trace, 'getTracer').mockReturnValue(fallbackTracer as any);
      
      initAxiomAI();
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('fallback');
      expect(result.tracer).toBe(fallbackTracer);
    });

    it('should call trace.getTracer with correct name', () => {
      const getTracerSpy = vi.spyOn(trace, 'getTracer');
      const fallbackTracer = { startSpan: vi.fn() };
      getTracerSpy.mockReturnValue(fallbackTracer as any);
      
      initAxiomAI();
      
      resources.getTracerWithModeDetection();
      
      expect(getTracerSpy).toHaveBeenCalledWith('@axiomhq/ai');
    });

    it('should work with empty config object', () => {
      const fallbackTracer = { startSpan: vi.fn() };
      vi.spyOn(trace, 'getTracer').mockReturnValue(fallbackTracer as any);
      
      initAxiomAI({});
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('fallback');
      expect(result.tracer).toBe(fallbackTracer);
    });
  });

  describe('Mode 3a: initAxiomAI not called + OTel active', () => {
    it('should throw error when active provider exists', () => {
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(null);
      
      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow('OpenTelemetry instrumentation detected but initAxiomAI was not called');
    });

    it('should throw error when active span exists', () => {
      const mockProvider = {
        constructor: { name: 'NoopTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' }
        })
      };
      const mockSpan = {
        spanContext: () => ({ traceId: 'valid-trace-id' })
      };
      
      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(mockSpan);
      
      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow('OpenTelemetry instrumentation detected but initAxiomAI was not called');
    });

    it('should provide helpful error message', () => {
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      
      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow(/Please call initAxiomAI\(config\) before using AI SDK wrappers/);
    });

    it('should include documentation links in error', () => {
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      
      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow(/Documentation: https:\/\/github\.com\/axiomhq\/ai/);
    });

    it('should throw error for various active provider types', () => {
      const providerTypes = [
        'NodeTracerProvider',
        'WebTracerProvider',
        'BasicTracerProvider',
        'CustomTracerProvider'
      ];
      
      providerTypes.forEach(providerType => {
        const mockProvider = {
          constructor: { name: providerType },
          getTracer: vi.fn().mockReturnValue({
            constructor: { name: 'Tracer' }
          })
        };
        getTracerProviderSpy.mockReturnValue(mockProvider);
        
        expect(() => {
          resources.getTracerWithModeDetection();
        }).toThrow('OpenTelemetry instrumentation detected');
      });
    });
  });

  describe('Mode 3b: initAxiomAI not called + no OTel', () => {
    it('should use local tracer when no OTel instrumentation', () => {
      const mockProvider = {
        constructor: { name: 'NoopTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(null);
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });

    it('should use local tracer when ProxyTracerProvider exists', () => {
      const mockProvider = {
        constructor: { name: 'ProxyTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(null);
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });

    it('should use local tracer when span has invalid trace ID', () => {
      const mockProvider = {
        constructor: { name: 'NoopTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'NoopTracer' }
        })
      };
      const mockSpan = {
        spanContext: () => ({ traceId: '0' })
      };
      
      getTracerProviderSpy.mockReturnValue(mockProvider);
      getActiveSpy.mockReturnValue(mockSpan);
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });

    it('should handle errors in detection gracefully', () => {
      getTracerProviderSpy.mockImplementation(() => {
        throw new Error('Provider error');
      });
      getActiveSpy.mockImplementation(() => {
        throw new Error('Span error');
      });
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('local');
      expect(result.tracer).toBeInstanceOf(LocalTracer);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple calls to initAxiomAI', () => {
      const tracer1 = { startSpan: vi.fn() };
      const tracer2 = { startSpan: vi.fn() };
      
      initAxiomAI({ tracer: tracer1 });
      initAxiomAI({ tracer: tracer2 });
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('configured');
      expect(result.tracer).toBe(tracer2); // Should use the last one
    });

    it('should handle reinitialization after error', () => {
      // First, trigger mode 3a error
      const mockProvider = {
        constructor: { name: 'NodeTracerProvider' },
        getTracer: vi.fn().mockReturnValue({
          constructor: { name: 'Tracer' }
        })
      };
      getTracerProviderSpy.mockReturnValue(mockProvider);
      
      expect(() => {
        resources.getTracerWithModeDetection();
      }).toThrow();
      
      // Now initialize and try again
      initAxiomAI({ tracer: mockTracer });
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('configured');
      expect(result.tracer).toBe(mockTracer);
    });

    it('should handle falsy tracer values', () => {
      const fallbackTracer = { startSpan: vi.fn() };
      vi.spyOn(trace, 'getTracer').mockReturnValue(fallbackTracer as any);
      
      initAxiomAI({ tracer: null as any });
      
      const result = resources.getTracerWithModeDetection();
      
      expect(result.mode).toBe('fallback');
      expect(result.tracer).toBe(fallbackTracer);
    });
  });

  describe('isInitialized flag', () => {
    it('should return false before initialization', () => {
      expect(resources.isInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      initAxiomAI();
      expect(resources.isInitialized()).toBe(true);
    });

    it('should return true even with undefined tracer', () => {
      initAxiomAI({ tracer: undefined });
      expect(resources.isInitialized()).toBe(true);
    });
  });
});
