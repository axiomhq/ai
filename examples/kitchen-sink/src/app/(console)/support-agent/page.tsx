'use client';

import { Button } from '@/components/button';
import { ConversationList } from '@/components/conversation-list';
import { Text } from '@/components/text';
import { useConversations } from '@/lib/conversations';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { createFeedbackClient, Feedback } from 'axiom/ai/feedback';
import { useState } from 'react';
import { AgentInternals } from './agent-internals';
import { ChatMessage } from './chat-message';
import { useSupportChat } from './use-support-chat';

const { sendFeedback } = createFeedbackClient({
  url: process.env.NEXT_PUBLIC_AXIOM_URL,
  dataset: process.env.NEXT_PUBLIC_AXIOM_FEEDBACK_DATASET!,
  token: process.env.NEXT_PUBLIC_AXIOM_FEEDBACK_TOKEN!,
});

export default function SupportAgent() {
  const {
    conversations,
    currentId,
    isLoaded,
    createConversation,
    selectConversation,
    deleteConversation,
    getMessages,
    setMessages,
    updateConversationTitle,
  } = useConversations();

  const { input, setInput, messages, result, error, isLoading, handleSubmit } = useSupportChat({
    conversationId: currentId,
    getMessages,
    setMessages,
    updateTitle: updateConversationTitle,
  });

  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'up' | 'down'>>({});

  const handleFeedback = async (messageIndex: number, value: 'up' | 'down', feedbackMessage: string) => {
    const msg = messages[messageIndex];
    if (!msg?.links) {
      console.warn('Cannot send feedback: no links available for message', { messageIndex, msg });
      return;
    }
    setFeedbackGiven((prev) => ({ ...prev, [messageIndex]: value }));
    await sendFeedback(
      msg.links,
      Feedback.thumb({ name: 'response-quality', value, message: feedbackMessage || undefined }),
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="w-64 shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase">Conversations</h3>
        <ConversationList
          conversations={conversations}
          currentId={currentId}
          onSelect={selectConversation}
          onCreate={() => createConversation()}
          onDelete={deleteConversation}
        />
      </div>

      <div className="flex-1 min-w-0">
        <Text variant="h1">
          <span className="font-mono">Pets.ai</span> support agent
        </Text>
        <Text variant="subtitle">Respond to Pets.ai customer support requests.</Text>

        {currentId && (
          <div className="text-xs text-gray-400 mb-4 font-mono">Conversation: {currentId}</div>
        )}

        {!currentId ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="mb-4">No conversation selected</p>
            <Button onClick={() => createConversation()}>Start a new conversation</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-6 w-full max-w-xl bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-sm text-gray-500 text-center italic">No messages yet.</div>
              )}
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg}
                  feedback={feedbackGiven[idx]}
                  onFeedback={(value, message) => handleFeedback(idx, value, message)}
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
        )}
      </div>
    </div>
  );
}
