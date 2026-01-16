'use client';

import { useState } from 'react';
import { createFeedbackClient, Feedback } from 'axiom/ai/feedback';
import type { FeedbackLinks } from 'axiom/ai/feedback';

const { sendFeedback } = createFeedbackClient({
  url: process.env.NEXT_PUBLIC_AXIOM_URL!,
  dataset: process.env.NEXT_PUBLIC_AXIOM_FEEDBACK_DATASET!,
  token: process.env.NEXT_PUBLIC_AXIOM_FEEDBACK_TOKEN!,
});

type ChatMessageProps = {
  role: 'user' | 'assistant';
  content: string;
  links?: FeedbackLinks;
};

export function ChatMessage({ role, content, links }: ChatMessageProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (value: 'up' | 'down') => {
    if (!links || feedback !== null) return;

    setIsSubmitting(true);
    setFeedback(value);

    await sendFeedback(links, Feedback.thumb({ name: 'response-quality', value }));

    setIsSubmitting(false);
  };

  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>

        {/* Feedback buttons for assistant messages */}
        {!isUser && links && (
          <div className="mt-3 flex items-center gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Was this helpful?
            </span>
            <button
              onClick={() => handleFeedback('up')}
              disabled={feedback !== null || isSubmitting}
              className={`rounded-md p-1.5 text-lg transition-all ${
                feedback === 'up'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : feedback !== null
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              aria-label="Thumbs up"
            >
              👍
            </button>
            <button
              onClick={() => handleFeedback('down')}
              disabled={feedback !== null || isSubmitting}
              className={`rounded-md p-1.5 text-lg transition-all ${
                feedback === 'down'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : feedback !== null
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              aria-label="Thumbs down"
            >
              👎
            </button>
            {feedback && (
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                Thanks for the feedback!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
