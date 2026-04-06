'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  uploadingFile?: boolean;
}

export function ChatInput({
  onSend,
  onFileUpload,
  disabled = false,
  placeholder = 'Ask your CFO anything...',
  uploadingFile = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    // If there's a file selected, upload it
    if (selectedFile && onFileUpload && !disabled) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      setMessage('');
      return;
    }

    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = disabled || uploadingFile;
  const canSubmit = selectedFile || message.trim();

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.csv,.txt,.xlsx,.xls"
          className="hidden"
        />

        {/* Selected file preview */}
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 bg-accent-light/50 border border-accent/20 rounded-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB · Ready to parse
              </p>
            </div>
            <button
              onClick={clearFile}
              disabled={isDisabled}
              className="p-1.5 text-text-muted hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Input container */}
        <div className="relative bg-surface border border-[rgba(0,0,0,0.06)] rounded-[16px] shadow-sm focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(26,138,125,0.08)] transition-all">
          {/* Attachment button */}
          <button
            onClick={handleAttachClick}
            disabled={isDisabled}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-accent transition-colors disabled:opacity-50"
            title="Attach document (PDF, CSV, TXT, Excel)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={selectedFile ? 'Add a note about this document (optional)...' : placeholder}
            rows={1}
            className="w-full resize-none bg-transparent pl-12 pr-14 py-4 text-[14px] text-text placeholder:text-text-faint focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send button - inside input */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isDisabled || !canSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent hover:bg-accent-hover flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_2px_8px_rgba(26,138,125,0.3)]"
          >
            {uploadingFile ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-text-faint text-center mt-3">
          {selectedFile ? 'Press Enter to parse document' : 'Enter to send · Shift+Enter for new line · 📎 to attach'}
        </p>
      </div>
    </div>
  );
}
