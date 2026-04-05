'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onAttach?: () => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask your CFO anything...',
  onAttach,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Input container */}
        <div className="relative bg-surface border border-[rgba(0,0,0,0.06)] rounded-[16px] shadow-sm focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(26,138,125,0.08)] transition-all">
          {/* Attachment button */}
          <button
            onClick={onAttach}
            disabled={disabled}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none bg-transparent pl-12 pr-14 py-4 text-[14px] text-text placeholder:text-text-faint focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send button - inside input */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent hover:bg-accent-hover flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_2px_8px_rgba(26,138,125,0.3)]"
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-text-faint text-center mt-3">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
