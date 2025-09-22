/**
 * Simple glob detection utility
 * Detects if a string contains glob pattern characters
 */
export function isGlob(str: string): boolean {
  // Check for glob characters: * ? [ ] { } !
  return /[*?[\]{}!]/.test(str);
}
