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
