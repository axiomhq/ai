/**
 * Provider options support for AI SDK v5 and v4 compatibility.
 * 
 * This module provides comprehensive utilities for handling provider-specific
 * configurations, including conversion between v5 providerOptions and v4 providerMetadata,
 * validation, sanitization, and telemetry attribute mapping.
 */

import type {
  LanguageModelV1ProviderMetadata,
} from '@ai-sdk/provider';
import type { Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';

/**
 * Sanitization levels for provider options
 */
export enum SanitizationLevel {
  /** No sanitization - keep all data */
  NONE = 'none',
  /** Basic sanitization - remove obvious secrets */
  BASIC = 'basic',
  /** Strict sanitization - remove all potentially sensitive data */
  STRICT = 'strict',
  /** Complete sanitization - remove all data except counts */
  COMPLETE = 'complete',
}

/**
 * Provider-specific configuration types
 */
export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  organization?: string;
  project?: string;
  region?: string;
  version?: string;
  features?: string[];
  maxRetries?: number;
  timeout?: number;
  custom?: Record<string, unknown>;
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIProviderConfig extends ProviderConfig {
  provider: 'openai';
  organization?: string;
  project?: string;
  assistantsApiVersion?: string;
  dangerouslyAllowBrowser?: boolean;
  defaultHeaders?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
  httpAgent?: any;
  fetch?: any;
  baseURL?: string;
}

/**
 * Anthropic-specific configuration
 */
export interface AnthropicProviderConfig extends ProviderConfig {
  provider: 'anthropic';
  anthropicVersion?: string;
  dangerouslyAllowBrowser?: boolean;
  defaultHeaders?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
  httpAgent?: any;
  fetch?: any;
  baseURL?: string;
}

/**
 * Google/Gemini-specific configuration
 */
export interface GoogleProviderConfig extends ProviderConfig {
  provider: 'google';
  googleGenerativeAIApiKey?: string;
  dangerouslyAllowBrowser?: boolean;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  requestOptions?: Record<string, unknown>;
  baseURL?: string;
}

/**
 * Azure OpenAI-specific configuration
 */
export interface AzureProviderConfig extends ProviderConfig {
  provider: 'azure';
  azureOpenAIApiKey?: string;
  azureOpenAIApiVersion?: string;
  azureOpenAIApiInstanceName?: string;
  azureOpenAIApiDeploymentName?: string;
  azureOpenAIBasePath?: string;
  azureADTokenProvider?: any;
  dangerouslyAllowBrowser?: boolean;
  defaultHeaders?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
  httpAgent?: any;
  fetch?: any;
}

/**
 * Validation result for provider options
 */
export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: Record<string, unknown>;
  telemetryAttributes?: Record<string, unknown>;
}

/**
 * Configuration for provider option processing
 */
export interface ProviderOptionProcessingConfig {
  validate?: boolean;
  sanitize?: SanitizationLevel;
  extractTelemetry?: boolean;
  preserveUnknown?: boolean;
  strictMode?: boolean;
}

/**
 * Conversion result for provider options
 */
export interface ProviderConversionResult {
  converted: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  metadata: {
    originalFormat: 'v4' | 'v5';
    targetFormat: 'v4' | 'v5';
    provider?: string;
    timestamp: number;
  };
}

/**
 * Sensitive field patterns to sanitize
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /^token$/i, // Only exact "token" field, not "maxTokens"
  /[_-]token$/i, // Fields ending with token
  /password/i,
  /credential/i,
  /auth/i,
  /bearer/i,
  /private[_-]?key/i,
  /access[_-]?key/i,
  /session[_-]?key/i,
  /client[_-]?secret/i,
  /refresh[_-]?token/i,
  /id[_-]?token/i,
  /jwt/i,
  /oauth/i,
  /signature/i,
  /hash/i,
  /cert/i,
  /certificate/i,
];

/**
 * Provider detection patterns
 */
