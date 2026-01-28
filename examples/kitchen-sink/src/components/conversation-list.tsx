'use client';

import { Conversation } from '@/lib/conversations';

type ConversationListProps = {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export function ConversationList({
  conversations,
  currentId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onCreate}
        className="w-full py-2 px-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-dashed border-gray-300 mb-2"
      >
        + New conversation
      </button>
      {conversations.length === 0 && (
        <div className="text-xs text-gray-400 px-3 py-2">No conversations yet</div>
      )}
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`group flex items-center justify-between rounded-md cursor-pointer ${
            currentId === conv.id
              ? 'bg-gray-50 outline outline-1 outline-gray-200 outline-offset-[-1px]'
              : 'hover:bg-gray-50'
          }`}
        >
          <button
            onClick={() => onSelect(conv.id)}
            className="flex-1 py-[0.3125rem] px-3 text-left text-sm truncate"
            title={conv.title}
          >
            {conv.title}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conv.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-gray-400 hover:text-red-500 transition-opacity"
            title="Delete conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
