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
