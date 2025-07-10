import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  configureLocalExport, 
  disableLocalExport, 
  getExportMetrics, 
  getCircuitBreakerState, 
  resetCircuitBreaker,
  getExportDebugInfo,
  ExportError,
  ExportErrorType,
  type LocalExportConfig 
} from '../../src/otel/localExport';
import { getOtelDebugInfo } from '../../src/otel/detection';

describe('Export System Enhancements', () => {
  beforeEach(() => {
    disableLocalExport();
  });

  afterEach(() => {
    disableLocalExport();
  });

  describe('Export Error Handling', () => {
    it('should create ExportError with correct properties', () => {
      const error = new ExportError(
        ExportErrorType.NETWORK,
        'Network failure',
        true,
        new Error('Original error')
      );

      expect(error.type).toBe(ExportErrorType.NETWORK);
      expect(error.message).toBe('Network failure');
      expect(error.retryable).toBe(true);
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.name).toBe('ExportError');
    });

    it('should categorize configuration errors correctly', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'invalid-url',
          token: 'short',
          dataset: 'invalid-dataset-name!'
        }
      };

      try {
        await configureLocalExport(config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).type).toBe(ExportErrorType.CONFIGURATION);
        expect((error as ExportError).message).toContain('Invalid Axiom URL format');
        expect((error as ExportError).message).toContain('token appears to be too short');
        expect((error as ExportError).message).toContain('Invalid dataset name');
      }
    });
  });

  describe('Export Metrics', () => {
    it('should return null when no export configured', () => {
      expect(getExportMetrics()).toBeNull();
    });

    it('should return metrics when export is configured', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: {}
      };

      await configureLocalExport(config);
      const metrics = getExportMetrics();

      expect(metrics).toBeDefined();
      expect(metrics?.successCount).toBe(0);
      expect(metrics?.failureCount).toBe(0);
      expect(metrics?.totalAttempts).toBe(0);
      expect(metrics?.averageLatency).toBe(0);
      expect(metrics?.failuresByType).toBeDefined();
    });
  });

  describe('Circuit Breaker', () => {
    it('should return null when no export configured', () => {
      expect(getCircuitBreakerState()).toBeNull();
    });

    it('should return circuit breaker state when export is configured', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: {}
      };

      await configureLocalExport(config);
      const state = getCircuitBreakerState();

      expect(state).toBe('closed');
    });

    it('should reset circuit breaker', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: {}
      };

      await configureLocalExport(config);
      expect(() => resetCircuitBreaker()).not.toThrow();
    });
  });

  describe('Debug Information', () => {
    it('should return comprehensive debug info', async () => {
      const config: LocalExportConfig = {
        type: 'console',
        config: {}
      };

      await configureLocalExport(config);
      const debugInfo = getExportDebugInfo();

      expect(debugInfo.status).toBe('console');
      expect(debugInfo.config).toBeDefined();
      expect(debugInfo.config?.type).toBe('console');
      expect(debugInfo.metrics).toBeDefined();
      expect(debugInfo.circuitBreakerState).toBe('closed');
    });

    it('should return none status when no export configured', () => {
      const debugInfo = getExportDebugInfo();

      expect(debugInfo.status).toBe('none');
      expect(debugInfo.config).toBeNull();
      expect(debugInfo.metrics).toBeNull();
      expect(debugInfo.circuitBreakerState).toBeNull();
    });
  });

  describe('OTel Debug Integration', () => {
    it('should include export status in otel debug info', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'https://test.axiom.co',
          token: 'test-token-123',
          dataset: 'test-dataset'
        }
      };

      await configureLocalExport(config);
      const otelDebugInfo = getOtelDebugInfo();

      expect(otelDebugInfo.exportStatus).toBeDefined();
      expect(otelDebugInfo.exportStatus?.status).toBe('axiom');
      expect(otelDebugInfo.exportStatus?.backend).toBe('axiom');
      expect(otelDebugInfo.exportStatus?.metrics).toBeDefined();
    });

    it('should not include export status when no export configured', () => {
      const otelDebugInfo = getOtelDebugInfo();

      expect(otelDebugInfo.exportStatus).toBeUndefined();
    });
  });

  describe('Enhanced Configuration Validation', () => {
    it('should provide detailed error messages for Axiom config', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: '',
          token: '',
          dataset: ''
        }
      };

      try {
        await configureLocalExport(config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        const errorMessage = (error as ExportError).message;
        expect(errorMessage).toContain('Axiom URL is required');
        expect(errorMessage).toContain('Axiom token is required');
        expect(errorMessage).toContain('Axiom dataset is required');
      }
    });

    it('should provide detailed error messages for OTLP config', async () => {
      const config: LocalExportConfig = {
        type: 'otlp',
        config: {
          url: 'invalid-url',
          headers: { 'test': 123 as any }
        }
      };

      try {
        await configureLocalExport(config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        const errorMessage = (error as ExportError).message;
        expect(errorMessage).toContain('Invalid OTLP URL format');
        expect(errorMessage).toContain('must be a string key with string value');
      }
    });

    it('should validate timeout ranges with detailed messages', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: 'https://test.axiom.co',
          token: 'test-token-123',
          dataset: 'test-dataset',
          timeout: 500 // Too low
        }
      };

      try {
        await configureLocalExport(config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        expect((error as ExportError).message).toContain('Axiom timeout must be between 1000ms and 60000ms');
      }
    });
  });

  describe('Error Suggestions', () => {
    it('should provide helpful suggestions for configuration errors', async () => {
      const config: LocalExportConfig = {
        type: 'axiom',
        config: {
          url: '',
          token: '',
          dataset: ''
        }
      };

      try {
        await configureLocalExport(config);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ExportError);
        const errorMessage = (error as ExportError).message;
        expect(errorMessage).toContain('process.env.AXIOM_TOKEN');
        expect(errorMessage).toContain('https://axiom.co');
        expect(errorMessage).toContain('dataset name where spans will be stored');
      }
    });
  });
});
