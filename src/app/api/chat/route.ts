/**
 * Chat API Route
 *
 * POST /api/chat
 *
 * Main conversational endpoint with streaming responses.
 * Handles context injection, response streaming, and async fact extraction.
 */

import { NextRequest } from 'next/server';
import { createChatStream, chat } from '@/lib/claude';
import { extractAndPersistFacts } from '@/lib/knowledge-extractor';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { Message } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface ChatRequestBody {
  message: string;
  conversationId?: string;
  entitySlug?: string;
  stream?: boolean;
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { message, conversationId, entitySlug, stream = true } = body;

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Load conversation history if conversationId provided
    let conversationHistory: Message[] = [];
    let existingConversationId = conversationId;

    // DEBUG: Log incoming request
    console.log('=== CHAT API DEBUG ===');
    console.log('Received conversationId:', conversationId || 'NONE');
    console.log('Received entitySlug:', entitySlug || 'NONE');
    console.log('Message preview:', message.slice(0, 100));

    if (conversationId) {
      const supabase = createServerSupabaseClient();
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      console.log('DB query error:', error?.message || 'NONE');
      console.log('Conversation found:', !!conversation);
      console.log('Messages in DB:', conversation?.messages?.length || 0);

      if (conversation) {
        conversationHistory = conversation.messages as Message[];
      }
    } else {
      console.log('No conversationId - starting fresh conversation');
    }
    console.log('======================');

    // Streaming response
    if (stream) {
      const responseStream = await createChatStream(message, {
        conversationHistory,
        entitySlug,
      });

      // Collect chunks for post-processing using closure
      const collectedChunks: string[] = [];

      // Create a response that also handles post-processing
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          // Pass through the chunk
          controller.enqueue(chunk);
          // Store for later using closure
          const text = new TextDecoder().decode(chunk);
          collectedChunks.push(text);
        },
        async flush() {
          // After streaming completes, extract facts asynchronously
          const fullResponse = collectedChunks.join('');

          // Fire and forget - don't block the response
          Promise.resolve().then(async () => {
            try {
              // Save conversation
              const supabase = createServerSupabaseClient();
              const newMessages: Message[] = [
                ...conversationHistory,
                { role: 'user', content: message, timestamp: new Date().toISOString() },
                { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
              ];

              if (existingConversationId) {
                await supabase
                  .from('conversations')
                  .update({
                    messages: newMessages,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingConversationId);
              } else {
                const { data } = await supabase
                  .from('conversations')
                  .insert({
                    title: message.slice(0, 100),
                    messages: newMessages,
                  })
                  .select('id')
                  .single();

                existingConversationId = data?.id;
              }

              // Extract facts
              await extractAndPersistFacts(message, fullResponse, existingConversationId);
            } catch (err) {
              console.error('Post-processing error:', err);
            }
          });
        },
      });

      const pipedStream = responseStream.pipeThrough(transformStream);

      return new Response(pipedStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Conversation-Id': existingConversationId || 'new',
        },
      });
    }

    // Non-streaming response
    const response = await chat(message, {
      conversationHistory,
      entitySlug,
    });

    // Save conversation
    const supabase = createServerSupabaseClient();
    const newMessages: Message[] = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response.content, timestamp: new Date().toISOString() },
    ];

    let finalConversationId = conversationId;

    if (conversationId) {
      await supabase
        .from('conversations')
        .update({
          messages: newMessages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    } else {
      const { data } = await supabase
        .from('conversations')
        .insert({
          title: message.slice(0, 100),
          messages: newMessages,
        })
        .select('id')
        .single();

      finalConversationId = data?.id;
    }

    // Extract facts asynchronously
    extractAndPersistFacts(message, response.content, finalConversationId).catch(console.error);

    return Response.json({
      response: response.content,
      conversationId: finalConversationId,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - Get single conversation or list conversations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    const supabase = createServerSupabaseClient();

    // If conversationId provided, return that specific conversation with messages
    if (conversationId) {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return Response.json({ conversation });
    }

    // Otherwise, list all conversations (without messages for efficiency)
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error, count } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      conversations: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET conversations error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
