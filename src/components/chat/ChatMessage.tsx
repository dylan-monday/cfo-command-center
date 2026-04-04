'use client';

import { motion } from 'motion/react';
import { EntityDot } from '@/components/ui';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-surface-alt' : 'bg-accent'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-medium text-text-muted">You</span>
        ) : (
          <span className="text-xs font-medium text-white">CFO</span>
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-accent text-white'
            : 'bg-surface border border-border'
        }`}
      >
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isUser ? 'text-white' : 'text-text'
          }`}
        >
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-accent animate-pulse" />
          )}
        </div>
        {timestamp && (
          <div
            className={`text-[10px] mt-2 ${
              isUser ? 'text-white/70' : 'text-text-muted'
            }`}
          >
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
