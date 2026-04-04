'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  onNewChat: () => void;
}

export function ConversationList({ onNewChat }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Extract conversation ID from URL
  const currentConversationId = pathname.startsWith('/chat/')
    ? pathname.replace('/chat/', '')
    : null;

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch('/api/chat');
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTitle = (conv: Conversation) => {
    return conv.title || 'New conversation';
  };

  return (
    <div className="h-full flex flex-col bg-surface-alt border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewChat}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-bg rounded animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-text-muted">No conversations yet</p>
            <p className="text-xs text-text-faint mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="p-2">
            <AnimatePresence mode="popLayout">
              {conversations.map((conv, index) => {
                const isActive = currentConversationId === conv.id;
                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link href={`/chat/${conv.id}`}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-accent/10 border border-accent/30'
                            : 'hover:bg-bg'
                        }`}
                      >
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? 'text-accent' : 'text-text'
                          }`}
                        >
                          {getTitle(conv)}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {formatDate(conv.updated_at)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
