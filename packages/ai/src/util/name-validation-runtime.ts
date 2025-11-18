/**
 * Validates that a name contains only allowed characters (A-Z, a-z, 0-9, -, _)
 * and is not empty.
 * 
 * @returns Object with validation result and optional error message
 */
export function isValidName(name: string): { valid: true } | { valid: false; error: string } {
  if (name === '') {
    return { valid: false, error: 'Name cannot be empty' };
  }

  const validPattern = /^[A-Za-z0-9_-]+$/;
  if (!validPattern.test(name)) {
    return {
      valid: false,
      error: `Invalid character in "${name}". Only A-Z, a-z, 0-9, -, _ allowed`,
    };
  }

  return { valid: true };
}
