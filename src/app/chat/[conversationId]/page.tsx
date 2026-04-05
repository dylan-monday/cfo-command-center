'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage, ChatInput } from '@/components/chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entitySlug, setEntitySlug] = useState<string | null>(null);
  const [entities, setEntities] = useState<{ slug: string; name: string }[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Load conversation
  useEffect(() => {
    async function loadConversation() {
      try {
        const res = await fetch(`/api/chat?conversationId=${conversationId}`);
        const data = await res.json();

        if (data.conversation) {
          setTitle(data.conversation.title);
          // Parse messages from conversation
          const loadedMessages: Message[] = (data.conversation.messages || []).map(
            (msg: { role: string; content: string; timestamp?: string }) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.timestamp,
            })
          );
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConversation();
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message: string) => {
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
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-bg">
        <div className="hidden md:flex h-14 border-b border-border bg-surface/50 px-6 items-center">
          <div className="h-5 w-48 bg-surface-alt rounded animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-text-muted mt-3">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Minimal header */}
      <div className="hidden md:flex h-14 border-b border-border bg-surface/50 backdrop-blur-sm px-6 items-center justify-between">
        <h1 className="text-lg font-semibold text-text truncate max-w-md">
          {title || 'CFO'}
        </h1>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
