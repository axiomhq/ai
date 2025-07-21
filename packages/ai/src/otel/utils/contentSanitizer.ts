/**
 * Utilities for sanitizing multimodal content in telemetry data
 * Replaces large binary content with metadata while preserving structure
 */

import { createHash } from 'crypto';

interface ImageMetadata {
  format?: string;
  size_bytes?: number;
  hash: string;
  is_data_url: boolean;
  dimensions?: string;
}

/**
 * Extracts metadata from an image URL (data URL or external URL)
 */
function extractImageMetadata(url: string): ImageMetadata {
  if (url.startsWith('data:')) {
    // Parse data URL: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...
    const [header, base64Data] = url.split(',');
    const formatMatch = header.match(/data:image\/(\w+)/);
    const format = formatMatch?.[1];

    // Estimate size from base64 data
    const sizeBytes = base64Data ? Math.floor((base64Data.length * 3) / 4) : 0;

    // Create a short hash of the content for identification
    const hash = base64Data
      ? createHash('sha256').update(base64Data).digest('hex').slice(0, 16)
      : 'unknown';

    return {
      format,
      size_bytes: sizeBytes,
      hash,
      is_data_url: true,
    };
  } else {
    // External URL - create hash of the URL itself
    const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
    return {
      hash,
      is_data_url: false,
    };
  }
}

/**
 * Sanitizes an image URL by replacing large data URLs with metadata
 */
function sanitizeImageUrl(url: string, detail?: string) {
  const metadata = extractImageMetadata(url);

  if (metadata.is_data_url) {
    // Replace data URL with reference
    const formatPart = metadata.format ? `:${metadata.format}` : '';
    const sizePart = metadata.size_bytes ? `:${metadata.size_bytes}b` : '';
    return {
      url: `[IMAGE${formatPart}${sizePart}:${metadata.hash}]`,
      detail,
      ...metadata,
    };
  } else {
    // Keep external URLs but add metadata
    return {
      url,
      detail,
      ...metadata,
    };
  }
}

type SanitizedContent<T> = T extends readonly unknown[] ? unknown[] : T;

/**
 * Sanitizes any multimodal content for telemetry purposes
 * This is the main function that should be used throughout the codebase
 */
export function sanitizeMultimodalContent<T>(content: T): SanitizedContent<T> {
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && typeof part === 'object' && 'type' in part && part.type === 'image_url') {
        const imagePart = part;
        if (imagePart.image_url?.url) {
          return {
            ...part,
            image_url: sanitizeImageUrl(imagePart.image_url.url, imagePart.image_url.detail),
          };
        }
      }
      return part;
    }) as SanitizedContent<T>;
  }

  return content as SanitizedContent<T>;
}
