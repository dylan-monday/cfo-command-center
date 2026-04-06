/**
 * Context Builder
 *
 * Assembles the complete system context for Claude API calls.
 * Queries all relevant data from Supabase and formats it for injection
 * into the system prompt.
 */

import { createServerSupabaseClient } from './supabase';
import type {
  Entity,
  Account,
  KnowledgeEntry,
  TaxStrategy,
  ProactiveQueueItem,
  TaxEstimate,
  Message,
  SystemContext,
} from '@/types';

// ============================================================================
// Context Assembly
// ============================================================================

/**
 * Builds the complete system context for a Claude API call.
 * Optionally filters by entity for entity-specific queries.
 */
export async function buildSystemContext(options?: {
  entitySlug?: string;
  includeConversationHistory?: Message[];
  limitKnowledge?: number;
  limitAlerts?: number;
}): Promise<SystemContext> {
  const supabase = createServerSupabaseClient();
  const {
    entitySlug,
    includeConversationHistory,
    limitKnowledge = 200,
    limitAlerts = 50,
  } = options || {};

  // Fetch all entities
  const { data: entities } = await supabase
    .from('entities')
    .select('*')
    .order('slug');

  // Find entity ID if filtering
  const targetEntity = entitySlug
    ? entities?.find((e) => e.slug === entitySlug)
    : null;

  // Fetch accounts (optionally filtered by entity)
  const accountsQuery = supabase.from('accounts').select('*');
  if (targetEntity) {
    accountsQuery.eq('entity_id', targetEntity.id);
  }
  const { data: accounts } = await accountsQuery.order('name');

  // Fetch knowledge base (optionally filtered by entity, include global facts)
  const { data: knowledge } = await supabase
    .from('knowledge_base')
    .select('*')
    .or(
      targetEntity
        ? `entity_id.eq.${targetEntity.id},entity_id.is.null`
        : 'id.not.is.null'
    )
    .neq('confidence', 'stale') // Exclude stale facts
    .order('category')
    .limit(limitKnowledge);

  // Fetch tax strategies (optionally filtered by entity)
  const strategiesQuery = supabase.from('tax_strategies').select('*');
  if (targetEntity) {
    strategiesQuery.eq('entity_id', targetEntity.id);
  }
  const { data: strategies } = await strategiesQuery
    .neq('status', 'deprecated')
    .order('impact', { ascending: false });

  // Fetch open alerts (optionally filtered by entity)
  const alertsQuery = supabase.from('proactive_queue').select('*');
  if (targetEntity) {
    alertsQuery.or(`entity_id.eq.${targetEntity.id},entity_id.is.null`);
  }
  const { data: alerts } = await alertsQuery
    .eq('status', 'open')
    .order('priority')
    .limit(limitAlerts);

  // Fetch latest tax estimate
  const { data: taxEstimates } = await supabase
    .from('tax_estimates')
    .select('*')
    .order('as_of_date', { ascending: false })
    .limit(1);

  return {
    entities: (entities as Entity[]) || [],
    accounts: (accounts as Account[]) || [],
    knowledge: (knowledge as KnowledgeEntry[]) || [],
    strategies: (strategies as TaxStrategy[]) || [],
    alerts: (alerts as ProactiveQueueItem[]) || [],
    latestTaxEstimate: (taxEstimates?.[0] as TaxEstimate) || undefined,
    conversationHistory: includeConversationHistory,
  };
}

// ============================================================================
// System Prompt Generation
// ============================================================================

// Property slugs that trigger property management mode
const PROPERTY_ENTITIES = ['got', 'saratoga', 'nice', 'chippewa', 'hvr'];

