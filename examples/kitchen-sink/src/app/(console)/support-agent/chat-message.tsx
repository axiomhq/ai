type ChatMessageProps = {
  message: { role: 'user' | 'assistant' | 'system'; content: string };
  feedback?: 'up' | 'down';
  onFeedback?: (value: 'up' | 'down') => void;
};

export function ChatMessage({ message, feedback, onFeedback }: ChatMessageProps) {
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
            <button
              onClick={() => onFeedback('up')}
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
            </button>
            <button
              onClick={() => onFeedback('down')}
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
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
