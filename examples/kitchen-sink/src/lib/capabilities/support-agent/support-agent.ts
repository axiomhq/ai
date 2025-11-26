import { categorizeMessage } from './categorize-messages';
import { startActiveSpan } from '@/lib/utilities/start-active-span';

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
  return startActiveSpan('support_agent', null, async (span) => {
    const traceId = span.spanContext().traceId;

    const category = await categorizeMessage([{ role: 'user', content: request.content }]);

    switch (category) {
      case 'spam':
        return { response: 'I am sorry, but I cannot assist with that.', traceId };
      case 'wrong_company':
        return {
          response: 'I am sorry but you seem to have contacted the wrong company.',
          traceId,
        };
      case 'complaint':
        return {
          response:
            'I am sorry to hear that you are having issues. Can you please provide more details?',
          traceId,
        };
      case 'support':
        return {
          response:
            'I am sorry to hear that you are having issues. Can you please provide more details?',
          traceId,
        };
      case 'unknown':
        return { response: 'I am sorry, but I cannot assist with that.', traceId };
    }
  });
};
