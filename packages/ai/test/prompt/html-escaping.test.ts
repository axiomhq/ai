import { describe, it, expect } from 'vitest';
import { handlebarsParse } from '../../src/prompt/parsers/handlebars';

describe('Handlebars HTML escaping', () => {
  it('should not HTML-escape special characters in APL queries', async () => {
    const template = 'Explain this APL query:\n{{query}}';
    const context = {
      query: "['logs'] | where ['severity'] == \"error\"",
    };

    const result = await handlebarsParse(template, { context });

    // Should NOT contain HTML entities
    expect(result).not.toContain('&#x27;');
    expect(result).not.toContain('&#x3D;');
    expect(result).not.toContain('&quot;');

    // Should contain the original characters
    expect(result).toContain("['logs']");
    expect(result).toContain("['severity']");
    expect(result).toContain('==');
    expect(result).toContain('"error"');

    // Exact match
    expect(result).toBe("Explain this APL query:\n['logs'] | where ['severity'] == \"error\"");
  });

  it('should preserve special characters in user content', async () => {
    const template = '{{#if subject}}Subject: {{subject}}\n{{/if}}Content: {{content}}';
    const context = {
      subject: 'Query Help',
      content: 'How do I use [\'field\'] == "value" in APL?',
    };

    const result = await handlebarsParse(template, { context });

    // Should not escape quotes or brackets
    expect(result).not.toContain('&#x27;');
    expect(result).not.toContain('&quot;');
    expect(result).toContain("['field']");
    expect(result).toContain('"value"');
    expect(result).toBe(
      'Subject: Query Help\nContent: How do I use [\'field\'] == "value" in APL?',
    );
  });

  it('should handle mixed special characters', async () => {
    const template = '{{message}}';
    const context = {
      message: '<script>alert("XSS")</script> & special chars: \', ", =, <, >',
    };

    const result = await handlebarsParse(template, { context });

    // Should NOT escape HTML entities (we're generating for AI models, not HTML)
    expect(result).not.toContain('&lt;');
    expect(result).not.toContain('&gt;');
    expect(result).not.toContain('&quot;');
    expect(result).not.toContain('&#x27;');
    expect(result).not.toContain('&amp;');

    // Should preserve original characters
    expect(result).toBe('<script>alert("XSS")</script> & special chars: \', ", =, <, >');
  });

  it('should handle nested conditionals with special characters', async () => {
    const template = '{{#if hasQuery}}Query: {{query}}{{else}}No query{{/if}}';
    const context = {
      hasQuery: true,
      query: "['dataset'] | where ['field'] == 'value'",
    };

    const result = await handlebarsParse(template, { context });

    expect(result).not.toContain('&#x27;');
    expect(result).toBe("Query: ['dataset'] | where ['field'] == 'value'");
  });
});