// Property management operational context
const PROPERTY_MANAGEMENT_CONTEXT = `
## PROPERTY MANAGEMENT MODE

You are also acting as COO/Controller for this property. In addition to tax and financial strategy, you:

### Utility Bill Scrutiny
Verify every utility bill against known ranges. ALERT if outside normal:
- **SF Water** (GOT/18th St): $300-350/mo normal
- **SF PG&E** (GOT): $85-95/mo normal
- **SF Recology** (GOT): ~$460/quarter
- **NOLA SWBNO** (Saratoga): $120-140/mo normal (ALERT if >$150 - possible leak)
- **NOLA Delta Gas** (Saratoga): $50-65/mo winter
- **France utilities** (Nice): Verify charges in EUR, track separately

### Property Manager Fee Verification
Calculate and verify PM fees every month:
- **18th St / Morley**: 7% of $13,750 = $962.50/mo
- **Saratoga / Satsuma**: 10% of gross rent (verify against actual)

### Repair Authorization
Check repair charges against authorization limits:
- **18th St**: $250 limit without approval. Flag anything above.
- **Saratoga**: Review all repair charges - Satsuma tends to overpay

### Monthly Reconciliation Checklist
When processing documents or running reviews:
1. Verify PM fee calculation is correct
2. Confirm all tenants paid (look for NSFs, late fees)
3. Reconcile PM distributions against bank deposits
4. Review all repair/maintenance charges
5. Check utilities against normal ranges
6. Flag any unusual or unexplained charges

### Lease Management
- Flag leases within 90 days of expiration
- Track tenant payment patterns (late patterns, split payments)
- Note any lease violations or concerns

### PM Reliability Notes
- **SATSUMA (Saratoga)**: BE SKEPTICAL. They pay bills without questioning, provide non-standard reporting periods, and have poor follow-up. Always verify their numbers independently. Double-check math on owner statements.
- **MORLEY (18th St/GOT)**: Generally reliable and trustworthy. Clean reporting, responsive. Verify but trust.

### France Property (Nice) Specifics
- Verify CCF mortgage auto-debit cleared each month
- Track EUR account balance and calculate runway
- ALERT when runway drops below 3 months of carrying costs
- All amounts should be in EUR, clearly labeled
`;

/**
 * Generates the complete system prompt for Claude, including all context.
 */
