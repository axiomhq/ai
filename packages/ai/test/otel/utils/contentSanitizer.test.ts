import { describe, it, expect } from 'vitest';
import { sanitizeMultimodalContent } from '../../../src/otel/utils/contentSanitizer';

describe('contentSanitizer', () => {
  describe('sanitizeMultimodalContent', () => {
    it('should pass through string content unchanged', () => {
      const content = 'Hello, how are you?';
      const result = sanitizeMultimodalContent(content);
      expect(result).toBe(content);
    });

    it('should pass through null content unchanged', () => {
      const result = sanitizeMultimodalContent(null);
      expect(result).toBe(null);
    });

    it('should sanitize data URL images in user content', () => {
      const content = [
        { type: 'text' as const, text: 'What is in this image?' },
        {
          type: 'image_url' as const,
          image_url: {
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            detail: 'high' as const,
          },
        },
      ];

      const result = sanitizeMultimodalContent(content) as unknown[];

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', text: 'What is in this image?' });

      const imageResult = result[1] as any;
      expect(imageResult.type).toBe('image_url');
      expect(imageResult.image_url.url).toMatch(/^\[IMAGE:jpeg:\d+b:[a-f0-9]{16}\]$/);
      expect(imageResult.image_url.detail).toBe('high');
      expect(imageResult.image_url.format).toBe('jpeg');
      expect(imageResult.image_url.size_bytes).toBeGreaterThan(0);
      expect(imageResult.image_url.is_data_url).toBe(true);
    });

    it('should preserve external image URLs with metadata', () => {
      const content = [
        {
          type: 'image_url' as const,
          image_url: {
            url: 'https://example.com/image.jpg',
            detail: 'low' as const,
          },
        },
      ];

      const result = sanitizeMultimodalContent(content) as unknown[];

      const imageResult = result[0] as any;
      expect(imageResult.type).toBe('image_url');
      expect(imageResult.image_url.url).toBe('https://example.com/image.jpg');
      expect(imageResult.image_url.detail).toBe('low');
      expect(imageResult.image_url.is_data_url).toBe(false);
      expect(imageResult.image_url.hash).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should sanitize multimodal assistant responses', () => {
      const content = [
        { type: 'text' as const, text: 'Here is the generated image:' },
        {
          type: 'image_url' as const,
          image_url: {
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          },
        },
      ];

      const result = sanitizeMultimodalContent(content) as unknown[];

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'text', text: 'Here is the generated image:' });

      const imageResult = result[1] as any;
      expect(imageResult.type).toBe('image_url');
      expect(imageResult.image_url.url).toMatch(/^\[IMAGE:png:\d+b:[a-f0-9]{16}\]$/);
      expect(imageResult.image_url.format).toBe('png');
      expect(imageResult.image_url.is_data_url).toBe(true);
    });

    it('should handle arrays with mixed content types', () => {
      const content = [
        { type: 'text', text: 'Some text' },
        { type: 'other', data: 'some other data' },
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          },
        },
      ];

      const result = sanitizeMultimodalContent(content) as unknown[];

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'text', text: 'Some text' });
      expect(result[1]).toEqual({ type: 'other', data: 'some other data' });

      const imageResult = result[2] as any;
      expect(imageResult.type).toBe('image_url');
      expect(imageResult.image_url.url).toMatch(/^\[IMAGE:gif:\d+b:[a-f0-9]{16}\]$/);
      expect(imageResult.image_url.format).toBe('gif');
    });

    it('should pass through non-array content unchanged', () => {
      const stringContent = 'Hello world';
      expect(sanitizeMultimodalContent(stringContent)).toBe(stringContent);

      const nullContent = null;
      expect(sanitizeMultimodalContent(nullContent)).toBe(nullContent);

      const objectContent = { key: 'value' };
      expect(sanitizeMultimodalContent(objectContent)).toBe(objectContent);
    });

    it('should generate consistent hashes for the same content', () => {
      const dataUrl =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

      const content1 = [{ type: 'image_url', image_url: { url: dataUrl } }];
      const content2 = [{ type: 'image_url', image_url: { url: dataUrl } }];

      const result1 = sanitizeMultimodalContent(content1) as unknown[];
      const result2 = sanitizeMultimodalContent(content2) as unknown[];

      expect((result1[0] as any).image_url.hash).toBe((result2[0] as any).image_url.hash);
      expect((result1[0] as any).image_url.url).toBe((result2[0] as any).image_url.url);
    });

    it('should estimate base64 data size correctly', () => {
      // This is a 1x1 red pixel PNG: 67 bytes when decoded
      const smallDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      const content = [{ type: 'image_url', image_url: { url: smallDataUrl } }];
      const result = sanitizeMultimodalContent(content) as unknown[];

      // Base64 decoding: (base64_length * 3) / 4 = rough byte size
      const expectedSize = Math.floor((smallDataUrl.split(',')[1].length * 3) / 4);
      expect((result[0] as any).image_url.size_bytes).toBe(expectedSize);
    });
  });
});
