/**
 * Knowledge Extractor
 *
 * Handles extraction and persistence of facts from conversations
 * and documents into the knowledge base.
 */

import { createServerSupabaseClient } from './supabase';
import { extractFactsFromResponse } from './claude';
import type { KnowledgeEntry, KnowledgeCategory, KnowledgeConfidence } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedFact {
  category: KnowledgeCategory;
  key: string;
  value: string;
  entitySlug?: string;
  confidence: KnowledgeConfidence;
}

export interface PersistResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// Fact Extraction
// ============================================================================

/**
 * Extract facts from a conversation exchange and persist them.
 * This should be called asynchronously after each chat response.
 */
export async function extractAndPersistFacts(
  userMessage: string,
  assistantResponse: string,
  conversationId?: string
): Promise<PersistResult> {
  // Extract facts using Claude
  const extractedFacts = await extractFactsFromResponse(userMessage, assistantResponse);

  if (extractedFacts.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, errors: [] };
  }

  // Persist facts to database
  return persistFacts(
    extractedFacts.map((f) => ({
      category: f.category as KnowledgeCategory,
      key: f.key,
      value: f.value,
      entitySlug: f.entitySlug,
      confidence: f.confidence as KnowledgeConfidence,
    })),
    'chat',
    conversationId
  );
}

// ============================================================================
// Fact Persistence
// ============================================================================

/**
 * Persist extracted facts to the knowledge base.
 * Handles deduplication and superseding of stale facts.
 */
