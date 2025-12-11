'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/api-client';
import type { SupportAgentResult } from '@/lib/capabilities/support-agent/support-agent';

export type ModelMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export function useSupportChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [result, setResult] = useState<SupportAgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const newMessages = [...messages, { role: 'user', content: input } as ModelMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const clientResponse = await apiClient.api['support-response'].$post({
        json: { messages: newMessages },
      });

      const json = await clientResponse.json();

      if ('error' in json) {
        throw new Error(json.error);
      }

      const agentResult = json.data as unknown as SupportAgentResult;
      setResult(agentResult);

      if (agentResult.answer) {
        setMessages((prev) => [...prev, agentResult.answer as ModelMessage]);
      }
    } catch (err) {
      console.error(err);
      setError('❌ Error generating response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
