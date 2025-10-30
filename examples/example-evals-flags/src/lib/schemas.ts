import z from 'zod';

// Input from the seller
export const ListingInputSchema = z.object({
  seller_brief: z.string(),
});

// Expected output - the polished listing
export const ListingOutputSchema = z.object({
  product_description: z.string(),
});

// Product categories
export const ProductCategorySchema = z.enum([
  'electronics',
  'fashion',
  'home',
  'sports',
  'books',
  'toys',
  'automotive',
  'other',
]);

// Metadata for tracking
export const ListingMetadataSchema = z.object({
  category: ProductCategorySchema,
  seller_username: z.string(),
});

// Collection record schema
export const ListingRecordSchema = z.object({
  input: ListingInputSchema,
  expected: ListingOutputSchema,
  metadata: ListingMetadataSchema,
});

export const ListingCollectionSchema = z.array(ListingRecordSchema);

// Type exports
export type ListingInput = z.infer<typeof ListingInputSchema>;
export type ListingOutput = z.infer<typeof ListingOutputSchema>;
export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type ListingRecord = z.infer<typeof ListingRecordSchema>;
export type ListingCollection = z.infer<typeof ListingCollectionSchema>;
