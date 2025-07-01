/**
 * We need a way to know that we're inside `withSpan`
 * Because we don't own `generateText` and similar functions,
 * we use OTel Baggage to propagate this information. Another
 * consideration might be to use AsyncLocalStorage in Node and
 * some kind of KV in workerd.
 */
export const WITHSPAN_BAGGAGE_KEY = '__withspan_gen_ai_call';
