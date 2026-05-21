import type { ResolvedAxiomConfig } from './index';
import { resolveAxiomConnection } from './resolver';
import { AxiomCLIError } from '../util/errors';

/**
 * Result of token permission validation
 */
export interface TokenPermissionValidationResult {
  valid: boolean;
  dataset: string;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
  };
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
const buildPermissionHelp = (consoleEndpointUrl: string) => [
  'To run evaluations, your token needs:',
  '    - Write permission to ingest traces',
  '    - Read permission to query results',
  `Manage tokens at: ${consoleEndpointUrl}/settings/api-tokens`,
];

const indentErrorDetails = (lines: string[]) =>
  lines.map((line, index) => (index === 0 ? line : `      ${line}`));

const formatPermissionErrors = (
  errors: string[] | undefined,
  dataset: string,
  consoleEndpointUrl: string,
) => {
  const details: string[] = [];
  const normalized = (errors || []).map((e) => e.toLowerCase());

  if (normalized.some((e) => e.includes('ingest') || e.includes('write'))) {
    details.push('Missing write permission to ingest traces.');
  }
  if (normalized.some((e) => e.includes('read') || e.includes('query'))) {
    details.push('Missing read permission to query results.');
  }

  if (details.length === 0 && errors && errors.length > 0) {
    details.push(...errors);
  }

  return indentErrorDetails([
    `Token does not have required permissions for dataset "${dataset}".`,
    ...details,
    ...buildPermissionHelp(consoleEndpointUrl),
  ]);
};

export async function validateTokenPermissions(config: ResolvedAxiomConfig) {
  const connection = resolveAxiomConnection(config);

  try {
    const headers: Record<string, string> = {
      'X-Axiom-Org-Id': connection.orgId ?? '',
      'X-Axiom-Dataset': connection.dataset,
    };

    if (connection.token) {
      headers.Authorization = `Bearer ${connection.token}`;
    }

    console.log({ region: connection.edgeRegion });

    const response = await fetch(
      `${connection.url}/api/v3/evaluations/validate?dataset=${connection.dataset}&region=${connection.edgeRegion}`,
      {
        headers,
      },
    );

    if (!response.ok) {
      let serverMessage: string | undefined;
      try {
        const data = await response.json();
        console.debug('validation response', { data })
        serverMessage = data?.error || data?.message;
      } catch {
        serverMessage = undefined;
      }

      if (response.status === 404) {
        throw new AxiomCLIError(
          indentErrorDetails([
            `Dataset not found: "${connection.dataset}".`,
            'Check eval.dataset in axiom.config.ts or AXIOM_DATASET in your environment.',
            `Manage datasets at: ${connection.consoleEndpointUrl}/datasets`,
          ]).join('\n'),
        );
      }

      const statusLabel = serverMessage || response.statusText || 'Unknown error';
      const baseMessage = `Failed to validate token: ${statusLabel}`;

      if (response.status === 401 || response.status === 403) {
        throw new AxiomCLIError(
          indentErrorDetails([
            baseMessage,
            response.status === 401
              ? 'The token is missing or invalid.'
              : `The token does not have access to dataset "${connection.dataset}".`,
            `Check AXIOM_TOKEN or eval.token in axiom.config.ts.`,
            ...buildPermissionHelp(connection.consoleEndpointUrl),
          ]).join('\n'),
        );
      }

      throw new AxiomCLIError(
        indentErrorDetails([
          baseMessage,
          ...buildPermissionHelp(connection.consoleEndpointUrl),
        ]).join('\n'),
      );
    }

    const result = (await response.json()) as TokenPermissionValidationResult;
    if (!result.valid) {
      result.errors = formatPermissionErrors(
        result.errors,
        connection.dataset,
        connection.consoleEndpointUrl,
      );
    }
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new AxiomCLIError(errorMessage);
  }
}
