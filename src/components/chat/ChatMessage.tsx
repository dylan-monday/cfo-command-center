'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

// Format dollar amounts with JetBrains Mono
function formatContent(content: string) {
  // Match dollar amounts like $1,234.56 or $1234
  const dollarRegex = /(\$[\d,]+(?:\.\d{2})?)/g;
  const parts = content.split(dollarRegex);

  return parts.map((part, index) => {
    if (part.match(dollarRegex)) {
      return (
        <span key={index} className="font-mono font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = role === 'user';

  // Typing indicator for streaming with no content
  if (isStreaming && !content) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-start"
      >
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 ml-1">
          CFO
        </span>
        <div className="bg-surface border border-[rgba(0,0,0,0.06)] rounded-[20px_20px_20px_4px] px-5 py-4 shadow-md">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-text-muted"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* CFO label - only for assistant messages */}
      {!isUser && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5 ml-1">
          CFO
        </span>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[75%] px-[18px] py-[14px] ${
          isUser
            ? 'bg-[#0D0C0B] text-white rounded-[20px_20px_4px_20px]'
            : 'bg-surface border border-[rgba(0,0,0,0.06)] rounded-[20px_20px_20px_4px] shadow-md'
        }`}
        style={{ fontFamily: 'var(--font-chat)' }}
      >
        <div className="text-[14px] leading-[1.6] whitespace-pre-wrap font-normal">
          {isUser ? content : formatContent(content)}
          {isStreaming && content && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 0.5, repeatType: 'reverse' }}
              className="inline-block w-0.5 h-4 ml-0.5 bg-accent"
            />
          )}
        </div>
      </div>

      {/* Timestamp - only on hover */}
      <motion.span
        initial={false}
        animate={{ opacity: showTimestamp ? 1 : 0 }}
        className={`text-[11px] text-text-faint mt-1 ${isUser ? 'mr-1' : 'ml-1'}`}
      >
        {timestamp
          ? new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </motion.span>
    </motion.div>
  );
}
