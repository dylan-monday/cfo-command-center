'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatMessage, ChatInput, DocumentPreview } from '@/components/chat';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AlertContext {
  id: string;
  message: string;
}

interface ParsedDocument {
  filename: string;
  tempPath: string | null;
  summary: string;
  docType: string;
  docSubtype?: string;
  keyFigures: Record<string, string | number>;
  suggestedEntity?: string | null;
  suggestedAccount?: string | null;
  questions?: string[];
}

interface DocumentPreviewState {
  parsed: ParsedDocument;
  isConfirming: boolean;
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

  // Alert context state
  const [alertContext, setAlertContext] = useState<AlertContext | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState(false);
  const [alertResolved, setAlertResolved] = useState(false);

  // Document upload state
  const [pendingDocument, setPendingDocument] = useState<DocumentPreviewState | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Check for property review context from URL or sessionStorage
  useEffect(() => {
    // Check URL params for entity
    const urlEntity = searchParams.get('entity');
    if (urlEntity) {
      setEntitySlug(urlEntity);
    }

    // Check URL params for alert context
    const alertId = searchParams.get('alertId');
    const alertMessage = searchParams.get('context');
    if (alertId && alertMessage) {
      setAlertContext({
        id: alertId,
        message: decodeURIComponent(alertMessage),
      });
      // Auto-send the alert as a prompt
      setAutoSendPending(`I need to address this action item: "${decodeURIComponent(alertMessage)}"`);
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

  // Handle resolving the alert
  const handleResolveAlert = async () => {
    if (!alertContext) return;

    setResolvingAlert(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertContext.id,
          status: 'resolved',
          resolvedNote: 'Resolved via chat discussion',
        }),
      });

      if (res.ok) {
        setAlertResolved(true);
        // Clear alert context after a delay
        setTimeout(() => {
          setAlertContext(null);
          setAlertResolved(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setResolvingAlert(false);
    }
  };

  // Handle dismissing the alert banner without resolving
  const handleDismissAlert = () => {
    setAlertContext(null);
  };

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

  // Handle file upload - parse and show preview
  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);

    // Add a user message showing they uploaded a file
    const userMessage: Message = {
      role: 'user',
      content: `📎 Uploading document: ${file.name}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (entitySlug) {
        formData.append('entityHint', entitySlug);
      }

      const response = await fetch('/api/parse-preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse document');
      }

      const data = await response.json();

      // Set pending document for review
      setPendingDocument({
        parsed: {
          filename: data.preview.filename,
          tempPath: data.preview.tempPath,
          summary: data.parsed.summary,
          docType: data.parsed.docType,
          docSubtype: data.parsed.docSubtype,
          keyFigures: data.parsed.keyFigures,
          suggestedEntity: data.parsed.suggestedEntity,
          suggestedAccount: data.parsed.suggestedAccount,
          questions: data.parsed.questions,
        },
        isConfirming: false,
      });

      // Add assistant message prompting review
      const assistantMessage: Message = {
        role: 'assistant',
        content: `I've parsed **${file.name}**. Please review the extracted information below and confirm if everything looks correct, or edit any values that need correction.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I had trouble parsing that document. Please try again or use a different file format.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle document confirmation
  const handleConfirmDocument = async (edits: Record<string, string | number>) => {
    if (!pendingDocument) return;

    setPendingDocument((prev) => prev ? { ...prev, isConfirming: true } : null);

    try {
      const response = await fetch('/api/parse-preview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: pendingDocument.parsed.filename,
          tempPath: pendingDocument.parsed.tempPath,
          docType: pendingDocument.parsed.docType,
          docSubtype: pendingDocument.parsed.docSubtype,
          keyFigures: pendingDocument.parsed.keyFigures,
          summary: pendingDocument.parsed.summary,
          entitySlug: pendingDocument.parsed.suggestedEntity || entitySlug,
          accountName: pendingDocument.parsed.suggestedAccount,
          userEdits: edits,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const data = await response.json();

      // Add success message
      const successMessage: Message = {
        role: 'assistant',
        content: `✅ **${pendingDocument.parsed.filename}** has been saved to the knowledge base. ${
          data.knowledge?.factsCreated
            ? `I extracted ${data.knowledge.factsCreated} fact${data.knowledge.factsCreated > 1 ? 's' : ''} from this document.`
            : ''
        }`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, successMessage]);

      // Clear pending document
      setPendingDocument(null);

    } catch (error) {
      console.error('Document confirm error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I had trouble saving that document. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setPendingDocument((prev) => prev ? { ...prev, isConfirming: false } : null);
    }
  };

  // Handle document rejection
  const handleRejectDocument = () => {
    const rejectMessage: Message = {
      role: 'assistant',
      content: 'Document discarded. Feel free to upload another file or ask me anything.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, rejectMessage]);
    setPendingDocument(null);
  };

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

      {/* Alert context banner */}
      <AnimatePresence>
        {alertContext && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="max-w-3xl mx-auto px-4 py-3">
              <div
                className={`p-4 rounded-lg flex items-start justify-between ${
                  alertResolved
                    ? 'bg-success-light border border-success/20'
                    : 'bg-warning-light border border-warning/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alertResolved ? (
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-text">
                      {alertResolved ? 'Action Item Resolved' : 'Discussing Action Item'}
                    </div>
                    <div className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {alertContext.message}
                    </div>
                  </div>
                </div>

                {!alertResolved && messages.length >= 2 && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={handleResolveAlert}
                      disabled={resolvingAlert}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-success hover:bg-success/90 rounded-md transition-colors disabled:opacity-50"
                    >
                      {resolvingAlert ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Mark Resolved
                    </button>
                    <button
                      onClick={handleDismissAlert}
                      className="p-1.5 text-text-muted hover:text-text rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {alertResolved && (
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

              {/* Document preview for user confirmation */}
              {pendingDocument && (
                <DocumentPreview
                  filename={pendingDocument.parsed.filename}
                  summary={pendingDocument.parsed.summary}
                  docType={pendingDocument.parsed.docType}
                  keyFigures={pendingDocument.parsed.keyFigures}
                  suggestedEntity={pendingDocument.parsed.suggestedEntity}
                  questions={pendingDocument.parsed.questions}
                  onConfirm={handleConfirmDocument}
                  onReject={handleRejectDocument}
                  isConfirming={pendingDocument.isConfirming}
                />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        onFileUpload={handleFileUpload}
        disabled={isStreaming || !!pendingDocument}
        uploadingFile={uploadingFile}
      />
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
