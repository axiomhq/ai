/**
 * 🚨 CAN REMOVE AFTER THIS GETS MERGED https://github.com/vercel/ai/pull/6747
 */

import type { ImageModelV1 } from '@ai-sdk/providerv1';
import { notImplemented } from './TEMP_not-implemented';

export class MockImageModelV1 implements ImageModelV1 {
  readonly specificationVersion = 'v1';
  readonly provider: ImageModelV1['provider'];
  readonly modelId: ImageModelV1['modelId'];
  readonly maxImagesPerCall: ImageModelV1['maxImagesPerCall'];

  doGenerate: ImageModelV1['doGenerate'];

  constructor({
    provider = 'mock-provider',
    modelId = 'mock-model-id',
    maxImagesPerCall = 1,
    doGenerate = notImplemented,
  }: {
    provider?: ImageModelV1['provider'];
    modelId?: ImageModelV1['modelId'];
    maxImagesPerCall?: ImageModelV1['maxImagesPerCall'];
    doGenerate?: ImageModelV1['doGenerate'];
  } = {}) {
    this.provider = provider;
    this.modelId = modelId;
    this.maxImagesPerCall = maxImagesPerCall;
    this.doGenerate = doGenerate;
  }
}
