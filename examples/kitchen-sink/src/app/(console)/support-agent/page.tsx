'use client';

import { useState } from 'react';
import { Text } from '@/components/text';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { Button } from '@/components/button';
import { createFeedbackClient, Feedback } from 'axiom/ai/experimental_feedback';
import { ChatMessage } from './chat-message';
import { AgentInternals } from './agent-internals';
import { useSupportChat } from './use-support-chat';

const sendFeedback = createFeedbackClient({
  url: 'https://api.dev.axiomtestlabs.co',
  dataset: 'axiom-feedback-dev',
  token: process.env.NEXT_PUBLIC_FEEDBACK_TOKEN!,
});

export default function SupportAgent() {
  const { input, setInput, messages, result, error, isLoading, handleSubmit } = useSupportChat();
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'up' | 'down'>>({});

  const handleFeedback = async (messageIndex: number, value: 'up' | 'down') => {
    if (!result?.correlation) return;
    setFeedbackGiven((prev) => ({ ...prev, [messageIndex]: value }));
    await sendFeedback(result.correlation, Feedback.thumbs({ name: 'response-quality', value }));
  };

  return (
    <>
      <Text variant="h1">
        <span className="font-mono">Pets.ai</span> support agent
      </Text>
      <Text variant="subtitle">Respond to Pets.ai customer support requests.</Text>

      {/* Chat History */}
      <div className="flex flex-col gap-4 mb-6 w-full max-w-xl bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 text-center italic">No messages yet.</div>
        )}
        {messages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg}
            feedback={feedbackGiven[idx]}
            onFeedback={(value) => handleFeedback(idx, value)}
          />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-pulse">Thinking...</div>
          </div>
        )}
      </div>

      <Form className="flex w-full max-w-xl flex-col gap-4 mb-8" onSubmit={handleSubmit}>
        <Field.Root name="prompt" className="flex flex-col items-start gap-1">
          <Field.Control
            placeholder="Type your message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
            className={`w-full rounded-md border border-gray-200 p-3 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 ${
              isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        </Field.Root>
        <Button disabled={isLoading || !input.trim()}>Send</Button>
      </Form>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-200 mb-4 max-w-xl">
          {error}
        </div>
      )}

      {result && <AgentInternals result={result} />}
    </>
  );
}
