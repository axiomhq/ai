import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SpanStatusCode } from '@opentelemetry/api';
import type { ResolvedAxiomConfig } from './index';
import { resolveAxiomConnection } from './resolver';
import { AxiomCLIError } from '../util/errors';

/**
 * Result of token permission validation
 */
export interface TokenPermissionValidationResult {
  valid: boolean;
  canIngest: boolean;
  canQuery: boolean;
  errors: string[];
}

/**
 * Validates that the configured token has the required permissions to run evaluations.
 *
 * This function:
 * 1. Attempts to send a test trace to verify ingestion permissions
 * 2. Attempts to query the dataset to verify read permissions
 *
 * @param config - Resolved Axiom configuration
 * @returns Validation result with permission details
 * @throws {AxiomCLIError} If validation fails with detailed error messages
 */
export async function validateTokenPermissions(
  config: ResolvedAxiomConfig,
): Promise<TokenPermissionValidationResult> {
  const result: TokenPermissionValidationResult = {
    valid: true,
    canIngest: false,
    canQuery: false,
    errors: [],
  };

  const connection = resolveAxiomConnection(config);

  // Test 1: Verify token can ingest traces
  try {
    await testTraceIngestion(connection);
    result.canIngest = true;
  } catch (error) {
    result.valid = false;
    result.canIngest = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`❌ Cannot ingest traces: ${errorMsg}`);
  }

  // Test 2: Verify token can query dataset
  try {
    await testDatasetQuery(connection);
    result.canQuery = true;
  } catch (error) {
    result.valid = false;
    result.canQuery = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`❌ Cannot query dataset: ${errorMsg}`);
  }

  if (!result.valid) {
    const errorMessage = [
      `Token validation failed for dataset '${connection.dataset}'.`,
      'Your token lacks required permissions:',
      '',
      ...result.errors,
      '',
      'To run evaluations, your token needs:',
      '  • Write permission to ingest traces',
      '  • Read permission to query results',
      '',
      'Manage tokens at: ' +
        connection.consoleEndpointUrl.replace('/app/', '/app/settings/tokens'),
    ].join('\n');

    throw new AxiomCLIError(errorMessage);
  }

  return result;
}

/**
 * Test trace ingestion by sending a validation trace
 */
async function testTraceIngestion(
  connection: ReturnType<typeof resolveAxiomConnection>,
): Promise<void> {
  const headers: Record<string, string> = {
    'X-Axiom-Dataset': connection.dataset,
    ...(connection.orgId ? { 'X-AXIOM-ORG-ID': connection.orgId } : {}),
  };

  if (connection.token) {
    headers.Authorization = `Bearer ${connection.token}`;
  }

  // Use edgeUrl for trace ingestion
  const collectorOptions = {
    url: `${connection.edgeUrl}/v1/traces`,
    headers,
    concurrencyLimit: 1,
  };

  const exporter = new OTLPTraceExporter(collectorOptions);

  const processor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 10,
    maxExportBatchSize: 10,
    scheduledDelayMillis: 100,
    exportTimeoutMillis: 5000,
  });

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      ['service.name']: 'axiom-token-validation',
      ['service.version']: __SDK_VERSION__,
    }),
    spanProcessors: [processor],
  });

  const tracer = provider.getTracer('axiom-token-validation', __SDK_VERSION__);

  // Create a validation span
  const span = tracer.startSpan('axiom.token.validation', {
    attributes: {
      'axiom.validation.type': 'token_permission_check',
      'axiom.validation.timestamp': Date.now(),
    },
  });

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  // Force flush to send the span immediately
  try {
    await provider.forceFlush();
  } catch (error) {
    // Extract meaningful error message
    let message = 'Write failed';
    if (error instanceof Error) {
      // Check for common HTTP error patterns
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        message = 'Invalid or expired token';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        message = 'Write permission denied';
      } else if (error.message.includes('404')) {
        message = 'Dataset not found';
      } else {
        message = error.message;
      }
    }
    throw new Error(message);
  } finally {
    await provider.shutdown();
  }
}

/**
 * Test dataset query by running a simple APL query
 */
async function testDatasetQuery(
  connection: ReturnType<typeof resolveAxiomConnection>,
): Promise<void> {
  // Simple APL query that returns minimal data
  const apl = `['${connection.dataset}'] | limit 1`;

  const headers = new Headers({
    Authorization: `Bearer ${connection.token}`,
    'Content-Type': 'application/json',
    ...(connection.orgId ? { 'X-AXIOM-ORG-ID': connection.orgId } : {}),
  });

  try {
    // Use edgeUrl for query operations
    const response = await fetch(`${connection.edgeUrl}/v1/datasets/_apl?format=legacy`, {
      headers,
      method: 'POST',
      body: JSON.stringify({ apl }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const errorMessage = payload.message || response.statusText;

      // Provide specific error messages based on status code
      if (response.status === 401) {
        throw new Error('Invalid or expired token');
      } else if (response.status === 403) {
        throw new Error('Read permission denied');
      } else if (response.status === 404) {
        throw new Error('Dataset not found');
      } else {
        throw new Error(`Query failed: ${errorMessage}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to query dataset: Network error');
  }
}
