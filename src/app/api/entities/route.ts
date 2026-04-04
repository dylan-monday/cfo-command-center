/**
 * Entities API Route
 *
 * GET /api/entities - List all entities with related data
 * GET /api/entities?slug=mp - Get single entity by slug
 * POST /api/entities - Create new entity
 * PATCH /api/entities - Update entity
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { EntityType } from '@/types';

// ============================================================================
// GET - List Entities or Get Single
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const includeAccounts = searchParams.get('includeAccounts') !== 'false';
    const includeStrategies = searchParams.get('includeStrategies') === 'true';
    const includeAlerts = searchParams.get('includeAlerts') === 'true';

    const supabase = createServerSupabaseClient();

    if (slug) {
      // Get single entity with related data
      const { data: entity, error } = await supabase
        .from('entities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !entity) {
        return Response.json(
          { error: 'Entity not found' },
          { status: 404 }
        );
      }

      const result: Record<string, unknown> = { entity };

      // Fetch accounts
      if (includeAccounts) {
        const { data: accounts } = await supabase
          .from('accounts')
          .select('*')
          .eq('entity_id', entity.id)
          .order('name');
        result.accounts = accounts;
      }

      // Fetch strategies
      if (includeStrategies) {
        const { data: strategies } = await supabase
          .from('tax_strategies')
          .select('*')
          .eq('entity_id', entity.id)
          .neq('status', 'deprecated')
          .order('impact');
        result.strategies = strategies;
      }

      // Fetch alerts
      if (includeAlerts) {
        const { data: alerts } = await supabase
          .from('proactive_queue')
          .select('*')
          .eq('entity_id', entity.id)
          .eq('status', 'open')
          .order('priority');
        result.alerts = alerts;
      }

      // Fetch knowledge count
      const { count: knowledgeCount } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', entity.id)
        .neq('confidence', 'stale');
      result.knowledgeCount = knowledgeCount;

      return Response.json(result);
    }

    // List all entities with summary counts
    const { data: entities, error } = await supabase
      .from('entities')
      .select('*')
      .order('slug');

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Add summary counts for each entity
    const entitiesWithCounts = await Promise.all(
      (entities || []).map(async (entity) => {
        const [
          { count: accountCount },
          { count: strategyCount },
          { count: alertCount },
        ] = await Promise.all([
          supabase
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', entity.id),
          supabase
            .from('tax_strategies')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', entity.id)
            .neq('status', 'deprecated'),
          supabase
            .from('proactive_queue')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', entity.id)
            .eq('status', 'open'),
        ]);

        return {
          ...entity,
          _counts: {
            accounts: accountCount || 0,
            strategies: strategyCount || 0,
            openAlerts: alertCount || 0,
          },
        };
      })
    );

    return Response.json({ entities: entitiesWithCounts });
  } catch (error) {
    console.error('GET entities error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Entity
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slug,
      name,
      type,
      taxTreatment,
      color,
      notes,
      metadata,
    }: {
      slug: string;
      name: string;
      type: EntityType;
      taxTreatment: string;
      color: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    } = body;

    // Validate required fields
    if (!slug || !name || !type || !taxTreatment || !color) {
      return Response.json(
        { error: 'slug, name, type, taxTreatment, and color are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('entities')
      .select('id')
      .eq('slug', slug)
      .single() as { data: { id: string } | null };

    if (existing) {
      return Response.json(
        { error: `Entity with slug '${slug}' already exists` },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('entities')
      .insert({
        slug,
        name,
        type,
        tax_treatment: taxTreatment,
        color,
        notes,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ entity: data }, { status: 201 });
  } catch (error) {
    console.error('POST entities error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Entity
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      slug,
      name,
      type,
      taxTreatment,
      color,
      notes,
      metadata,
    }: {
      id?: string;
      slug?: string;
      name?: string;
      type?: EntityType;
      taxTreatment?: string;
      color?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    } = body;

    if (!id && !slug) {
      return Response.json(
        { error: 'id or slug is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (taxTreatment !== undefined) updates.tax_treatment = taxTreatment;
    if (color !== undefined) updates.color = color;
    if (notes !== undefined) updates.notes = notes;
    if (metadata !== undefined) updates.metadata = metadata;

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    let query = supabase.from('entities').update(updates);

    if (id) {
      query = query.eq('id', id);
    } else if (slug) {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    return Response.json({ entity: data });
  } catch (error) {
    console.error('PATCH entities error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
