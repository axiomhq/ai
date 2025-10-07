/**
 * Error class for user-facing configuration errors.
 * When caught by the CLI, these errors are displayed without stack traces.
 */
export class AxiomCLIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AxiomCLIError';
  }
}

export function errorToString(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}
