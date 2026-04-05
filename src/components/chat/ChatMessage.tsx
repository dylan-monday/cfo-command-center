'use client';

import { motion } from 'motion/react';
import { User, Sparkles } from 'lucide-react';

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
      transition={{ duration: 0.25 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-surface-alt border border-border'
            : 'gradient-primary'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-text-secondary" />
        ) : (
          <Sparkles className="w-5 h-5 text-text-on-gradient" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-4 ${
          isUser
            ? 'bg-surface-dark text-text-on-dark'
            : 'bg-surface border border-border shadow-sm'
        }`}
      >
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isUser ? '' : 'text-text'
          }`}
        >
          {content}
          {isStreaming && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 0.5, repeatType: 'reverse' }}
              className="inline-block w-2 h-5 ml-1 rounded-sm bg-gradient-end"
            />
          )}
        </div>
        {timestamp && (
          <div
            className={`text-[11px] mt-3 ${
              isUser ? 'text-white/50' : 'text-text-muted'
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