const PROVIDER_PATTERNS = {
  azure: [
    /azure/i,
    /\.openai\.azure\.com/,
    /\.cognitiveservices\.azure\.com/,
    /deployment/i,
    /resource/i,
    /azureOpenAI/i,
  ],
  anthropic: [
    /^sk-ant-/,
    /anthropic/i,
    /claude/i,
    /haiku/i,
    /sonnet/i,
    /opus/i,
  ],
  google: [
    /^AIza/,
    /google/i,
    /gemini/i,
    /bard/i,
    /palm/i,
    /gecko/i,
    /bison/i,
  ],
  openai: [
    /^sk-proj-/,
    /^sk-[a-zA-Z0-9-_]{48}$/,
    /openai/i,
    /gpt-/i,
    /dall-e/i,
    /text-davinci/i,
    /code-davinci/i,
    /whisper/i,
    /tts/i,
  ],
};

/**
 * Detect provider from configuration
 */
export function detectProvider(config: Record<string, unknown>): string | null {
  // Check explicit provider field
  if (config.provider && typeof config.provider === 'string') {
    return config.provider.toLowerCase();
  }

  // Check for provider-specific patterns
  for (const [provider, patterns] of Object.entries(PROVIDER_PATTERNS)) {
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        const matchesPattern = patterns.some(pattern => pattern.test(value));
        if (matchesPattern) {
          return provider;
        }
      }
      
      // Check key names for provider hints
      const keyLower = key.toLowerCase();
      if (patterns.some(pattern => pattern.test(keyLower))) {
        return provider;
      }
    }
  }

  return null;
}

/**
 * Check if a field is sensitive based on patterns
 */
