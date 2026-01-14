import { z } from 'zod';

export const PurchaseContextSchema = z.enum(['verified_purchase', 'gifted_product', 'business']);

export const SentimentSchema = z.enum(['positive', 'negative', 'neutral', 'unknown']);

export const UserReviewSchema = z.object({
  review: z.string(),
  purchase_context: PurchaseContextSchema,
});

export const UserReviewMetadataSchema = z.object({
  id: z.string(),
  profile: z.string(),
  title: z.string(),
});

export const ReviewAssistantSchema = z.object({
  sentiment: SentimentSchema,
  summary: z.string(),
});

export const ReviewCollectionItemSchema = z.object({
  input: UserReviewSchema,
  expected: ReviewAssistantSchema,
  metadata: UserReviewMetadataSchema,
});

export const ReviewCollectionSchema = z.array(ReviewCollectionItemSchema);

export type ReviewCollection = z.infer<typeof ReviewCollectionSchema>;
export type UserReview = z.infer<typeof UserReviewSchema>;
