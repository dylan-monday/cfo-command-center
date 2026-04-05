'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, MessageSquare, Clock } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-surface border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </motion.button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-alt rounded-xl animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-surface-alt mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">No conversations yet</p>
            <p className="text-xs text-text-muted mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
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
                      className={`p-3 rounded-xl cursor-pointer transition-all mb-1 group ${
                        isActive
                          ? 'bg-gradient-to-r from-gradient-start/10 to-gradient-end/10 border border-accent/30'
                          : 'hover:bg-surface-alt border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'gradient-primary' : 'bg-surface-alt group-hover:bg-surface'
                        }`}>
                          <MessageSquare className={`w-4 h-4 ${isActive ? 'text-text-on-gradient' : 'text-text-muted'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive ? 'text-accent' : 'text-text'
                            }`}
                          >
                            {getTitle(conv)}
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(conv.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
