import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateTokenPermissions } from '../../src/config/validate-permissions';
import type { ResolvedAxiomConfig } from '../../src/config';
import { AxiomCLIError } from '../../src/util/errors';

// Mock the OTEL modules
vi.mock('@opentelemetry/sdk-trace-node', () => ({
  BatchSpanProcessor: vi.fn(function (this: any) {
    this.forceFlush = vi.fn().mockResolvedValue(undefined);
    this.shutdown = vi.fn().mockResolvedValue(undefined);
  }),
  NodeTracerProvider: vi.fn(function (this: any) {
    this.getTracer = vi.fn().mockReturnValue({
      startSpan: vi.fn().mockReturnValue({
        setStatus: vi.fn(),
        end: vi.fn(),
      }),
    });
    this.forceFlush = vi.fn().mockResolvedValue(undefined);
    this.shutdown = vi.fn().mockResolvedValue(undefined);
  }),
}));

vi.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: vi.fn().mockReturnValue({}),
}));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: vi.fn(function (this: any) {
    // Mock OTLP exporter constructor
  }),
}));

describe('validateTokenPermissions', () => {
  const mockConfig: ResolvedAxiomConfig = {
    eval: {
      url: 'https://api.axiom.co',
      edgeUrl: 'https://api.axiom.co',
      token: 'test-token',
      dataset: 'test-dataset',
      orgId: 'test-org',
      flagSchema: null,
      instrumentation: null,
      timeoutMs: 60000,
      include: ['**/*.eval.ts'],
      exclude: [],
    },
  };

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    (globalThis as any).__SDK_VERSION__ = 'test-version';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('should pass validation when token has all permissions', async () => {
    // Mock successful query response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches: [] }),
    });

    const result = await validateTokenPermissions(mockConfig);

    expect(result.valid).toBe(true);
    expect(result.canIngest).toBe(true);
    expect(result.canQuery).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation when query fails with 401', async () => {
    // Mock 401 unauthorized query response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(AxiomCLIError);
    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(/Invalid or expired token/);
  });

  it('should fail validation when query fails with 403', async () => {
    // Mock 403 forbidden query response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Forbidden' }),
    });

    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(AxiomCLIError);
    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(/Read permission denied/);
  });

  it('should fail validation when query fails with 404', async () => {
    // Mock 404 not found query response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not Found' }),
    });

    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(AxiomCLIError);
    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(/Dataset not found/);
  });

  it('should provide helpful error message with token management URL', async () => {
    // Mock failed query
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Forbidden' }),
    });

    await expect(validateTokenPermissions(mockConfig)).rejects.toThrow(/Manage tokens at:/);
  });

  it('should list required permissions in error message', async () => {
    // Mock failed query
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Forbidden' }),
    });

    try {
      await validateTokenPermissions(mockConfig);
    } catch (error) {
      if (error instanceof AxiomCLIError) {
        expect(error.message).toContain('To run evaluations, your token needs:');
        expect(error.message).toContain('Write permission to ingest traces');
        expect(error.message).toContain('Read permission to query results');
      }
    }
  });
});