export function isSensitiveField(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Sanitize provider options based on sanitization level
 */
export function sanitizeProviderOptions(
  options: Record<string, unknown>,
  level: SanitizationLevel = SanitizationLevel.BASIC,
): Record<string, unknown> {
  if (level === SanitizationLevel.NONE) {
    return { ...options };
  }

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(options)) {
    switch (level) {
      case SanitizationLevel.BASIC:
        if (isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeValue(value, level);
        }
        break;
        
      case SanitizationLevel.STRICT:
        if (isSensitiveField(key) || isPersonalData(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (isConfigurationData(key)) {
          sanitized[key] = sanitizeValue(value, level);
        } else {
          sanitized[key] = '[FILTERED]';
        }
        break;
        
      case SanitizationLevel.COMPLETE:
        if (isCountableData(key)) {
          sanitized[key] = typeof value === 'number' ? value : 1;
        } else if (isBooleanData(key)) {
          sanitized[key] = Boolean(value);
        } else {
          sanitized[key] = '[OMITTED]';
        }
        break;
    }
  }

  return sanitized;
}

/**
 * Sanitize a value recursively
 */
function sanitizeValue(value: unknown, level: SanitizationLevel): unknown {
  if (typeof value === 'string') {
    // Only check if string looks like a secret in strict modes
    if (level === SanitizationLevel.STRICT || level === SanitizationLevel.COMPLETE) {
      if (value.length > 20 && /^[a-zA-Z0-9_-]+$/.test(value)) {
        return '[REDACTED]';
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, level));
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(val, level);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Check if a field contains personal data
 */
function isPersonalData(key: string): boolean {
  const personalPatterns = [
    /user[_-]?id/i,
    /username/i,
    /email/i,
    /phone/i,
    /address/i,
    /^name$/i, // Only exact 'name' field, not 'modelName' etc
    /^organization$/i, // OpenAI organization field
    /profile/i,
    /personal/i,
    /private/i,
  ];
  return personalPatterns.some(pattern => pattern.test(key));
}

/**
 * Check if a field contains configuration data
 */
function isConfigurationData(key: string): boolean {
  const configPatterns = [
    /version/i,
    /timeout/i,
    /retry/i,
    /retries/i,
    /url/i,
    /endpoint/i,
    /region/i,
    /model/i,
    /temperature/i,
    /max[_-]?tokens/i,
    /top[_-]?[pk]/i,
    /frequency[_-]?penalty/i,
    /presence[_-]?penalty/i,
  ];
  return configPatterns.some(pattern => pattern.test(key));
}

/**
 * Check if a field contains countable data
 */
function isCountableData(key: string): boolean {
  const countPatterns = [
    /count/i,
    /size/i,
    /length/i,
    /max/i,
    /min/i,
    /limit/i,
    /retry/i,
    /retries/i,
    /timeout/i,
    /tokens/i,
  ];
  return countPatterns.some(pattern => pattern.test(key));
}

/**
 * Check if a field contains boolean data
 */
function isBooleanData(key: string): boolean {
  const booleanPatterns = [
    /enabled?/i,
    /disabled?/i,
    /allow/i,
    /deny/i,
    /is[A-Z]/,
    /has[A-Z]/,
    /can[A-Z]/,
    /should[A-Z]/,
    /strict/i,
    /debug/i,
    /verbose/i,
    /dangerous/i,
  ];
  return booleanPatterns.some(pattern => pattern.test(key));
}

/**
 * Convert v5 providerOptions to v4 providerMetadata
 */
export function convertProviderOptionsToV4(
  providerOptions?: Record<string, unknown>,
  config: ProviderOptionProcessingConfig = {},
): ProviderConversionResult {
  const result: ProviderConversionResult = {
    converted: {},
    errors: [],
    warnings: [],
    metadata: {
      originalFormat: 'v5',
      targetFormat: 'v4',
      timestamp: Date.now(),
    },
  };

  if (!providerOptions || typeof providerOptions !== 'object') {
    return result;
  }

  try {
    // Detect provider
    const provider = detectProvider(providerOptions);
    if (provider) {
      result.metadata.provider = provider;
    }

    // Basic conversion - v5 providerOptions become v4 providerMetadata
    result.converted = { ...providerOptions };

    // Validate if requested
    if (config.validate) {
      const validation = validateProviderOptions(result.converted, provider);
      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      }
    }

    // Sanitize if requested
    if (config.sanitize && config.sanitize !== SanitizationLevel.NONE) {
      result.converted = sanitizeProviderOptions(result.converted, config.sanitize);
    }

    // Handle provider-specific transformations
    if (provider) {
      result.converted = transformProviderOptions(result.converted, provider, 'v4');
    }

  } catch (error) {
    result.errors.push(`Failed to convert provider options: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Convert v4 providerMetadata to v5 providerOptions
 */
export function convertProviderMetadataToV5(
  providerMetadata?: LanguageModelV1ProviderMetadata,
  config: ProviderOptionProcessingConfig = {},
): ProviderConversionResult {
  const result: ProviderConversionResult = {
    converted: {},
    errors: [],
    warnings: [],
    metadata: {
      originalFormat: 'v4',
      targetFormat: 'v5',
      timestamp: Date.now(),
    },
  };

  if (!providerMetadata || typeof providerMetadata !== 'object') {
    return result;
  }

  try {
    // Detect provider
    const provider = detectProvider(providerMetadata);
    if (provider) {
      result.metadata.provider = provider;
    }

    // Basic conversion - v4 providerMetadata become v5 providerOptions
    result.converted = { ...providerMetadata };

    // Validate if requested
    if (config.validate) {
      const validation = validateProviderOptions(result.converted, provider);
      if (!validation.isValid) {
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      }
    }

    // Sanitize if requested
    if (config.sanitize && config.sanitize !== SanitizationLevel.NONE) {
      result.converted = sanitizeProviderOptions(result.converted, config.sanitize);
    }

    // Handle provider-specific transformations
    if (provider) {
      result.converted = transformProviderOptions(result.converted, provider, 'v5');
    }

  } catch (error) {
    result.errors.push(`Failed to convert provider metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Transform provider options for specific providers
 */
function transformProviderOptions(
  options: Record<string, unknown>,
  provider: string,
  targetVersion: 'v4' | 'v5',
): Record<string, unknown> {
  const transformed = { ...options };

  switch (provider) {
    case 'openai':
      return transformOpenAIOptions(transformed, targetVersion);
    case 'anthropic':
      return transformAnthropicOptions(transformed, targetVersion);
    case 'google':
      return transformGoogleOptions(transformed, targetVersion);
    case 'azure':
      return transformAzureOptions(transformed, targetVersion);
    default:
      return transformed;
  }
}

/**
 * Transform OpenAI-specific options
 */
function transformOpenAIOptions(
  options: Record<string, unknown>,
  targetVersion: 'v4' | 'v5',
): Record<string, unknown> {
  const transformed = { ...options };

  // Handle organization/project fields
  if (targetVersion === 'v4' && transformed.organization) {
    transformed['openai-organization'] = transformed.organization;
    delete transformed.organization;
  } else if (targetVersion === 'v5' && transformed['openai-organization']) {
    transformed.organization = transformed['openai-organization'];
    delete transformed['openai-organization'];
  }

  if (targetVersion === 'v4' && transformed.project) {
    transformed['openai-project'] = transformed.project;
    delete transformed.project;
  } else if (targetVersion === 'v5' && transformed['openai-project']) {
    transformed.project = transformed['openai-project'];
    delete transformed['openai-project'];
  }

  return transformed;
}

/**
 * Transform Anthropic-specific options
 */
function transformAnthropicOptions(
  options: Record<string, unknown>,
  targetVersion: 'v4' | 'v5',
): Record<string, unknown> {
  const transformed = { ...options };

  // Handle Anthropic version
  if (targetVersion === 'v4' && transformed.anthropicVersion) {
    transformed['anthropic-version'] = transformed.anthropicVersion;
  } else if (targetVersion === 'v5' && transformed['anthropic-version']) {
    transformed.anthropicVersion = transformed['anthropic-version'];
    delete transformed['anthropic-version'];
  }

  return transformed;
}

/**
 * Transform Google-specific options
 */
function transformGoogleOptions(
  options: Record<string, unknown>,
  targetVersion: 'v4' | 'v5',
): Record<string, unknown> {
  const transformed = { ...options };

  // Handle Google API key
  if (targetVersion === 'v4' && transformed.googleGenerativeAIApiKey) {
    transformed['google-api-key'] = transformed.googleGenerativeAIApiKey;
  } else if (targetVersion === 'v5' && transformed['google-api-key']) {
    transformed.googleGenerativeAIApiKey = transformed['google-api-key'];
    delete transformed['google-api-key'];
  }

  return transformed;
}

/**
 * Transform Azure-specific options
 */
function transformAzureOptions(
  options: Record<string, unknown>,
  targetVersion: 'v4' | 'v5',
): Record<string, unknown> {
  const transformed = { ...options };

  // Handle Azure-specific fields
  const azureFields = [
    'azureOpenAIApiKey',
    'azureOpenAIApiVersion',
    'azureOpenAIApiInstanceName',
    'azureOpenAIApiDeploymentName',
    'azureOpenAIBasePath',
  ];

  for (const field of azureFields) {
    const kebabField = field.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    if (targetVersion === 'v4' && transformed[field]) {
      transformed[kebabField] = transformed[field];
      delete transformed[field];
    } else if (targetVersion === 'v5' && transformed[kebabField]) {
      transformed[field] = transformed[kebabField];
      delete transformed[kebabField];
    }
  }

  return transformed;
}

/**
 * Validate provider options
 */
export function validateProviderOptions(
  options: Record<string, unknown>,
  provider?: string | null,
): ProviderValidationResult {
  const result: ProviderValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!options || typeof options !== 'object') {
    result.isValid = false;
    result.errors.push('Provider options must be an object');
    return result;
  }

  // Check for circular references
  try {
    JSON.stringify(options);
  } catch (error) {
    result.isValid = false;
    result.errors.push('Provider options contain circular references');
    return result;
  }

  // Provider-specific validation
  if (provider) {
    switch (provider) {
      case 'openai':
        validateOpenAIOptions(options, result);
        break;
      case 'anthropic':
        validateAnthropicOptions(options, result);
        break;
      case 'google':
        validateGoogleOptions(options, result);
        break;
      case 'azure':
        validateAzureOptions(options, result);
        break;
    }
  }

  // Generic validation
  validateGenericOptions(options, result);

  // Set isValid based on whether there are errors
  if (result.errors.length > 0) {
    result.isValid = false;
  }

  return result;
}

/**
 * Validate OpenAI-specific options
 */
function validateOpenAIOptions(
  options: Record<string, unknown>,
  result: ProviderValidationResult,
): void {
  // Check for required fields
  if (options.apiKey && typeof options.apiKey === 'string') {
    if (!options.apiKey.startsWith('sk-')) {
      result.warnings.push('OpenAI API key should start with "sk-"');
    }
  }

  // Check organization format
  if (options.organization && typeof options.organization === 'string') {
    if (!options.organization.startsWith('org-')) {
      result.warnings.push('OpenAI organization ID should start with "org-"');
    }
  }

  // Check project format
  if (options.project && typeof options.project === 'string') {
    if (!options.project.startsWith('proj_')) {
      result.warnings.push('OpenAI project ID should start with "proj_"');
    }
  }

  // Check deprecated fields
  if (options.dangerouslyAllowBrowser) {
    result.warnings.push('dangerouslyAllowBrowser is deprecated in newer versions');
  }
}

/**
 * Validate Anthropic-specific options
 */
function validateAnthropicOptions(
  options: Record<string, unknown>,
  result: ProviderValidationResult,
): void {
  // Check for required fields
  if (options.apiKey && typeof options.apiKey === 'string') {
    if (!options.apiKey.startsWith('sk-ant-')) {
      result.warnings.push('Anthropic API key should start with "sk-ant-"');
    }
  }

  // Check version format
  if (options.anthropicVersion && typeof options.anthropicVersion === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(options.anthropicVersion)) {
      result.warnings.push('Anthropic version should be in YYYY-MM-DD format');
    }
  }
}

/**
 * Validate Google-specific options
 */
function validateGoogleOptions(
  options: Record<string, unknown>,
  result: ProviderValidationResult,
): void {
  // Check for required fields
  if (options.googleGenerativeAIApiKey && typeof options.googleGenerativeAIApiKey === 'string') {
    if (!options.googleGenerativeAIApiKey.startsWith('AIza')) {
      result.warnings.push('Google API key should start with "AIza"');
    }
  }

  // Check safety settings
  if (options.safetySettings && Array.isArray(options.safetySettings)) {
    for (const [index, setting] of options.safetySettings.entries()) {
      if (typeof setting !== 'object' || !setting.category || !setting.threshold) {
        result.errors.push(`Safety setting at index ${index} is invalid`);
      }
    }
  }
}

/**
 * Validate Azure-specific options
 */
function validateAzureOptions(
  options: Record<string, unknown>,
  result: ProviderValidationResult,
): void {
  // Check for required Azure fields
  const requiredFields = ['azureOpenAIApiKey', 'azureOpenAIApiInstanceName'];
  for (const field of requiredFields) {
    if (!options[field]) {
      result.warnings.push(`Azure configuration missing ${field}`);
    }
  }

  // Check API version format
  if (options.azureOpenAIApiVersion && typeof options.azureOpenAIApiVersion === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}(-preview)?$/.test(options.azureOpenAIApiVersion)) {
      result.warnings.push('Azure API version should be in YYYY-MM-DD format');
    }
  }

  // Check instance name format
  if (options.azureOpenAIApiInstanceName && typeof options.azureOpenAIApiInstanceName === 'string') {
    if (!/^[a-zA-Z0-9-]+$/.test(options.azureOpenAIApiInstanceName)) {
      result.warnings.push('Azure instance name should only contain alphanumeric characters and hyphens');
    }
  }
}

/**
 * Validate generic options
 */
function validateGenericOptions(
  options: Record<string, unknown>,
  result: ProviderValidationResult,
): void {
  // Check timeout values
  if (options.timeout && typeof options.timeout === 'number') {
    if (options.timeout < 0) {
      result.errors.push('Timeout must be a positive number');
    } else if (options.timeout > 300000) {
      result.warnings.push('Timeout is very high (>5 minutes)');
    }
  }

  // Check retry values
  if (options.maxRetries && typeof options.maxRetries === 'number') {
    if (options.maxRetries < 0) {
      result.errors.push('Max retries must be a positive number');
    } else if (options.maxRetries > 10) {
      result.warnings.push('Max retries is very high (>10)');
    }
  }

  // Check for unknown sensitive fields
  for (const [key, value] of Object.entries(options)) {
    if (isSensitiveField(key) && typeof value === 'string' && value.length > 100) {
      result.warnings.push(`Field "${key}" appears to contain sensitive data`);
    }
  }
}

/**
 * Extract telemetry-safe configuration attributes
 */
export function extractProviderConfig(
  options: Record<string, unknown>,
  provider?: string | null,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  // Always sanitize for telemetry
  const sanitized = sanitizeProviderOptions(options, SanitizationLevel.BASIC);

  // Extract safe configuration attributes
  for (const [key, value] of Object.entries(sanitized)) {
    if (isConfigurationData(key) && !isSensitiveField(key)) {
      config[key] = value;
    }
  }

  // Add provider info
  if (provider) {
    config.provider = provider;
  }

  // Add counts and boolean flags
  config.option_count = Object.keys(options).length;
  config.has_api_key = Boolean(options.apiKey);
  config.has_custom_url = Boolean(options.baseURL || options.apiUrl);
  config.has_timeout = Boolean(options.timeout);
  config.has_retries = Boolean(options.maxRetries);

  return config;
}

/**
 * Set provider configuration attributes on a span
 */
export function setProviderConfigAttributes(
  span: Span,
  options: Record<string, unknown>,
  provider?: string | null,
): void {
  try {
    const config = extractProviderConfig(options, provider);
    
    // Set provider attributes
    if (provider) {
      span.setAttribute(Attr.GenAI.Provider, provider);
    }

    // Set configuration attributes with prefix
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        span.setAttribute(`gen_ai.provider.config.${key}`, value);
      }
    }

  } catch (error) {
    console.warn('Failed to set provider config attributes:', error);
  }
}