export function generateSystemPrompt(context: SystemContext, entitySlug?: string): string {
  const sections: string[] = [];

  // Identity and personality
  sections.push(`# CFO Command Center

You are Dylan's personal CFO assistant. You manage the complete financial picture across multiple business entities and properties. You speak like a smart friend who knows tax law - direct, specific with dollar amounts, opinionated, and occasionally funny. Never condescending.

Say "You should do this" not "you may want to consider." Always give concrete numbers, not vague descriptions. When you don't know something, say so and add it to the proactive queue as a question.

## Your Responsibilities
- Answer questions about any entity's finances, taxes, or operations
- Track and surface action items, deadlines, and concerns
- Help with tax planning and strategy optimization
- Parse and understand financial documents
- Maintain the knowledge base with accurate, up-to-date information
- Flag items for CPA review when appropriate`);

  // Add property management context if a property entity is selected
  if (entitySlug && PROPERTY_ENTITIES.includes(entitySlug)) {
    sections.push(PROPERTY_MANAGEMENT_CONTEXT);
  }

  // Entities overview
  if (context.entities.length > 0) {
    sections.push(`## Entities (${context.entities.length})

${context.entities
  .map(
    (e) =>
      `### ${e.name} (${e.slug})
- Type: ${e.type}
- Tax Treatment: ${e.tax_treatment}
${e.notes ? `- Notes: ${e.notes}` : ''}`
  )
  .join('\n\n')}`);
  }

  // Accounts overview
  if (context.accounts.length > 0) {
    sections.push(`## Accounts (${context.accounts.length})

${context.accounts
  .map((a) => {
    const entity = context.entities.find((e) => e.id === a.entity_id);
    return `- **${a.name}** (${entity?.slug || 'unknown'}) - ${a.type} @ ${a.institution}${a.last4 ? ` ending ${a.last4}` : ''}`;
  })
  .join('\n')}`);
  }

  // Knowledge base (grouped by category)
  if (context.knowledge.length > 0) {
    const byCategory = context.knowledge.reduce(
      (acc, k) => {
        if (!acc[k.category]) acc[k.category] = [];
        acc[k.category].push(k);
        return acc;
      },
      {} as Record<string, KnowledgeEntry[]>
    );

    sections.push(`## Knowledge Base (${context.knowledge.length} facts)

${Object.entries(byCategory)
  .map(
    ([category, facts]) =>
      `### ${category.charAt(0).toUpperCase() + category.slice(1)}
${facts.map((f) => `- **${f.key}**: ${f.value}`).join('\n')}`
  )
  .join('\n\n')}`);
  }

  // Tax strategies
  if (context.strategies.length > 0) {
    const byStatus = context.strategies.reduce(
      (acc, s) => {
        if (!acc[s.status]) acc[s.status] = [];
        acc[s.status].push(s);
        return acc;
      },
      {} as Record<string, TaxStrategy[]>
    );

    sections.push(`## Tax Strategies (${context.strategies.length})

${Object.entries(byStatus)
  .map(
    ([status, strategies]) =>
      `### ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
${strategies
  .map((s) => {
    const entity = context.entities.find((e) => e.id === s.entity_id);
    return `- **${s.name}** (${entity?.slug || 'unknown'}) - ${s.impact} impact${s.estimated_savings ? `, ~$${s.estimated_savings.toLocaleString()} savings` : ''}${s.cpa_flag ? ' [CPA]' : ''}
  ${s.description}${s.action_required ? `\n  ACTION: ${s.action_required}` : ''}`;
  })
  .join('\n')}`
  )
  .join('\n\n')}`);
  }

  // Proactive queue (alerts, questions, deadlines)
  if (context.alerts.length > 0) {
    const byPriority = context.alerts.reduce(
      (acc, a) => {
        if (!acc[a.priority]) acc[a.priority] = [];
        acc[a.priority].push(a);
        return acc;
      },
      {} as Record<string, ProactiveQueueItem[]>
    );

    const priorityOrder = ['critical', 'high', 'medium', 'low', 'monitor'];

    sections.push(`## Open Items (${context.alerts.length})

${priorityOrder
  .filter((p) => byPriority[p])
  .map(
    (priority) =>
      `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
${byPriority[priority]
  .map((a) => {
    const entity = context.entities.find((e) => e.id === a.entity_id);
    return `- [${a.type.toUpperCase()}]${entity ? ` (${entity.slug})` : ''} ${a.message}${a.due_date ? ` - Due: ${a.due_date}` : ''}`;
  })
  .join('\n')}`
  )
  .join('\n\n')}`);
  }

  // Latest tax estimate
  if (context.latestTaxEstimate) {
    const te = context.latestTaxEstimate;
    sections.push(`## Latest Tax Estimate (as of ${te.as_of_date})

- Tax Year: ${te.tax_year}
- Gross Income: $${te.gross_income.toLocaleString()}
- Total Deductions: $${te.total_deductions.toLocaleString()}
- Taxable Income: $${te.taxable_income.toLocaleString()}
- Estimated Tax: $${te.estimated_tax.toLocaleString()}
- Estimated Payments: $${te.estimated_payments.toLocaleString()}
- Withholding: $${te.withholding.toLocaleString()}
- **Projected Liability: $${te.projected_liability.toLocaleString()}**${te.notes ? `\n- Notes: ${te.notes}` : ''}`);
  }

  // Instructions for response
  sections.push(`## Response Format Rules

**BE CONCISE.** This is a conversation, not a report.

1. **Keep responses SHORT** — 2-4 paragraphs max. Not walls of text.
2. **Lead with the answer** — If it's a yes/no question, start with yes or no. No preamble.
3. **Bullets sparingly** — Only for genuinely parallel items (3-5 max). Never more than 5 bullets.
4. **One question at a time** — If you need info, ask ONE question. Not five.
5. **Dollar amounts inline** — Write "$17,500" in a sentence, not in tables or formatted blocks.
6. **No markdown formatting** — No headers, no bold text, no code blocks. Just plain conversational text.
7. **Short version first** — If a topic needs deep explanation, give the short answer and ask "Want me to go deeper?"
8. **Match the energy** — Short question = short answer. Detailed question = more detail.

## Context Rules

- Use actual dollar amounts, dates, and names from the context above
- If you notice something concerning, mention it briefly
- If you don't know something, say so simply
- For complex tax questions, note if CPA input is needed
- Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);

  return sections.join('\n\n---\n\n');
}

// ============================================================================
// Conversation Context
// ============================================================================

/**
 * Formats conversation history for inclusion in the prompt.
 */
export function formatConversationHistory(messages: Message[]): string {
  if (!messages || messages.length === 0) return '';

  return messages
    .map((m) => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      return `**${role}**: ${m.content}`;
    })
    .join('\n\n');
}

/**
 * Builds the complete messages array for a Claude API call.
 */
export async function buildChatMessages(
  userMessage: string,
  conversationHistory?: Message[],
  entitySlug?: string
): Promise<{ system: string; messages: Array<{ role: 'user' | 'assistant'; content: string }> }> {
  // Build context
  const context = await buildSystemContext({
    entitySlug,
    includeConversationHistory: conversationHistory,
  });

  // Generate system prompt (pass entitySlug for property management mode)
  const system = generateSystemPrompt(context, entitySlug);

  // Build messages array
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  // DEBUG: Log messages being sent to Claude
  console.log('=== CLAUDE API DEBUG ===');
  console.log('Conversation history received:', conversationHistory?.length || 0, 'messages');
  console.log('Final messages array:', messages.length, 'messages');
  console.log('Messages:', JSON.stringify(messages.map(m => ({ role: m.role, contentLength: m.content.length, preview: m.content.slice(0, 50) })), null, 2));
  console.log('========================');

  return { system, messages };
}
