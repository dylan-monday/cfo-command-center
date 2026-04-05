'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatMessage, ChatInput } from '@/components/chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const SUGGESTED_PROMPTS = [
  'How am I doing on taxes?',
  'What needs my attention?',
  'Summarize the Saratoga situation',
  'What money am I leaving on the table?',
];

function ChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [entitySlug, setEntitySlug] = useState<string | null>(null);
  const [entities, setEntities] = useState<{ slug: string; name: string }[]>([]);
  const [autoSendPending, setAutoSendPending] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for property review context from URL or sessionStorage
  useEffect(() => {
    // Check URL params for entity
    const urlEntity = searchParams.get('entity');
    if (urlEntity) {
      setEntitySlug(urlEntity);
    }

    // Check sessionStorage for property review context
    const storedContext = sessionStorage.getItem('propertyReviewContext');
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext);
        if (context.entitySlug) {
          setEntitySlug(context.entitySlug);
        }
        if (context.prompt) {
          setAutoSendPending(context.prompt);
        }
        // Clear the stored context
        sessionStorage.removeItem('propertyReviewContext');
      } catch {
        console.error('Failed to parse property review context');
      }
    }
  }, [searchParams]);

  // Fetch entities for context selector
  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch('/api/entities');
        const data = await res.json();
        setEntities(data.entities || []);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      }
    }
    fetchEntities();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Memoized handleSend to use in auto-send effect
  const handleSend = useCallback(async (message: string) => {
    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    // Add placeholder for assistant
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date().toISOString() },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          entitySlug,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Get conversation ID from header
      const newConversationId = response.headers.get('X-Conversation-Id');

      // Handle streaming response - server sends raw text chunks
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the raw text chunk directly
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Update the assistant message with accumulated content
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date().toISOString(),
          };
          return updated;
        });
      }

      // Update conversation ID if new
      if (newConversationId && newConversationId !== 'new' && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        // Redirect to conversation URL
        router.push(`/chat/${newConversationId}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId, entitySlug, router]);

  // Auto-send property review prompt when pending and entities loaded
  useEffect(() => {
    if (autoSendPending && entities.length > 0 && !isStreaming && messages.length === 0) {
      handleSend(autoSendPending);
      setAutoSendPending(null);
    }
  }, [autoSendPending, entities.length, isStreaming, messages.length, handleSend]);

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Minimal header */}
      <div className="hidden md:flex h-14 border-b border-border bg-surface/50 backdrop-blur-sm px-6 items-center justify-between">
        <h1 className="text-lg font-semibold text-text">CFO</h1>
        <select
          value={entitySlug || ''}
          onChange={(e) => setEntitySlug(e.target.value || null)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-surface text-text focus:outline-none focus:border-accent"
        >
          <option value="">All entities</option>
          {entities.map((entity) => (
            <option key={entity.slug} value={entity.slug}>
              {entity.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-[calc(100vh-280px)] md:h-[calc(100vh-200px)]"
            >
              <h2 className="text-2xl font-semibold text-text mb-6">
                What&apos;s on your mind?
              </h2>
              <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-2.5 text-[13px] rounded-xl border border-border bg-surface hover:border-accent hover:text-accent transition-all shadow-sm hover:shadow-md"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isStreaming={
                    isStreaming &&
                    index === messages.length - 1 &&
                    msg.role === 'assistant'
                  }
                />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
