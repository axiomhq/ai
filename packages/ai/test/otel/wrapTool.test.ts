import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { wrapTool, wrapTools } from '../../src/otel/wrapTool';
import type { WrappedTool } from '../../src/otel/wrapTool.util';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { classifyToolError } from '../../src/otel/utils/wrapperUtils';
import { createOtelTestSetup } from '../helpers/otel-test-setup';

const otelTestSetup = createOtelTestSetup();

beforeAll(() => {
  otelTestSetup.setup();
});

beforeEach(() => {
  otelTestSetup.reset();
});

afterAll(async () => {
  await otelTestSetup.cleanup();
});

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

    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid tool provided to wrapTool, returning unwrapped tool',
    );
    expect(result).toBe(null);

    consoleSpy.mockRestore();
  });

  it('should handle tool without execute method', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidTool = { description: 'No execute method' };

    const result = wrapTool('invalid', invalidTool as any);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Cannot wrap a tool that does not have an execute method, returning unwrapped tool',
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

describe('Tool Error Handling', () => {
  let mockSpan: any;

  beforeEach(() => {
    // Mock span for testing error handling
    mockSpan = {
      recordException: vi.fn(),
      setStatus: vi.fn(),
      setAttribute: vi.fn(),
      setAttributes: vi.fn(),
      updateName: vi.fn(),
      end: vi.fn(),
    };

    // Mock trace.getActiveSpan to return our mock span
    vi.spyOn(trace, 'getActiveSpan').mockReturnValue(mockSpan);
  });

  it('should handle tool execution timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';

    const errorTool = {
      description: 'Tool that times out',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(timeoutError),
    };

    const wrapped = wrapTool('timeoutTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Request timeout',
    );

    // Verify error was properly handled
    expect(errorTool.execute).toHaveBeenCalled();
  });

  it('should handle tool validation errors', async () => {
    const validationError = new Error('Invalid parameters');
    validationError.name = 'ValidationError';

    const errorTool = {
      description: 'Tool that fails validation',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(validationError),
    };

    const wrapped = wrapTool('validationTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Invalid parameters',
    );
  });

  it('should handle network errors with status codes', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'FetchError';
    (networkError as any).status = 500;

    const errorTool = {
      description: 'Tool that fails with network error',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(networkError),
    };

    const wrapped = wrapTool('networkTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow('fetch failed');
  });

  it('should handle authentication errors', async () => {
    const authError = new Error('Unauthorized access');
    authError.name = 'AuthError';

    const errorTool = {
      description: 'Tool that fails authentication',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(authError),
    };

    const wrapped = wrapTool('authTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Unauthorized access',
    );
  });

  it('should handle rate limiting errors', async () => {
    const rateLimitError = new Error('Rate limit exceeded');
    rateLimitError.name = 'RateLimitError';

    const errorTool = {
      description: 'Tool that hits rate limits',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(rateLimitError),
    };

    const wrapped = wrapTool('rateLimitTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Rate limit exceeded',
    );
  });

  it('should handle JSON parsing errors', async () => {
    const parseError = new Error('Unexpected token in JSON');
    parseError.name = 'SyntaxError';

    const errorTool = {
      description: 'Tool that fails JSON parsing',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(parseError),
    };

    const wrapped = wrapTool('parseTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Unexpected token in JSON',
    );
  });

  it('should handle generic errors', async () => {
    const genericError = new Error('Something went wrong');

    const errorTool = {
      description: 'Tool that throws generic error',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(genericError),
    };

    const wrapped = wrapTool('genericTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Something went wrong',
    );
  });

  it('should handle non-Error objects thrown as errors', async () => {
    const stringError = 'String error message';

    const errorTool = {
      description: 'Tool that throws string',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(stringError),
    };

    const wrapped = wrapTool('stringErrorTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toBe(stringError);
  });

  it('should handle quota exceeded errors', async () => {
    const quotaError = new Error('Quota limit exceeded');
    quotaError.name = 'QuotaError';

    const errorTool = {
      description: 'Tool that exceeds quota',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockRejectedValue(quotaError),
    };

    const wrapped = wrapTool('quotaTool', errorTool);

    await expect(wrapped.execute({}, { toolCallId: 'call-123' })).rejects.toThrow(
      'Quota limit exceeded',
    );
  });

  it('should handle tool execution that throws during argument serialization', async () => {
    const circularObject = { self: null as any };
    circularObject.self = circularObject;

    const normalTool = {
      description: 'Tool with circular arguments',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockResolvedValue({ result: 'success' }),
    };

    const wrapped = wrapTool('circularTool', normalTool);

    // This should not throw - it should handle serialization errors gracefully
    const result = await wrapped.execute(circularObject, { toolCallId: 'call-123' });
    expect(result).toEqual({ result: 'success' });
  });

  it('should handle tool execution that returns non-serializable results', async () => {
    const circularResult = { self: null as any };
    circularResult.self = circularResult;

    const normalTool = {
      description: 'Tool with circular result',
      parameters: { type: 'object', properties: {} },
      execute: vi.fn().mockResolvedValue(circularResult),
    };

    const wrapped = wrapTool('circularResultTool', normalTool);

    // This should not throw - it should handle serialization errors gracefully
    const result = await wrapped.execute({}, { toolCallId: 'call-123' });
    expect(result).toBe(circularResult);
  });
});

describe('classifyToolError function', () => {
  let mockSpan: any;

  beforeEach(() => {
    mockSpan = {
      recordException: vi.fn(),
      setStatus: vi.fn(),
      setAttribute: vi.fn(),
    };
  });

  it('should classify timeout errors correctly', () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';

    classifyToolError(timeoutError, mockSpan);

    expect(mockSpan.recordException).toHaveBeenCalledWith(timeoutError);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'Request timeout',
    });
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'timeout');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.message', 'Request timeout');
  });

  it('should classify validation errors correctly', () => {
    const validationError = new Error('Invalid parameters');
    validationError.name = 'ValidationError';

    classifyToolError(validationError, mockSpan);

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'validation');
  });

  it('should classify network errors with status codes', () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'FetchError';
    (networkError as any).status = 404;

    classifyToolError(networkError, mockSpan);

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'network');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('http.response.status_code', 404);
  });

  it('should handle non-Error objects', () => {
    const stringError = 'Something went wrong';

    classifyToolError(stringError, mockSpan);

    expect(mockSpan.recordException).toHaveBeenCalledWith({
      message: 'Something went wrong',
      name: 'UnknownError',
    });
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'unknown');
  });

  it('should classify authentication errors correctly', () => {
    const authError = new Error('Unauthorized');
    authError.name = 'AuthError';

    classifyToolError(authError, mockSpan);

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'authentication');
  });

  it('should classify rate limit errors correctly', () => {
    const rateLimitError = new Error('Rate limit exceeded');
    rateLimitError.name = 'RateLimitError';

    classifyToolError(rateLimitError, mockSpan);

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'rate_limit');
  });

  it('should handle node-fetch v2 error patterns', () => {
    const fetchError = new Error('network error');
    fetchError.name = 'FetchError';
    (fetchError as any).code = 'ECONNRESET';

    classifyToolError(fetchError, mockSpan);

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'network');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('http.response.status_code', 'ECONNRESET');
  });
});
