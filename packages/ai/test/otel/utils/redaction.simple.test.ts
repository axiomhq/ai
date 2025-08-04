import { describe, it, expect, beforeEach, vi } from 'vitest';
import { propagation } from '@opentelemetry/api';
import {
  mergeRedactionSettings,
  applyRedactToBaggage,
  BAGGAGE_KEYS,
} from '../../../src/otel/utils/redaction';

describe('Redaction Utilities - Core Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mergeRedactionSettings', () => {
    it('should return all false when no settings provided', () => {
      const result = mergeRedactionSettings();
      expect(result).toEqual({
        prompts: false,
        completions: false,
        toolArguments: false,
        toolMessages: false,
      });
    });

    it('should handle global "all" setting', () => {
      const result = mergeRedactionSettings('all');
      expect(result).toEqual({
        prompts: true,
        completions: true,
        toolArguments: true,
        toolMessages: true,
      });
    });

    it('should handle global "none" setting', () => {
      const result = mergeRedactionSettings('none');
      expect(result).toEqual({
        prompts: false,
        completions: false,
        toolArguments: false,
        toolMessages: false,
      });
    });

    it('should handle global object setting', () => {
      const result = mergeRedactionSettings({
        prompts: true,
        completions: false,
        toolArguments: true,
        toolMessages: false,
      });
      expect(result).toEqual({
        prompts: true,
        completions: false,
        toolArguments: true,
        toolMessages: false,
      });
    });

    it('should handle local "all" overriding global "none"', () => {
      const result = mergeRedactionSettings('none', 'all');
      expect(result).toEqual({
        prompts: true,
        completions: true,
        toolArguments: true,
        toolMessages: true,
      });
    });

    it('should handle local "none" overriding global "all"', () => {
      const result = mergeRedactionSettings('all', 'none');
      expect(result).toEqual({
        prompts: false,
        completions: false,
        toolArguments: false,
        toolMessages: false,
      });
    });

    it('should handle local object overriding global object', () => {
      const global = {
        prompts: true,
        completions: true,
        toolArguments: false,
        toolMessages: false,
      };
      const local = {
        prompts: false,
        completions: undefined, // should inherit from global
        toolArguments: true, // should override global
        toolMessages: undefined, // should inherit from global
      };
      const result = mergeRedactionSettings(global, local);
      expect(result).toEqual({
        prompts: false, // overridden by local
        completions: true, // inherited from global
        toolArguments: true, // overridden by local
        toolMessages: false, // inherited from global
      });
    });

    it('should handle local object overriding global "all"', () => {
      const result = mergeRedactionSettings('all', {
        prompts: false,
        toolArguments: false,
      });
      expect(result).toEqual({
        prompts: false, // overridden by local
        completions: true, // inherited from global "all"
        toolArguments: false, // overridden by local
        toolMessages: true, // inherited from global "all"
      });
    });

    it('should handle local "all" overriding global object', () => {
      const result = mergeRedactionSettings(
        {
          prompts: false,
          completions: false,
          toolArguments: false,
          toolMessages: false,
        },
        'all',
      );
      expect(result).toEqual({
        prompts: true,
        completions: true,
        toolArguments: true,
        toolMessages: true,
      });
    });

    it('should handle undefined values in object settings', () => {
      const result = mergeRedactionSettings(
        {
          prompts: true,
          // completions undefined
          toolArguments: false,
          // toolMessages undefined
        },
        {
          // prompts undefined
          completions: true,
          // toolArguments undefined
          toolMessages: false,
        },
      );
      expect(result).toEqual({
        prompts: true, // from global
        completions: true, // from local
        toolArguments: false, // from global
        toolMessages: false, // from local
      });
    });
  });

  describe('applyRedactToBaggage', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock propagation.createBaggage
      (propagation.createBaggage as any) = vi.fn((entries) => entries);
    });

    it('should create baggage with redaction settings only', () => {
      const emptyBaggage = { getAllEntries: () => [] } as any;
      const redaction = {
        prompts: true,
        completions: false,
        toolArguments: true,
        toolMessages: false,
      };

      applyRedactToBaggage(emptyBaggage, redaction);

      expect(propagation.createBaggage).toHaveBeenCalledWith({
        [BAGGAGE_KEYS.prompts]: { value: '1' },
        [BAGGAGE_KEYS.completions]: { value: '0' },
        [BAGGAGE_KEYS.toolArgs]: { value: '1' },
        [BAGGAGE_KEYS.toolMsgs]: { value: '0' },
      });
    });

    it('should preserve existing baggage entries and add redaction settings', () => {
      const existingBaggage = {
        getAllEntries: () => [
          ['existing.key', { value: 'existing.value' }],
          ['another.key', { value: 'another.value' }],
        ],
      } as any;
      const redaction = {
        prompts: false,
        completions: true,
        toolArguments: false,
        toolMessages: true,
      };

      applyRedactToBaggage(existingBaggage, redaction);

      expect(propagation.createBaggage).toHaveBeenCalledWith({
        'existing.key': { value: 'existing.value' },
        'another.key': { value: 'another.value' },
        [BAGGAGE_KEYS.prompts]: { value: '0' },
        [BAGGAGE_KEYS.completions]: { value: '1' },
        [BAGGAGE_KEYS.toolArgs]: { value: '0' },
        [BAGGAGE_KEYS.toolMsgs]: { value: '1' },
      });
    });

    it('should encode boolean true as "1" and false as "0"', () => {
      const emptyBaggage = { getAllEntries: () => [] } as any;
      const redaction = {
        prompts: true,
        completions: false,
        toolArguments: true,
        toolMessages: false,
      };

      applyRedactToBaggage(emptyBaggage, redaction);

      const createBaggageCall = (propagation.createBaggage as any).mock.calls[0][0];
      expect(createBaggageCall[BAGGAGE_KEYS.prompts].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.completions].value).toBe('0');
      expect(createBaggageCall[BAGGAGE_KEYS.toolArgs].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.toolMsgs].value).toBe('0');
    });
  });

  describe('Baggage round-trip compatibility', () => {
    beforeEach(() => {
      (propagation.createBaggage as any) = vi.fn((entries) => entries);
    });

    it('should encode and decode redaction settings correctly', () => {
      const originalSettings = {
        prompts: true,
        completions: false,
        toolArguments: true,
        toolMessages: false,
      };

      // Simulate encoding to baggage
      const mockBaggage = { getAllEntries: () => [] } as any;
      applyRedactToBaggage(mockBaggage, originalSettings);

      // Extract the baggage entries created
      const createBaggageCall = (propagation.createBaggage as any).mock.calls[0][0];

      // Verify encoding
      expect(createBaggageCall[BAGGAGE_KEYS.prompts].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.completions].value).toBe('0');
      expect(createBaggageCall[BAGGAGE_KEYS.toolArgs].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.toolMsgs].value).toBe('0');
    });

    it('should handle all-true settings round-trip', () => {
      const originalSettings = {
        prompts: true,
        completions: true,
        toolArguments: true,
        toolMessages: true,
      };

      const mockBaggage = { getAllEntries: () => [] } as any;
      applyRedactToBaggage(mockBaggage, originalSettings);

      const createBaggageCall = (propagation.createBaggage as any).mock.calls[0][0];

      expect(createBaggageCall[BAGGAGE_KEYS.prompts].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.completions].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.toolArgs].value).toBe('1');
      expect(createBaggageCall[BAGGAGE_KEYS.toolMsgs].value).toBe('1');
    });

    it('should handle all-false settings round-trip', () => {
      const originalSettings = {
        prompts: false,
        completions: false,
        toolArguments: false,
        toolMessages: false,
      };

      const mockBaggage = { getAllEntries: () => [] } as any;
      applyRedactToBaggage(mockBaggage, originalSettings);

      const createBaggageCall = (propagation.createBaggage as any).mock.calls[0][0];

      expect(createBaggageCall[BAGGAGE_KEYS.prompts].value).toBe('0');
      expect(createBaggageCall[BAGGAGE_KEYS.completions].value).toBe('0');
      expect(createBaggageCall[BAGGAGE_KEYS.toolArgs].value).toBe('0');
      expect(createBaggageCall[BAGGAGE_KEYS.toolMsgs].value).toBe('0');
    });
  });
});
