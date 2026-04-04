/**
 * Knowledge Base API Route
 *
 * GET /api/knowledge - List/search facts
 * POST /api/knowledge - Add new fact
 * PATCH /api/knowledge - Update fact
 * DELETE /api/knowledge - Mark fact as stale
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { KnowledgeCategory, KnowledgeSource, KnowledgeConfidence } from '@/types';

// ============================================================================
// GET - List/Search Facts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entitySlug = searchParams.get('entity');
    const category = searchParams.get('category') as KnowledgeCategory | null;
    const search = searchParams.get('search');
    const includeStale = searchParams.get('includeStale') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('knowledge_base')
      .select('*, entities!left(slug, name)', { count: 'exact' });

    // Filter by entity
    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single() as { data: { id: string } | null };

      if (entity) {
        query = query.or(`entity_id.eq.${entity.id},entity_id.is.null`);
      }
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Exclude stale unless requested
    if (!includeStale) {
      query = query.neq('confidence', 'stale');
    }

    // Search
    if (search) {
      query = query.or(`key.ilike.%${search}%,value.ilike.%${search}%`);
    }

    // Pagination and ordering
    const { data, error, count } = await query
      .order('category')
      .order('key')
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      facts: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET knowledge error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Add New Fact
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entitySlug,
      category,
      key,
      value,
      source = 'user',
      confidence = 'confirmed',
    }: {
      entitySlug?: string;
      category: KnowledgeCategory;
      key: string;
      value: string;
      source?: KnowledgeSource;
      confidence?: KnowledgeConfidence;
    } = body;

    // Validate required fields
    if (!category || !key || !value) {
      return Response.json(
        { error: 'category, key, and value are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get entity ID if provided
    let entityId: string | null = null;
    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single() as { data: { id: string } | null };

      if (!entity) {
        return Response.json(
          { error: `Entity '${entitySlug}' not found` },
          { status: 404 }
        );
      }
      entityId = entity.id;
    }

    // Check for existing fact with same key
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id, value')
      .eq('key', key)
      .eq('entity_id', entityId || '')
      .neq('confidence', 'stale')
      .single() as { data: { id: string; value: string } | null };

    let supersedesId: string | null = null;

    if (existing) {
      if (existing.value === value) {
        return Response.json(
          { error: 'Fact already exists with same value', existingId: existing.id },
          { status: 409 }
        );
      }

      // Mark existing as stale
      await supabase
        .from('knowledge_base')
        .update({ confidence: 'stale' })
        .eq('id', existing.id);

      supersedesId = existing.id;
    }

    // Insert new fact
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        entity_id: entityId,
        category,
        key,
        value,
        source,
        confidence,
        supersedes_id: supersedesId,
        verified_at: confidence === 'confirmed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      fact: data,
      superseded: supersedesId ? true : false,
    }, { status: 201 });
  } catch (error) {
    console.error('POST knowledge error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Fact
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      value,
      confidence,
      verify,
    }: {
      id: string;
      value?: string;
      confidence?: KnowledgeConfidence;
      verify?: boolean;
    } = body;

    if (!id) {
      return Response.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (value !== undefined) {
      updates.value = value;
    }

    if (confidence !== undefined) {
      updates.confidence = confidence;
    }

    if (verify) {
      updates.confidence = 'confirmed';
      updates.verified_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { error: 'Fact not found' },
        { status: 404 }
      );
    }

    return Response.json({ fact: data });
  } catch (error) {
    console.error('PATCH knowledge error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Mark Fact as Stale
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Mark as stale instead of deleting
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({ confidence: 'stale' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { error: 'Fact not found' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Fact marked as stale',
      fact: data,
    });
  } catch (error) {
    console.error('DELETE knowledge error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
