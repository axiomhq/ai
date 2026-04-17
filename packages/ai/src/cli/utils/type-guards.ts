export const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return undefined;
};
