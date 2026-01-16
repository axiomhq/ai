'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { chat, type Message } from '../actions';
import { ChatMessage } from '../components/ChatMessage';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      const response = await chat([...messages, userMessage]);
      setMessages((prev) => [...prev, response]);
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">
                AI Chat
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Feedback Demo
              </p>
            </div>
          </div>
          <a
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ← Back
          </a>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Start a conversation
              </h2>
              <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Ask me anything! After I respond, you can give feedback using
                the thumbs up/down buttons.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  links={message.links}
                />
              ))}
              {isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-indigo-400"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Your feedback helps improve AI responses and is linked to traces in
            Axiom.
          </p>
        </form>
      </footer>
    </div>
  );
}
