import { describe, it, expect } from 'vitest';
import { isOtelProviderActive } from '../../src/otel/detection';

describe('Detection Integration Tests', () => {
  it('should return false with default environment (no active OTel)', () => {
    // This tests the real-world scenario where no OTel is set up
    expect(isOtelProviderActive()).toBe(false);
  });

  it('should handle errors gracefully', () => {
    // Test that the function doesn't throw when things go wrong
    expect(() => isOtelProviderActive()).not.toThrow();
  });
});
