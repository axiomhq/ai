/**
 * Online evaluation scorers for production monitoring.
 *
 * These scorers run on live traffic (not against expected values)
 * to monitor model quality in production. They are reference-free,
 * meaning they only see input and output, not ground truth.
 *
 * Usage with onlineEval:
 * ```ts
 * const result = await withSpan(
 *   { capability: 'support-agent', step: 'categorize-message' },
 *   async () => {
 *     const response = await generateText({ ... });
 *
 *     // Fire-and-forget — active span is auto-linked
 *     void onlineEval(
 *       { capability: 'support-agent', step: 'categorize-message' },
 *       {
 *         input: userMessage,
 *         output: response.text,
 *         scorers: [validCategoryScorer, confidenceScorer],
 *         sampling: { rate: 0.1 },
 *       }
 *     );
 *
 *     return response.text;
 *   },
 * );
 * ```
 */

import { Scorer } from 'axiom/ai';
import { messageCategories, type MessageCategory } from './categorize-messages';

/**
 * Validates that the classification output is a known category.
 *
 * This scorer demonstrates returning a boolean Score with metadata.
 * When score is a boolean, Scorer() automatically converts it to 1/0
 * and sets metadata.is_boolean = true, while preserving your custom metadata.
 *
 * For simpler pass/fail checks without metadata, see isKnownCategoryScorer.
 */
export const validCategoryScorer = Scorer(
  'valid-category',
  ({ output }: { output: MessageCategory }) => {
    const isValid = messageCategories.includes(output as (typeof messageCategories)[number]);
    return {
      score: isValid,
      metadata: {
        category: output,
        validCategories: messageCategories,
      },
    };
  },
);

/**
 * Simple pass/fail check: is the output a known category?
 *
 * This scorer demonstrates the boolean return pattern.
 * When you return true/false directly, Scorer() automatically:
 * - Converts to score 1 (true) or 0 (false)
 * - Sets metadata.is_boolean = true for downstream analysis
 *
 * Use this pattern for simple pass/fail checks without custom metadata.
 */
export const isKnownCategoryScorer = Scorer(
  'is-known-category',
  ({ output }: { output: MessageCategory }) => {
    return messageCategories.includes(output as (typeof messageCategories)[number]);
  },
);

/**
 * Checks if the output looks like a single-word classification.
 * High confidence if it's a clean, lowercase category name.
 */
export const formatConfidenceScorer = Scorer(
  'format-confidence',
  ({ output }: { output: MessageCategory }) => {
    if (typeof output !== 'string') {
      return { score: 0, metadata: { reason: 'not a string' } };
    }

    const trimmed = output.trim().toLowerCase();
    const isSingleWord = !trimmed.includes(' ');
    const isLowercase = trimmed === output;
    const isClean = /^[a-z_]+$/.test(trimmed);

    const score = (isSingleWord ? 0.4 : 0) + (isLowercase ? 0.3 : 0) + (isClean ? 0.3 : 0);

    return {
      score,
      metadata: {
        isSingleWord,
        isLowercase,
        isClean,
      },
    };
  },
);

/**
 * Example of a more sophisticated scorer that could call an external API
 * or another model for evaluation (e.g., toxicity detection, helpfulness).
 *
 * This is a simplified mock - in production you might call:
 * - OpenAI moderation API
 * - Perspective API for toxicity
 * - A fine-tuned evaluation model
 */
export const responseQualityScorer = Scorer(
  'response-quality',
  async ({ input, output }: { input: string; output: string }) => {
    // Simulate an async quality check
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Simple heuristics (replace with real evaluation in production)
    const hasContent = typeof output === 'string' && output.length > 0;
    const notTooShort = typeof output === 'string' && output.length >= 3;
    const notTooLong = typeof output === 'string' && output.length < 1000;

    const score = (hasContent ? 0.5 : 0) + (notTooShort ? 0.25 : 0) + (notTooLong ? 0.25 : 0);

    return {
      score,
      metadata: {
        inputLength: typeof input === 'string' ? input.length : 0,
        outputLength: typeof output === 'string' ? output.length : 0,
      },
    };
  },
);
