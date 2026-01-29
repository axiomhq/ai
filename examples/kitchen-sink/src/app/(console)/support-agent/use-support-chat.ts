'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/api-client';
import type { SupportAgentResult } from '@/lib/capabilities/support-agent/support-agent';

export type ModelMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type UseSupportChatOptions = {
  conversationId: string | null;
  getMessages: (id: string) => ModelMessage[];
  setMessages: (id: string, messages: ModelMessage[]) => void;
  updateTitle?: (id: string, title: string) => void;
};

export function useSupportChat({
  conversationId,
  getMessages,
  setMessages,
  updateTitle,
}: UseSupportChatOptions) {
  const [input, setInput] = useState('');
  const [messages, setLocalMessages] = useState<ModelMessage[]>([]);
  const [result, setResult] = useState<SupportAgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (conversationId) {
      const storedMessages = getMessages(conversationId);
      setLocalMessages(storedMessages);
      setResult(null);
      setError(null);
    } else {
      setLocalMessages([]);
      setResult(null);
      setError(null);
    }
  }, [conversationId, getMessages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!input.trim() || isLoading || !conversationId) return;

      setIsLoading(true);
      setError(null);

      const userMessage: ModelMessage = { role: 'user', content: input };
      const newMessages = [...messages, userMessage];
      setLocalMessages(newMessages);
      setMessages(conversationId, newMessages);
      setInput('');

      if (messages.length === 0 && updateTitle) {
        const title = input.slice(0, 50) + (input.length > 50 ? '...' : '');
        updateTitle(conversationId, title);
      }

      try {
        const clientResponse = await apiClient.api['support-response'].$post({
          json: { messages: newMessages, conversationId },
        });

        const json = await clientResponse.json();

        if ('error' in json) {
          throw new Error(json.error);
        }

        const agentResult = json.data as unknown as SupportAgentResult;
        setResult(agentResult);

        if (agentResult.answer) {
          const updatedMessages = [...newMessages, agentResult.answer as ModelMessage];
          setLocalMessages(updatedMessages);
          setMessages(conversationId, updatedMessages);
        }
      } catch (err) {
        console.error(err);
        setError('❌ Error generating response. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, conversationId, messages, setMessages, updateTitle]
  );

  return {
    input,
    setInput,
    messages,
    result,
    error,
    isLoading,
    handleSubmit,
  };
}
