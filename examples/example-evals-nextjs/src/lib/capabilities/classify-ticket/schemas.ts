import z from 'zod';

export const SupportTicketCategorySchema = z.enum([
  'spam',
  'question',
  'feature_request',
  'bug_report',
]);

export const SupportTicketInputSchema = z.object({
  subject: z.string().optional(),
  content: z.string(),
});

export const SupportTicketResponseSchema = z.object({
  category: SupportTicketCategorySchema,
  response: z.string(),
});

export const SupportTicketMetadataSchema = z.object({
  id: z.string(),
  channel: z.enum(['EMAIL', 'SLACK']),
});

export const SupportTicketDatasetRecordSchema = z.object({
  input: SupportTicketInputSchema,
  expected: SupportTicketResponseSchema,
  metadata: SupportTicketMetadataSchema,
});

export const SupportTicketDatasetSchema = z.array(SupportTicketDatasetRecordSchema);

export type SupportTicketInput = z.infer<typeof SupportTicketInputSchema>;
export type SupportTicketDataset = z.infer<typeof SupportTicketDatasetSchema>;
