/**
 * Tests for provider options utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  convertProviderOptionsToV4,
  convertProviderMetadataToV5,
  validateProviderOptions,
  sanitizeProviderOptions,
  detectProvider,
  extractProviderConfig,
  setProviderConfigAttributes,
  SanitizationLevel,
  isSensitiveField,
  isSerializableProviderOptions,
  getProviderOptionSummary,
  DEFAULT_PROVIDER_CONFIG,
  type ProviderValidationResult,
  type ProviderConversionResult,
  type OpenAIProviderConfig,
  type AnthropicProviderConfig,
  type GoogleProviderConfig,
  type AzureProviderConfig,
} from '../../src/otel/provider-options';

describe('Provider Detection', () => {
  it('should detect OpenAI provider', () => {
    expect(detectProvider({ provider: 'openai' })).toBe('openai');
    expect(detectProvider({ apiKey: 'sk-proj-abc123' })).toBe('openai');
    expect(detectProvider({ apiKey: 'sk-abcdef1234567890' })).toBe('openai');
    expect(detectProvider({ modelId: 'gpt-4' })).toBe('openai');
    expect(detectProvider({ organization: 'org-abc123' })).toBe('openai');
  });

  it('should detect Anthropic provider', () => {
    expect(detectProvider({ provider: 'anthropic' })).toBe('anthropic');
    expect(detectProvider({ apiKey: 'sk-ant-abc123' })).toBe('anthropic');
    expect(detectProvider({ modelId: 'claude-3-sonnet' })).toBe('anthropic');
    expect(detectProvider({ anthropicVersion: '2023-06-01' })).toBe('anthropic');
  });

  it('should detect Google provider', () => {
    expect(detectProvider({ provider: 'google' })).toBe('google');
    expect(detectProvider({ googleGenerativeAIApiKey: 'AIzaSyAbc123' })).toBe('google');
    expect(detectProvider({ modelId: 'gemini-pro' })).toBe('google');
  });

  it('should detect Azure provider', () => {
    expect(detectProvider({ provider: 'azure' })).toBe('azure');
    expect(detectProvider({ baseURL: 'https://example.openai.azure.com' })).toBe('azure');
    expect(detectProvider({ azureOpenAIApiKey: 'abc123' })).toBe('azure');
  });

  it('should return null for unknown provider', () => {
    expect(detectProvider({ customOption: 'value' })).toBeNull();
    expect(detectProvider({})).toBeNull();
  });
});

describe('Sensitive Field Detection', () => {
  it('should detect sensitive fields', () => {
    expect(isSensitiveField('apiKey')).toBe(true);
    expect(isSensitiveField('api_key')).toBe(true);
    expect(isSensitiveField('API_KEY')).toBe(true);
    expect(isSensitiveField('secret')).toBe(true);
    expect(isSensitiveField('token')).toBe(true);
    expect(isSensitiveField('password')).toBe(true);
    expect(isSensitiveField('credential')).toBe(true);
    expect(isSensitiveField('auth')).toBe(true);
    expect(isSensitiveField('privateKey')).toBe(true);
    expect(isSensitiveField('client_secret')).toBe(true);
  });

  it('should not detect non-sensitive fields', () => {
    expect(isSensitiveField('modelId')).toBe(false);
    expect(isSensitiveField('temperature')).toBe(false);
    expect(isSensitiveField('maxTokens')).toBe(false);
    expect(isSensitiveField('provider')).toBe(false);
    expect(isSensitiveField('timeout')).toBe(false);
  });
});

describe('Sanitization', () => {
  const testOptions = {
    apiKey: 'sk-proj-abc123xyz789',
    modelId: 'gpt-4',
    temperature: 0.7,
    maxTokens: 100,
    organization: 'org-abc123',
    timeout: 30000,
    customSecret: 'very-secret-value',
    nestedConfig: {
      apiKey: 'nested-secret',
      publicValue: 'public',
    },
  };

  it('should not sanitize with NONE level', () => {
    const result = sanitizeProviderOptions(testOptions, SanitizationLevel.NONE);
    expect(result).toEqual(testOptions);
  });

  it('should sanitize sensitive fields with BASIC level', () => {
    const result = sanitizeProviderOptions(testOptions, SanitizationLevel.BASIC);
    
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.customSecret).toBe('[REDACTED]');
    expect(result.modelId).toBe('gpt-4');
    expect(result.temperature).toBe(0.7);
    expect(result.nestedConfig).toEqual({
      apiKey: '[REDACTED]',
      publicValue: 'public',
    });
  });

  it('should sanitize more fields with STRICT level', () => {
    const result = sanitizeProviderOptions(testOptions, SanitizationLevel.STRICT);
    
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.customSecret).toBe('[REDACTED]');
    expect(result.organization).toBe('[REDACTED]'); // Personal data
    expect(result.temperature).toBe(0.7); // Configuration data
    expect(result.timeout).toBe(30000); // Configuration data
  });

  it('should sanitize most fields with COMPLETE level', () => {
    const result = sanitizeProviderOptions(testOptions, SanitizationLevel.COMPLETE);
    
    expect(result.apiKey).toBe('[OMITTED]');
    expect(result.modelId).toBe('[OMITTED]');
    expect(result.temperature).toBe('[OMITTED]');
    expect(result.maxTokens).toBe(100); // Countable data
    expect(result.timeout).toBe(30000); // Countable data
  });
});

describe('Provider Options Validation', () => {
  it('should validate valid OpenAI options', () => {
    const options: OpenAIProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      organization: 'org-abc123',
      project: 'proj_abc123',
      timeout: 30000,
      maxRetries: 3,
    };

    const result = validateProviderOptions(options, 'openai');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should warn about invalid OpenAI API key format', () => {
    const options = {
      provider: 'openai',
      apiKey: 'invalid-key',
    };

    const result = validateProviderOptions(options, 'openai');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('OpenAI API key should start with "sk-"');
  });

  it('should warn about invalid organization format', () => {
    const options = {
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      organization: 'invalid-org',
    };

    const result = validateProviderOptions(options, 'openai');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('OpenAI organization ID should start with "org-"');
  });

  it('should validate valid Anthropic options', () => {
    const options: AnthropicProviderConfig = {
      provider: 'anthropic',
      apiKey: 'sk-ant-abc123',
      anthropicVersion: '2023-06-01',
    };

    const result = validateProviderOptions(options, 'anthropic');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should warn about invalid Anthropic API key format', () => {
    const options = {
      provider: 'anthropic',
      apiKey: 'invalid-key',
    };

    const result = validateProviderOptions(options, 'anthropic');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('Anthropic API key should start with "sk-ant-"');
  });

  it('should warn about invalid Anthropic version format', () => {
    const options = {
      provider: 'anthropic',
      apiKey: 'sk-ant-abc123',
      anthropicVersion: 'invalid-version',
    };

    const result = validateProviderOptions(options, 'anthropic');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('Anthropic version should be in YYYY-MM-DD format');
  });

  it('should validate valid Google options', () => {
    const options: GoogleProviderConfig = {
      provider: 'google',
      googleGenerativeAIApiKey: 'AIzaSyAbc123',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const result = validateProviderOptions(options, 'google');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should warn about invalid Google API key format', () => {
    const options = {
      provider: 'google',
      googleGenerativeAIApiKey: 'invalid-key',
    };

    const result = validateProviderOptions(options, 'google');
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain('Google API key should start with "AIza"');
  });

  it('should validate Azure options', () => {
    const options: AzureProviderConfig = {
      provider: 'azure',
      azureOpenAIApiKey: 'abc123',
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiInstanceName: 'my-instance',
    };

    const result = validateProviderOptions(options, 'azure');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should error on invalid timeout', () => {
    const options = {
      provider: 'openai',
      timeout: -1000,
    };

    const result = validateProviderOptions(options);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Timeout must be a positive number');
  });

  it('should error on invalid maxRetries', () => {
    const options = {
      provider: 'openai',
      maxRetries: -5,
    };

    const result = validateProviderOptions(options);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Max retries must be a positive number');
  });

  it('should error on circular references', () => {
    const options: any = { provider: 'openai' };
    options.circular = options;

    const result = validateProviderOptions(options);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Provider options contain circular references');
  });
});

describe('Provider Options Conversion', () => {
  it('should convert v5 providerOptions to v4 providerMetadata', () => {
    const v5Options = {
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      organization: 'org-abc123',
      temperature: 0.7,
    };

    const result = convertProviderOptionsToV4(v5Options);
    
    expect(result.converted).toEqual({
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      'openai-organization': 'org-abc123',
      temperature: 0.7,
    });
    expect(result.metadata.originalFormat).toBe('v5');
    expect(result.metadata.targetFormat).toBe('v4');
    expect(result.metadata.provider).toBe('openai');
    expect(result.errors).toEqual([]);
  });

  it('should convert v4 providerMetadata to v5 providerOptions', () => {
    const v4Metadata = {
      provider: 'anthropic',
      apiKey: 'sk-ant-abc123',
      'anthropic-version': '2023-06-01',
    };

    const result = convertProviderMetadataToV5(v4Metadata);
    
    expect(result.converted).toEqual({
      provider: 'anthropic',
      apiKey: 'sk-ant-abc123',
      anthropicVersion: '2023-06-01',
    });
    expect(result.metadata.originalFormat).toBe('v4');
    expect(result.metadata.targetFormat).toBe('v5');
    expect(result.metadata.provider).toBe('anthropic');
    expect(result.errors).toEqual([]);
  });

  it('should handle OpenAI-specific transformations', () => {
    const v5Options = {
      provider: 'openai',
      organization: 'org-abc123',
      project: 'proj_abc123',
    };

    const result = convertProviderOptionsToV4(v5Options);
    
    expect(result.converted).toEqual({
      provider: 'openai',
      'openai-organization': 'org-abc123',
      'openai-project': 'proj_abc123',
    });
  });

  it('should handle Azure-specific transformations', () => {
    const v5Options = {
      provider: 'azure',
      azureOpenAIApiKey: 'abc123',
      azureOpenAIApiVersion: '2023-05-15',
    };

    const result = convertProviderOptionsToV4(v5Options);
    
    expect(result.converted).toEqual({
      provider: 'azure',
      'azure-open-a-i-api-key': 'abc123',
      'azure-open-a-i-api-version': '2023-05-15',
    });
  });

  it('should validate during conversion if requested', () => {
    const invalidOptions = {
      provider: 'openai',
      timeout: -1000,
    };

    const result = convertProviderOptionsToV4(invalidOptions, {
      validate: true,
    });
    
    expect(result.errors).toContain('Timeout must be a positive number');
  });

  it('should sanitize during conversion if requested', () => {
    const optionsWithSecrets = {
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      publicValue: 'public',
    };

    const result = convertProviderOptionsToV4(optionsWithSecrets, {
      sanitize: SanitizationLevel.BASIC,
    });
    
    expect(result.converted.apiKey).toBe('[REDACTED]');
    expect(result.converted.publicValue).toBe('public');
  });
});

describe('Provider Config Extraction', () => {
  it('should extract safe configuration attributes', () => {
    const options = {
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      temperature: 0.7,
      maxTokens: 100,
      timeout: 30000,
      maxRetries: 3,
      baseURL: 'https://api.openai.com',
      secretValue: 'secret',
    };

    const config = extractProviderConfig(options, 'openai');
    
    expect(config.provider).toBe('openai');
    expect(config.temperature).toBe(0.7);
    expect(config.maxTokens).toBe(100);
    expect(config.timeout).toBe(30000);
    expect(config.maxRetries).toBe(3);
    expect(config.option_count).toBe(8);
    expect(config.has_api_key).toBe(true);
    expect(config.has_custom_url).toBe(true);
    expect(config.has_timeout).toBe(true);
    expect(config.has_retries).toBe(true);
    expect(config.secretValue).toBeUndefined();
  });

  it('should handle empty options', () => {
    const config = extractProviderConfig({});
    
    expect(config.option_count).toBe(0);
    expect(config.has_api_key).toBe(false);
    expect(config.has_custom_url).toBe(false);
    expect(config.has_timeout).toBe(false);
    expect(config.has_retries).toBe(false);
  });
});

describe('Span Attributes', () => {
  it('should set provider config attributes on span', () => {
    const mockSpan = {
      setAttribute: vi.fn(),
    };

    const options = {
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 100,
    };

    setProviderConfigAttributes(mockSpan as any, options, 'openai');
    
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.provider', 'openai');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.provider.config.temperature', 0.7);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.provider.config.maxTokens', 100);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.provider.config.option_count', 3);
  });

  it('should handle errors gracefully', () => {
    const mockSpan = {
      setAttribute: vi.fn().mockImplementation(() => {
        throw new Error('Span error');
      }),
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const options = { provider: 'openai' };
    setProviderConfigAttributes(mockSpan as any, options, 'openai');
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to set provider config attributes:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

describe('Utility Functions', () => {
  it('should check if options are serializable', () => {
    expect(isSerializableProviderOptions({ provider: 'openai' })).toBe(true);
    
    const circular: any = { provider: 'openai' };
    circular.circular = circular;
    expect(isSerializableProviderOptions(circular)).toBe(false);
  });

  it('should generate provider option summary', () => {
    const options = {
      provider: 'openai',
      apiKey: 'sk-proj-abc123',
      temperature: 0.7,
    };

    const summary = getProviderOptionSummary(options);
    
    expect(summary).toContain('Provider: openai');
    expect(summary).toContain('Options: 3');
    expect(summary).toContain('Sanitized:');
  });

  it('should have sensible default configuration', () => {
    expect(DEFAULT_PROVIDER_CONFIG).toEqual({
      validate: true,
      sanitize: SanitizationLevel.BASIC,
      extractTelemetry: true,
      preserveUnknown: false,
      strictMode: false,
    });
  });
});

describe('Error Handling', () => {
  it('should handle null/undefined provider options', () => {
    expect(convertProviderOptionsToV4(undefined).converted).toEqual({});
    expect(convertProviderOptionsToV4(null as any).converted).toEqual({});
    expect(convertProviderMetadataToV5(undefined).converted).toEqual({});
  });

  it('should handle non-object provider options', () => {
    expect(convertProviderOptionsToV4('string' as any).converted).toEqual({});
    expect(convertProviderOptionsToV4(123 as any).converted).toEqual({});
    expect(convertProviderOptionsToV4(true as any).converted).toEqual({});
  });

  it('should handle validation errors gracefully', () => {
    const invalidOptions = {
      provider: 'openai',
      timeout: -1000,
    };

    const result = validateProviderOptions(invalidOptions);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  it('should handle empty arrays in safety settings', () => {
    const options = {
      provider: 'google',
      safetySettings: [],
    };

    const result = validateProviderOptions(options, 'google');
    expect(result.isValid).toBe(true);
  });

  it('should handle very large option objects', () => {
    const largeOptions: Record<string, unknown> = {
      provider: 'openai',
    };

    // Add 1000 options
    for (let i = 0; i < 1000; i++) {
      largeOptions[`option_${i}`] = `value_${i}`;
    }

    const result = convertProviderOptionsToV4(largeOptions);
    expect(result.errors).toEqual([]);
    expect(Object.keys(result.converted).length).toBe(1001);
  });

  it('should handle deeply nested options', () => {
    const deepOptions = {
      provider: 'openai',
      level1: {
        level2: {
          level3: {
            level4: {
              apiKey: 'secret',
              publicValue: 'public',
            },
          },
        },
      },
    };

    const sanitized = sanitizeProviderOptions(deepOptions, SanitizationLevel.BASIC);
    expect(sanitized.level1.level2.level3.level4.apiKey).toBe('[REDACTED]');
    expect(sanitized.level1.level2.level3.level4.publicValue).toBe('public');
  });

  it('should handle array values in options', () => {
    const options = {
      provider: 'google',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
      mySecrets: ['secret1', 'secret2'],
    };

    const sanitized = sanitizeProviderOptions(options, SanitizationLevel.BASIC);
    expect(sanitized.safetySettings).toEqual(options.safetySettings);
    expect(sanitized.mySecrets).toEqual(['[REDACTED]', '[REDACTED]']);
  });
});
