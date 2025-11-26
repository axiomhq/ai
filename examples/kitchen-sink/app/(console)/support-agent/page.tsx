'use client';

import { useState } from 'react';
import { Text } from '@/components/text';
import { Field } from '@base-ui-components/react/field';
import { Form } from '@base-ui-components/react/form';
import { apiClient } from '@/lib/api/api-client';
import { Button } from '@/components/button';

export default function SupportAgent() {
  const [input, setInput] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSupportResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim() && !isLoading) {
      setIsLoading(true);
      setResponse(null); // Clear previous response

      try {
        const clientResponse = await apiClient.api['support-response'].$post({
          json: {
            content: input,
          },
        });

        const result = await clientResponse.json();

        if ('error' in result) {
          throw new Error(result.error);
        }

        const {
          data: { response },
        } = result;

        setResponse(response);
      } catch (error) {
        console.error(error);
        setResponse('❌ Error generating response. Please try again.');
      } finally {
        setIsLoading(false);
        setInput('');
      }
    }
  };

  return (
    <>
      <Text variant="h1">Support agent</Text>
      <Text variant="subtitle">Respond to Axiom customer support requests.</Text>

      <Form
        className="flex w-full max-w-80 flex-col gap-4 mb-8"
        onSubmit={(event) => handleSupportResponse(event)}
      >
        <Field.Root name="prompt" className="flex flex-col items-start gap-1">
          <Field.Label className="text-sm font-medium text-gray-900">Request</Field.Label>
          <Field.Control
            placeholder="Enter request&hellip;"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
            className={`h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 ${
              isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          <Field.Error className="text-sm text-red-800" />
        </Field.Root>
        <Button disabled={isLoading || !input.trim()}>
          {isLoading ? 'Generating response...' : 'Generate response'}
        </Button>
      </Form>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Analyzing support conversation...
        </div>
      )}

      {response && (
        <div className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200">
          {response}
        </div>
      )}
    </>
  );
}