/**
 * Legacy conversion function for backward compatibility
 */
export function convertProviderOptions(
  providerOptions?: Record<string, unknown>,
): LanguageModelV1ProviderMetadata | undefined {
  if (!providerOptions) {
    return undefined;
  }

  const result = convertProviderOptionsToV4(providerOptions, {
    sanitize: SanitizationLevel.NONE,
    validate: false,
  });

  if (result.errors.length > 0) {
    console.warn('Provider options conversion errors:', result.errors);
  }

  return result.converted as LanguageModelV1ProviderMetadata;
}

/**
 * Check if provider options are safely serializable
 */
export function isSerializableProviderOptions(options: Record<string, unknown>): boolean {
  try {
    JSON.stringify(options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get provider option summary for logging
 */
export function getProviderOptionSummary(options: Record<string, unknown>): string {
  const provider = detectProvider(options);
  const sanitized = sanitizeProviderOptions(options, SanitizationLevel.COMPLETE);
  const keyCount = Object.keys(options).length;
  
  return `Provider: ${provider || 'unknown'}, Options: ${keyCount}, Sanitized: ${JSON.stringify(sanitized)}`;
}

/**
 * Default provider option processing configuration
 */
export const DEFAULT_PROVIDER_CONFIG: ProviderOptionProcessingConfig = {
  validate: true,
  sanitize: SanitizationLevel.BASIC,
  extractTelemetry: true,
  preserveUnknown: false,
  strictMode: false,
};
