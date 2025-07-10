/**
 * Version detection utilities for distinguishing between AI SDK v4 and v5 models.
 *
 * This file provides type guards and utilities to detect whether a language model
 * implements the LanguageModelV1 (AI SDK v4) or LanguageModelV2 (AI SDK v5) specification.
 */

import type { LanguageModelV1 } from '@ai-sdk/provider';

/**
 * Base interface for any language model with a specification version.
 * This allows us to handle both V1 and V2 models uniformly for version detection.
 */
interface BaseLanguageModel {
  readonly specificationVersion: string;
  readonly provider: string;
  readonly modelId: string;
}

/**
 * Interface for LanguageModelV2 models (AI SDK v5).
 * Note: This interface may be imported from @ai-sdk/provider in the future
 * when LanguageModelV2 types are available.
 */
interface LanguageModelV2 extends BaseLanguageModel {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
}

/**
 * Union type representing any supported language model version.
 */
type SupportedLanguageModel = LanguageModelV1 | LanguageModelV2;

/**
 * Type guard to check if a model implements LanguageModelV1 (AI SDK v4).
 *
 * @param model - The model to check
 * @returns true if the model implements LanguageModelV1
 */
export function isLanguageModelV1(model: unknown): model is LanguageModelV1 {
  return (
    typeof model === 'object' &&
    model !== null &&
    'specificationVersion' in model &&
    (model as any).specificationVersion === 'v1' &&
    'provider' in model &&
    typeof (model as any).provider === 'string' &&
    'modelId' in model &&
    typeof (model as any).modelId === 'string'
  );
}

/**
 * Type guard to check if a model implements LanguageModelV2 (AI SDK v5).
 *
 * @param model - The model to check
 * @returns true if the model implements LanguageModelV2
 */
export function isLanguageModelV2(model: unknown): model is LanguageModelV2 {
  return (
    typeof model === 'object' &&
    model !== null &&
    'specificationVersion' in model &&
    (model as any).specificationVersion === 'v2' &&
    'provider' in model &&
    typeof (model as any).provider === 'string' &&
    'modelId' in model &&
    typeof (model as any).modelId === 'string'
  );
}

/**
 * Utility function to get the specification version from a model.
 * Returns undefined if the model doesn't have a valid specificationVersion.
 *
 * @param model - The model to check
 * @returns The specification version ('v1', 'v2') or undefined
 */
export function getModelSpecificationVersion(model: unknown): 'v1' | 'v2' | undefined {
  if (
    typeof model === 'object' &&
    model !== null &&
    'specificationVersion' in model &&
    typeof (model as any).specificationVersion === 'string'
  ) {
    const version = (model as any).specificationVersion;
    if (version === 'v1' || version === 'v2') {
      return version;
    }
  }
  return undefined;
}

/**
 * Type guard to check if a model implements any supported language model version.
 *
 * @param model - The model to check
 * @returns true if the model implements either LanguageModelV1 or LanguageModelV2
 */
export function isSupportedLanguageModel(model: unknown): model is SupportedLanguageModel {
  return isLanguageModelV1(model) || isLanguageModelV2(model);
}

/**
 * Utility function to determine if we're working with AI SDK v4 vs v5 based on the model.
 *
 * @param model - The model to check
 * @returns Object with version information
 */
export function detectAISDKVersion(model: unknown): {
  isV4: boolean;
  isV5: boolean;
  specificationVersion: 'v1' | 'v2' | undefined;
  isSupported: boolean;
} {
  const specificationVersion = getModelSpecificationVersion(model);
  const isV4 = specificationVersion === 'v1';
  const isV5 = specificationVersion === 'v2';
  const isSupported = isV4 || isV5;

  return {
    isV4,
    isV5,
    specificationVersion,
    isSupported,
  };
}

/**
 * Utility function to safely extract basic model information regardless of version.
 *
 * @param model - The model to extract information from
 * @returns Model information or null if the model is not supported
 */
export function extractModelInfo(model: unknown): {
  provider: string;
  modelId: string;
  specificationVersion: 'v1' | 'v2';
} | null {
  if (!isSupportedLanguageModel(model)) {
    return null;
  }

  return {
    provider: model.provider,
    modelId: model.modelId,
    specificationVersion: model.specificationVersion,
  };
}

// Export the types for use in other modules
export type { BaseLanguageModel, LanguageModelV2, SupportedLanguageModel };
