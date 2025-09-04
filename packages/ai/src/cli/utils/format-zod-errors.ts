import { ZodError } from 'zod';

/**
 * Format ZodError issues into user-friendly CLI error messages
 */
export function formatZodErrors(error: ZodError): string {
  const issues = error.issues;
  const messages: string[] = [];

  for (const issue of issues) {
    const path = issue.path.join('.');
    const message = formatIssueMessage(issue, path);
    messages.push(`  • ${message}`);
  }

  return messages.join('\n');
}

function formatIssueMessage(issue: any, path: string): string {
  switch (issue.code) {
    case 'invalid_type':
      return `flag '${path}' expected ${issue.expected}, got ${JSON.stringify(issue.received)} (${typeof issue.received})`;
    
    case 'too_small':
      if (issue.type === 'number') {
        return `flag '${path}' must be >= ${issue.minimum}, got ${issue.received}`;
      }
      return `flag '${path}' is too small: ${issue.message}`;
    
    case 'too_big':
      if (issue.type === 'number') {
        return `flag '${path}' must be <= ${issue.maximum}, got ${issue.received}`;
      }
      return `flag '${path}' is too big: ${issue.message}`;
    
    case 'invalid_enum_value':
      const options = issue.options.map((opt: any) => `"${opt}"`).join(', ');
      return `flag '${path}' must be one of: ${options}, got "${issue.received}"`;
    
    case 'custom':
      return `flag '${path}': ${issue.message}`;
    
    default:
      return `flag '${path}': ${issue.message}`;
  }
}

/**
 * Create helpful examples for CLI usage based on validation errors
 */
export function generateFlagExamples(error: ZodError): string[] {
  const examples: string[] = [];
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const example = generateExampleForIssue(issue, path);
    if (example && !examples.includes(example)) {
      examples.push(example);
    }
  }

  return examples.slice(0, 3); // Limit to 3 examples
}

function generateExampleForIssue(issue: any, path: string): string | null {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.expected === 'number') {
        return `--flag.${path}=0.7`;
      }
      if (issue.expected === 'boolean') {
        return `--flag.${path}=true`;
      }
      if (issue.expected === 'string') {
        return `--flag.${path}="value"`;
      }
      break;
    
    case 'too_small':
      if (issue.type === 'number') {
        return `--flag.${path}=${issue.minimum}`;
      }
      break;
    
    case 'invalid_enum_value':
      if (issue.options.length > 0) {
        return `--flag.${path}=${issue.options[0]}`;
      }
      break;
  }
  
  return null;
}
