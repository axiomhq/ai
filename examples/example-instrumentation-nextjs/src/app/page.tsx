import { generateText } from 'ai';
import { geminiFlash } from '@/shared/gemini';
import { withSpan } from '@axiomhq/ai';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const userId = 123;
  const res = await withSpan({ capability: 'help_user', step: 'get_capital' }, (span) => {
    // you have access to the span in this callback
    span.setAttribute('user_id', userId);

    return generateText({
      model: geminiFlash,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI that answers questions.',
        },
        {
          role: 'user',
          content: 'What is the capital of Spain?',
        },
      ],
    });
  });

  return <p>{res.text}</p>;
}
