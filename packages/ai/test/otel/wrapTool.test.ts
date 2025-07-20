import { describe, it, expect, vi } from 'vitest';
import { wrapTool, wrapTools } from '../../src/otel/wrapTool';
import type { WrappedTool } from '../../src/otel/wrapTool.util';

// Mock tools for testing
const mockTool = {
  description: 'A mock tool for testing',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' },
    },
  },
  execute: vi.fn().mockResolvedValue({ result: 'success' }),
};

const mockToolV2 = {
  description: 'Another mock tool for testing',
  parameters: {
    type: 'object',
    properties: {
      value: { type: 'number' },
    },
  },
  execute: vi.fn().mockResolvedValue({ data: 42 }),
};

describe('WrappedTool type', () => {
  it('should preserve tool properties except execute', () => {
    const wrapped: WrappedTool<typeof mockTool> = wrapTool('test', mockTool);

    expect(wrapped.description).toBe(mockTool.description);
    expect(wrapped.parameters).toBe(mockTool.parameters);
    expect(typeof wrapped.execute).toBe('function');
  });
});

describe('wrapTool', () => {
  it('should wrap a tool and preserve its properties', () => {
    const wrapped = wrapTool('testTool', mockTool);

    expect(wrapped.description).toBe(mockTool.description);
    expect(wrapped.parameters).toBe(mockTool.parameters);
    expect(typeof wrapped.execute).toBe('function');
  });

  it('should handle invalid tool gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = wrapTool('invalid', null as any);

    expect(consoleSpy).toHaveBeenCalledWith('Invalid tool provided to wrapTool');
    expect(result).toBe(null);

    consoleSpy.mockRestore();
  });

  it('should handle tool without execute method', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidTool = { description: 'No execute method' };

    const result = wrapTool('invalid', invalidTool as any);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Cannot wrap a tool that does not have an execute method',
    );
    expect(result).toBe(invalidTool);

    consoleSpy.mockRestore();
  });

  it('should call original execute method', async () => {
    const wrapped = wrapTool('testTool', mockTool);
    const args = { input: 'test' };
    const opts = { toolCallId: 'call-123' };

    const result = await wrapped.execute(args, opts);

    expect(mockTool.execute).toHaveBeenCalledWith(args, opts);
    expect(result).toEqual({ result: 'success' });
  });
});

describe('wrapTools', () => {
  it('should wrap multiple tools', () => {
    const tools = {
      tool1: mockTool,
      tool2: mockToolV2,
    };

    const wrapped = wrapTools(tools);

    expect(wrapped.tool1.description).toBe(mockTool.description);
    expect(wrapped.tool2.description).toBe(mockToolV2.description);
    expect(typeof wrapped.tool1.execute).toBe('function');
    expect(typeof wrapped.tool2.execute).toBe('function');
  });

  it('should handle empty tools object', () => {
    const tools = {};
    const wrapped = wrapTools(tools);

    expect(wrapped).toEqual({});
  });

  it('should handle invalid tools object gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = wrapTools(null as any);

    expect(consoleSpy).toHaveBeenCalledWith('Invalid tools object provided to wrapTools');
    expect(result).toBe(null);

    consoleSpy.mockRestore();
  });

  it('should preserve tool names as keys', () => {
    const tools = {
      searchDatabase: mockTool,
      calculateMetrics: mockToolV2,
    };

    const wrapped = wrapTools(tools);

    expect(Object.keys(wrapped)).toEqual(['searchDatabase', 'calculateMetrics']);
  });

  it('should maintain TypeScript type safety', () => {
    const tools = {
      searchDatabase: mockTool,
      calculateMetrics: mockToolV2,
    };

    const wrapped = wrapTools(tools);

    // TypeScript should infer the correct types
    expect(wrapped.searchDatabase.description).toBe(mockTool.description);
    expect(wrapped.calculateMetrics.description).toBe(mockToolV2.description);
  });

  it('should call original execute methods for all tools', async () => {
    const tools = {
      tool1: mockTool,
      tool2: mockToolV2,
    };

    const wrapped = wrapTools(tools);

    const args1 = { input: 'test1' };
    const opts1 = { toolCallId: 'call-1' };
    const result1 = await wrapped.tool1.execute(args1, opts1);

    const args2 = { value: 42 };
    const opts2 = { toolCallId: 'call-2' };
    const result2 = await wrapped.tool2.execute(args2, opts2);

    expect(mockTool.execute).toHaveBeenCalledWith(args1, opts1);
    expect(mockToolV2.execute).toHaveBeenCalledWith(args2, opts2);
    expect(result1).toEqual({ result: 'success' });
    expect(result2).toEqual({ data: 42 });
  });
});
