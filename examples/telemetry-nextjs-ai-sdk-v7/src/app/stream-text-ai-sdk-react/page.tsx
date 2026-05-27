'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function StreamText2() {
  const [input, setInput] = useState<string>('');

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/stream-text-ai-sdk-react',
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Stream Text 2</h1>
      <p className="text-gray-600 mb-6">
        Demo using withSpan with Response streams (proper usage pattern)
      </p>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your prompt..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
            }`}
          >
            <div className="font-semibold text-sm mb-1">
              {message.role === 'user' ? 'You' : 'AI'}
            </div>
            <div className="whitespace-pre-wrap">
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  return <span key={index}>{part.text}</span>;
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