export async function persistFacts(
  facts: ExtractedFact[],
  source: 'chat' | 'document' | 'user' = 'chat',
  referenceId?: string
): Promise<PersistResult> {
  const supabase = createServerSupabaseClient();
  const result: PersistResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  // Get entity ID map
  const { data: entities } = await supabase.from('entities').select('id, slug');
  const entityMap = new Map(entities?.map((e) => [e.slug, e.id]) || []);

  for (const fact of facts) {
    try {
      const entityId = fact.entitySlug ? entityMap.get(fact.entitySlug) : null;

      // Check for existing fact with same key and entity
      const { data: existing } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('key', fact.key)
        .eq('entity_id', entityId || '')
        .neq('confidence', 'stale')
        .limit(1)
        .single();

      if (existing) {
        // Check if value is different
        if (existing.value === fact.value) {
          // Same fact, skip
          result.skipped++;
          continue;
        }

        // Value changed - mark old fact as stale and insert new one
        await supabase
          .from('knowledge_base')
          .update({ confidence: 'stale' })
          .eq('id', existing.id);

        // Insert new fact that supersedes the old one
        const { error } = await supabase.from('knowledge_base').insert({
          entity_id: entityId,
          category: fact.category,
          key: fact.key,
          value: fact.value,
          source,
          confidence: fact.confidence,
          supersedes_id: existing.id,
          verified_at: fact.confidence === 'confirmed' ? new Date().toISOString() : null,
        });

        if (error) {
          result.errors.push(`Failed to update ${fact.key}: ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        // New fact - insert
        const { error } = await supabase.from('knowledge_base').insert({
          entity_id: entityId,
          category: fact.category,
          key: fact.key,
          value: fact.value,
          source,
          confidence: fact.confidence,
          verified_at: fact.confidence === 'confirmed' ? new Date().toISOString() : null,
        });

        if (error) {
          result.errors.push(`Failed to insert ${fact.key}: ${error.message}`);
        } else {
          result.inserted++;
        }
      }
    } catch (err) {
      result.errors.push(`Error processing ${fact.key}: ${err}`);
    }
  }

  return result;
}

// ============================================================================
// Knowledge Queries
// ============================================================================

/**
 * Get all facts for a specific entity.
 */
export async function getEntityFacts(
  entitySlug: string,
  includeGlobal = true
): Promise<KnowledgeEntry[]> {
  const supabase = createServerSupabaseClient();

  // Get entity ID
  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('slug', entitySlug)
    .single();

  if (!entity) return [];

  // Query facts
  const query = supabase
    .from('knowledge_base')
    .select('*')
    .neq('confidence', 'stale');

  if (includeGlobal) {
    query.or(`entity_id.eq.${entity.id},entity_id.is.null`);
  } else {
    query.eq('entity_id', entity.id);
  }

  const { data } = await query.order('category');
  return (data as KnowledgeEntry[]) || [];
}

/**
 * Get facts by category.
 */
export async function getFactsByCategory(
  category: KnowledgeCategory
): Promise<KnowledgeEntry[]> {
  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('category', category)
    .neq('confidence', 'stale')
    .order('key');

  return (data as KnowledgeEntry[]) || [];
}

/**
 * Search facts by key or value.
 */
export async function searchFacts(query: string): Promise<KnowledgeEntry[]> {
  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from('knowledge_base')
    .select('*')
    .neq('confidence', 'stale')
    .or(`key.ilike.%${query}%,value.ilike.%${query}%`)
    .order('category')
    .limit(50);

  return (data as KnowledgeEntry[]) || [];
}

/**
 * Mark a fact as stale (when it's known to be outdated).
 */
export async function markFactStale(factId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('knowledge_base')
    .update({ confidence: 'stale' })
    .eq('id', factId);

  return !error;
}

/**
 * Verify a fact (mark as confirmed with current timestamp).
 */
export async function verifyFact(factId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('knowledge_base')
    .update({
      confidence: 'confirmed',
      verified_at: new Date().toISOString(),
    })
    .eq('id', factId);

  return !error;
}

// ============================================================================
// Document Knowledge Extraction
// ============================================================================

/**
 * Extract knowledge facts from a parsed document's key figures.
 * Creates structured facts with proper categories and keys.
 */
export async function extractKnowledgeFromDocument(params: {
  documentId: string;
  entitySlug?: string;
  docType: string;
  keyFigures: Record<string, number | string> | null;
  taxYear?: number;
  aiSummary?: string;
}): Promise<PersistResult> {
  const { documentId, entitySlug, docType, keyFigures, taxYear, aiSummary } = params;

  if (!keyFigures || Object.keys(keyFigures).length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, errors: [] };
  }

  const facts: ExtractedFact[] = [];
  const year = taxYear || new Date().getFullYear();

  // Map key figure names to knowledge categories and readable keys
  const figureMapping: Record<string, { category: KnowledgeCategory; keyPrefix: string }> = {
    // Income/Revenue
    total_income: { category: 'financial', keyPrefix: 'total_income' },
    gross_income: { category: 'financial', keyPrefix: 'gross_income' },
    net_income: { category: 'financial', keyPrefix: 'net_income' },
    net_operating_income: { category: 'financial', keyPrefix: 'net_operating_income' },

    // Tax figures
    total_tax: { category: 'tax', keyPrefix: 'total_tax' },
    federal_tax: { category: 'tax', keyPrefix: 'federal_tax' },
    state_tax: { category: 'tax', keyPrefix: 'state_tax' },
    income_franchise_tax_due: { category: 'tax', keyPrefix: 'la_franchise_tax' },
    total_amount_due: { category: 'tax', keyPrefix: 'tax_amount_due' },
    refund: { category: 'tax', keyPrefix: 'tax_refund' },
    electronic_payment: { category: 'tax', keyPrefix: 'electronic_payment' },

    // Balances
    beginning_balance: { category: 'financial', keyPrefix: 'beginning_balance' },
    ending_balance: { category: 'financial', keyPrefix: 'ending_balance' },

    // Expenses
    total_expenses: { category: 'financial', keyPrefix: 'total_expenses' },
    fees: { category: 'financial', keyPrefix: 'fees' },

    // Investments
    contributions: { category: 'financial', keyPrefix: 'contributions' },
    withdrawals: { category: 'financial', keyPrefix: 'withdrawals' },
    gains_losses: { category: 'financial', keyPrefix: 'gains_losses' },

    // Property
    rent_collected: { category: 'property', keyPrefix: 'rent_collected' },
    management_fee: { category: 'property', keyPrefix: 'management_fee' },
    repairs: { category: 'property', keyPrefix: 'repairs' },
  };

  // Convert key figures to facts
  for (const [figureKey, value] of Object.entries(keyFigures)) {
    // Parse numeric value if it's a string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Skip zero values for certain fields (but keep for refunds, amounts due)
    const skipZeroFields = ['beginning_balance', 'ending_balance', 'contributions', 'withdrawals'];
    if (numericValue === 0 && skipZeroFields.includes(figureKey)) {
      continue;
    }

    const mapping = figureMapping[figureKey];
    const category: KnowledgeCategory = mapping?.category || 'financial';
    const keyPrefix = mapping?.keyPrefix || figureKey.replace(/_/g, '_');

    // Format the value as currency
    const formattedValue = !isNaN(numericValue)
      ? numericValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : String(value);

    // Create fact key with year and doc type context
    const factKey = `${year}_${keyPrefix}`;

    facts.push({
      category,
      key: factKey,
      value: formattedValue,
      entitySlug,
      confidence: 'confirmed', // Document data is considered confirmed
    });
  }

  // Persist facts with document source
  const result = await persistFacts(facts, 'document', documentId);

  console.log(`Knowledge extraction for document ${documentId}: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`);

  return result;
}

// ============================================================================
// Staleness Detection
// ============================================================================

/**
 * Get facts that haven't been verified in a while.
 * Used by the staleness-check cron job.
 */
export async function getStaleableFacts(daysSinceVerification = 90): Promise<KnowledgeEntry[]> {
  const supabase = createServerSupabaseClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceVerification);

  const { data } = await supabase
    .from('knowledge_base')
    .select('*')
    .neq('confidence', 'stale')
    .or(`verified_at.is.null,verified_at.lt.${cutoffDate.toISOString()}`)
    .order('verified_at', { ascending: true, nullsFirst: true })
    .limit(100);

  return (data as KnowledgeEntry[]) || [];
}
