/**
 * Claude API Wrapper
 *
 * Provides streaming and non-streaming interfaces to Claude API
 * using the Anthropic SDK.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildChatMessages } from './context-builder';
import type { Message } from '@/types';

// ============================================================================
// Client Configuration
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model configuration
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

// ============================================================================
// Types
// ============================================================================

export interface ChatOptions {
  conversationHistory?: Message[];
  entitySlug?: string;
  model?: string;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
}

// ============================================================================
// Non-Streaming Chat
// ============================================================================

/**
 * Send a message to Claude and get a complete response.
 * Use this for simple queries or when you don't need streaming.
 */
export async function chat(
  userMessage: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    conversationHistory,
    entitySlug,
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
  } = options;

  // Build context-aware messages
  const { system, messages } = await buildChatMessages(
    userMessage,
    conversationHistory,
    entitySlug
  );

  // Call Claude API
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  return {
    content,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    stopReason: response.stop_reason,
  };
}

// ============================================================================
// Streaming Chat
// ============================================================================

/**
 * Send a message to Claude and stream the response.
 * Returns an async generator that yields text chunks.
 */
export async function* chatStream(
  userMessage: string,
  options: ChatOptions = {}
): AsyncGenerator<string, { inputTokens: number; outputTokens: number }, unknown> {
  const {
    conversationHistory,
    entitySlug,
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
  } = options;

  // Build context-aware messages
  const { system, messages } = await buildChatMessages(
    userMessage,
    conversationHistory,
    entitySlug
  );

  // Create streaming response
  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  // Yield text chunks as they arrive
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }

  // Get final message for token counts
  const finalMessage = await stream.finalMessage();

  return {
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
  };
}

/**
 * Create a ReadableStream for streaming responses to the client.
 * Use this in API routes with Response streaming.
 */
export async function createChatStream(
  userMessage: string,
  options: ChatOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const {
    conversationHistory,
    entitySlug,
    model = DEFAULT_MODEL,
    maxTokens = MAX_TOKENS,
  } = options;

  // Build context-aware messages
  const { system, messages } = await buildChatMessages(
    userMessage,
    conversationHistory,
    entitySlug
  );

  // Create the stream
  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  // Create encoder for text
  const encoder = new TextEncoder();

  // Return a ReadableStream
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// ============================================================================
// Document Parsing
// ============================================================================

/**
 * Parse a document using Claude's vision capabilities (for images/PDFs)
 * or text analysis (for extracted text).
 */
export async function parseDocument(
  content: string,
  context: {
    filename: string;
    entityHint?: string;
    accountHint?: string;
    additionalContext?: string;
  }
): Promise<{
  summary: string;
  docType: string;
  docSubtype?: string;
  keyFigures: Record<string, number | string>;
  suggestedEntity?: string;
  suggestedAccount?: string;
  questions: string[];
}> {
  const systemPrompt = `You are a financial document parser. Analyze the document and extract:

1. **Document Type**: Identify what kind of document this is (bank-statement, brokerage-statement, retirement-statement, tax-document, insurance, property-report, invoice, receipt, 529-statement, option-grant, k1, w2, 1099, pm-report, other)

2. **Document Subtype**: More specific classification (e.g., "monthly statement", "quarterly report", "annual summary")

3. **Key Figures**: Extract all important numbers:
   - Beginning/ending balances
   - Total income/expenses
   - Contributions/withdrawals
   - Gains/losses
   - Fees
   - Any other significant amounts

4. **Entity Match**: Based on account numbers, addresses, or names, suggest which entity this belongs to (mp, got, saratoga, nice, chippewa, hvr, personal)

5. **Account Match**: Suggest which specific account this is for

6. **Questions**: List any clarifications needed

Respond in JSON format:
{
  "summary": "Brief description of the document",
  "docType": "document type from the list above",
  "docSubtype": "more specific type",
  "keyFigures": {
    "beginning_balance": 12345.67,
    "ending_balance": 12500.00,
    ...
  },
  "suggestedEntity": "entity slug or null",
  "suggestedAccount": "account name or null",
  "questions": ["Any questions about the document"]
}`;

  const userPrompt = `Parse this document:

Filename: ${context.filename}
${context.entityHint ? `Entity hint: ${context.entityHint}` : ''}
${context.accountHint ? `Account hint: ${context.accountHint}` : ''}
${context.additionalContext ? `Additional context: ${context.additionalContext}` : ''}

Document content:
${content}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Extract JSON from response
  const textContent = response.content.find((c) => c.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{}';

  // Parse JSON (handle markdown code blocks)
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
  const jsonStr = jsonMatch[1] || text;

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Return a default structure if parsing fails
    return {
      summary: text,
      docType: 'other',
      keyFigures: {},
      questions: ['Failed to parse document structure - manual review needed'],
    };
  }
}

// ============================================================================
// Knowledge Extraction
// ============================================================================

/**
 * Extract potential new facts from a conversation response.
 */
export async function extractFactsFromResponse(
  userMessage: string,
  assistantResponse: string
): Promise<
  Array<{
    category: string;
    key: string;
    value: string;
    entitySlug?: string;
    confidence: 'confirmed' | 'inferred';
  }>
> {
  const systemPrompt = `You are a fact extractor. Analyze this conversation and extract any new facts that should be stored in the knowledge base.

Categories: tax, financial, personal, strategy, cpa, legal, property

For each fact, determine:
1. Category (from list above)
2. Key (short identifier like "mp_gross_annual", "keelin_age", "got_mortgage_balance")
3. Value (the actual information)
4. Entity (mp, got, saratoga, nice, chippewa, hvr, personal, or null for global facts)
5. Confidence: "confirmed" if user explicitly stated it, "inferred" if derived from context

Only extract facts that are:
- New information not likely already known
- Specific and actionable
- Related to finances, taxes, properties, or family details

Respond in JSON format:
{
  "facts": [
    {
      "category": "financial",
      "key": "example_key",
      "value": "example value",
      "entitySlug": "mp",
      "confidence": "confirmed"
    }
  ]
}

If no new facts should be extracted, return: { "facts": [] }`;

  const userPrompt = `User message: ${userMessage}

Assistant response: ${assistantResponse}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Extract JSON from response
  const textContent = response.content.find((c) => c.type === 'text');
  const text = textContent?.type === 'text' ? textContent.text : '{"facts":[]}';

  // Parse JSON
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
  const jsonStr = jsonMatch[1] || text;

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.facts || [];
  } catch {
    return [];
  }
}
