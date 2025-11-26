import { withSpan } from 'axiom/ai';

export interface SupportResponseRequest {
  content: string;
  context?: Record<string, string | number | boolean>;
}

export interface SupportResponseResult {
  response: string;
  traceId: string | null;
}

export const generateSupportResponse = async (
  request: SupportResponseRequest,
): Promise<SupportResponseResult> => {
  return await withSpan(
    {
      capability: 'support_agent',
      step: 'orchestration',
    },
    async () => {
      void request;

      // TODO: implement
      const result = { response: 'hey', traceId: 'abc123' };

      return result;
    },
  );
};
