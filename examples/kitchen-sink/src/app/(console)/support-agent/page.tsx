'use client';

import { useState } from 'react';
import { Text } from '@/components/text';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { apiClient } from '@/lib/api/api-client';
import { Button } from '@/components/button';

// Types mirroring the server response
type MessageCategory = 'support' | 'complaint' | 'wrong_company' | 'spam' | 'unknown';

type TicketInfo = {
  intent: string | null;
  product: string | null;
  urgency?: string;
  status?: string;
  missing_fields?: string[];
};

type SupportAgentResult = {
  category: MessageCategory;
  answer: { role: string; content: string } | null;
  retrieval?: {
    status: string;
    documents: { id: string; title: string; body: string }[];
  };
  ticket: {
    ticketInfo: TicketInfo;
    status: {
      isComplete: boolean;
      missingFields: string[];
    };
  } | null;
};

type ModelMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export default function SupportAgent() {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [result, setResult] = useState<SupportAgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSupportResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim() && !isLoading) {
      setIsLoading(true);
      setError(null);

      // Optimistically add user message
      const newMessages = [...messages, { role: 'user', content: input } as ModelMessage];
      setMessages(newMessages);
      setInput('');

      try {
        const clientResponse = await apiClient.api['support-response'].$post({
          json: {
            messages: newMessages as any,
          },
        });

        const json = await clientResponse.json();

        if ('error' in json) {
          throw new Error(json.error);
        }

        const agentResult = json.data as unknown as SupportAgentResult;
        setResult(agentResult);

        // Append assistant response to history if it exists
        if (agentResult.answer) {
          setMessages((prev) => [...prev, agentResult.answer as ModelMessage]);
        }
      } catch (error) {
        console.error(error);
        setError('❌ Error generating response. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
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
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
            <span className="text-xs text-gray-400 mt-1 capitalize">{msg.role}</span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-pulse">Thinking...</div>
          </div>
        )}
      </div>

      <Form
        className="flex w-full max-w-xl flex-col gap-4 mb-8"
        onSubmit={(event) => handleSupportResponse(event)}
      >
        <Field.Root name="prompt" className="flex flex-col items-start gap-1">
          <Field.Control
            placeholder="Type your message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
            className={`w-full rounded-md border border-gray-200 p-3 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 ${
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

      {result && (
        <div className="flex flex-col gap-6 max-w-3xl border-t pt-6">
          <Text variant="subtitle" className="text-lg font-bold">
            Agent Internals (Latest Turn)
          </Text>

          {/* 1. Triage / Categorization */}
          <section className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Step 1: Triage
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Category:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                ${
                  result.category === 'spam'
                    ? 'bg-red-100 text-red-800'
                    : result.category === 'support'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {result.category}
              </span>
            </div>
          </section>

          {/* 4. Ticket Extraction */}
          {result.ticket && (
            <section className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Ticket State
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray-500 block">Intent</span>
                  <span className="text-sm font-medium">
                    {result.ticket.ticketInfo.intent || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Product</span>
                  <span className="text-sm font-medium">
                    {result.ticket.ticketInfo.product || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status:</span>
                  {result.ticket.status.isComplete ? (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      ✓ Ready to file
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                      ⚠ Needs Info: {result.ticket.status.missingFields.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
