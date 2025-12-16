'use client';

import { useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';

type ChatMessageProps = {
  message: { role: 'user' | 'assistant' | 'system'; content: string };
  feedback?: 'up' | 'down';
  onFeedback?: (value: 'up' | 'down', message: string) => void;
};

export function ChatMessage({ message, feedback, onFeedback }: ChatMessageProps) {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [openPopover, setOpenPopover] = useState<'up' | 'down' | null>(null);

  const handleSubmit = () => {
    if (openPopover && onFeedback) {
      onFeedback(openPopover, feedbackMessage);
      setFeedbackMessage('');
      setOpenPopover(null);
    }
  };

  const handleCancel = () => {
    setFeedbackMessage('');
    setOpenPopover(null);
  };

  return (
    <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
          message.role === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {message.content}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-400 capitalize">{message.role}</span>
        {message.role === 'assistant' && onFeedback && (
          <div className="flex gap-1">
            <Popover.Root open={openPopover === 'up'} onOpenChange={(open) => !open && handleCancel()}>
              <Popover.Trigger
                onClick={() => {
                  if (feedback === undefined) setOpenPopover('up');
                }}
                disabled={feedback !== undefined}
                className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                  feedback === 'up'
                    ? 'bg-green-100 text-green-700'
                    : feedback === 'down'
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Good response"
              >
                👍
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={8}>
                  <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                    <Popover.Title className="text-sm font-medium text-gray-900 mb-2">
                      What did you like?
                    </Popover.Title>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Optional feedback..."
                      className="w-full border border-gray-200 rounded-md p-2 text-sm text-gray-900 mb-2 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancel}
                        className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Submit
                      </button>
                    </div>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>

            <Popover.Root open={openPopover === 'down'} onOpenChange={(open) => !open && handleCancel()}>
              <Popover.Trigger
                onClick={() => {
                  if (feedback === undefined) setOpenPopover('down');
                }}
                disabled={feedback !== undefined}
                className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                  feedback === 'down'
                    ? 'bg-red-100 text-red-700'
                    : feedback === 'up'
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Poor response"
              >
                👎
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={8}>
                  <Popover.Popup className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                    <Popover.Title className="text-sm font-medium text-gray-900 mb-2">
                      What went wrong?
                    </Popover.Title>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Optional feedback..."
                      className="w-full border border-gray-200 rounded-md p-2 text-sm text-gray-900 mb-2 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancel}
                        className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Submit
                      </button>
                    </div>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        )}
      </div>
    </div>
  );
}
