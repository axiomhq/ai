'use client';

import { useState, useEffect, useCallback } from 'react';

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type FeedbackLinksData = {
  traceId: string;
  spanId?: string;
  capability: string;
  conversationId?: string;
};

export type StoredMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  links?: FeedbackLinksData;
};

type ConversationMessages = StoredMessage[];

const CONVERSATIONS_KEY = 'kitchen-sink:conversations';
const MESSAGES_KEY_PREFIX = 'kitchen-sink:messages:';

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getStoredConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

function getStoredMessages(conversationId: string): ConversationMessages {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MESSAGES_KEY_PREFIX + conversationId);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessages(conversationId: string, messages: ConversationMessages): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MESSAGES_KEY_PREFIX + conversationId, JSON.stringify(messages));
}

function deleteStoredMessages(conversationId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MESSAGES_KEY_PREFIX + conversationId);
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredConversations();
    setConversations(stored);
    if (stored.length > 0) {
      setCurrentId(stored[0].id);
    }
    setIsLoaded(true);
  }, []);

  const createConversation = useCallback((title?: string): string => {
    const id = generateId();
    const now = Date.now();
    const newConversation: Conversation = {
      id,
      title: title || 'New conversation',
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => {
      const updated = [newConversation, ...prev];
      saveConversations(updated);
      return updated;
    });
    setCurrentId(id);
    return id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      );
      saveConversations(updated);
      return updated;
    });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      deleteStoredMessages(id);
      return updated;
    });
    setCurrentId((prev) => {
      if (prev === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prev;
    });
  }, [conversations]);

  const getMessages = useCallback((conversationId: string): ConversationMessages => {
    return getStoredMessages(conversationId);
  }, []);

  const setMessages = useCallback((conversationId: string, messages: ConversationMessages) => {
    saveMessages(conversationId, messages);
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conversationId ? { ...c, updatedAt: Date.now() } : c
      );
      saveConversations(updated);
      return updated;
    });
  }, []);

  return {
    conversations,
    currentId,
    isLoaded,
    createConversation,
    selectConversation,
    updateConversationTitle,
    deleteConversation,
    getMessages,
    setMessages,
  };
}
