/**
 * Tax Strategies API Route
 *
 * GET /api/strategies - List strategies
 * POST /api/strategies - Create new strategy
 * PATCH /api/strategies - Update strategy
 * DELETE /api/strategies - Deprecate strategy
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { StrategyStatus, StrategyImpact } from '@/types';

// ============================================================================
// GET - List Strategies
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entitySlug = searchParams.get('entity');
    const status = searchParams.get('status') as StrategyStatus | null;
    const impact = searchParams.get('impact') as StrategyImpact | null;
    const cpaOnly = searchParams.get('cpaOnly') === 'true';
    const taxYear = searchParams.get('taxYear');
    const includeDeprecated = searchParams.get('includeDeprecated') === 'true';

    const supabase = createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('tax_strategies')
      .select('*, entities!inner(slug, name, color)', { count: 'exact' });

    // Filter by entity
    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single() as { data: { id: string } | null };

      if (entity) {
        query = query.eq('entity_id', entity.id);
      }
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    } else if (!includeDeprecated) {
      query = query.neq('status', 'deprecated');
    }

    // Filter by impact
    if (impact) {
      query = query.eq('impact', impact);
    }

    // Filter by CPA flag
    if (cpaOnly) {
      query = query.eq('cpa_flag', true);
    }

    // Filter by tax year
    if (taxYear) {
      query = query.eq('tax_year', parseInt(taxYear));
    }

    // Order by impact (high first) then status
    const { data, error, count } = await query.order('impact').order('status');

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sort by impact manually
    const impactOrder = ['high', 'medium', 'low'];
    const sorted = data?.sort((a, b) => {
      const aImpact = impactOrder.indexOf(a.impact);
      const bImpact = impactOrder.indexOf(b.impact);
      return aImpact - bImpact;
    });

    // Calculate summary stats
    const stats = {
      total: count || 0,
      byStatus: {
        active: data?.filter((s) => s.status === 'active').length || 0,
        atRisk: data?.filter((s) => s.status === 'at-risk').length || 0,
        review: data?.filter((s) => s.status === 'review').length || 0,
        notStarted: data?.filter((s) => s.status === 'not-started').length || 0,
      },
      totalEstimatedSavings: data?.reduce(
        (sum, s) => sum + (s.estimated_savings || 0),
        0
      ) || 0,
      cpaFlagCount: data?.filter((s) => s.cpa_flag).length || 0,
    };

    return Response.json({
      strategies: sorted,
      stats,
    });
  } catch (error) {
    console.error('GET strategies error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Strategy
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entitySlug,
      name,
      status,
      impact,
      description,
      actionRequired,
      estimatedSavings,
      cpaFlag,
      taxYear,
      metadata,
    }: {
      entitySlug: string;
      name: string;
      status: StrategyStatus;
      impact: StrategyImpact;
      description: string;
      actionRequired?: string;
      estimatedSavings?: number;
      cpaFlag?: boolean;
      taxYear?: number;
      metadata?: Record<string, unknown>;
    } = body;

    // Validate required fields
    if (!entitySlug || !name || !status || !impact || !description) {
      return Response.json(
        { error: 'entitySlug, name, status, impact, and description are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get entity ID
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

    const { data, error } = await supabase
      .from('tax_strategies')
      .insert({
        entity_id: entity.id,
        name,
        status,
        impact,
        description,
        action_required: actionRequired,
        estimated_savings: estimatedSavings,
        cpa_flag: cpaFlag || false,
        tax_year: taxYear,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ strategy: data }, { status: 201 });
  } catch (error) {
    console.error('POST strategies error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Strategy
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      impact,
      description,
      actionRequired,
      estimatedSavings,
      cpaFlag,
      taxYear,
      metadata,
    }: {
      id: string;
      status?: StrategyStatus;
      impact?: StrategyImpact;
      description?: string;
      actionRequired?: string;
      estimatedSavings?: number;
      cpaFlag?: boolean;
      taxYear?: number;
      metadata?: Record<string, unknown>;
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

    if (status !== undefined) updates.status = status;
    if (impact !== undefined) updates.impact = impact;
    if (description !== undefined) updates.description = description;
    if (actionRequired !== undefined) updates.action_required = actionRequired;
    if (estimatedSavings !== undefined) updates.estimated_savings = estimatedSavings;
    if (cpaFlag !== undefined) updates.cpa_flag = cpaFlag;
    if (taxYear !== undefined) updates.tax_year = taxYear;
    if (metadata !== undefined) updates.metadata = metadata;

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tax_strategies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    return Response.json({ strategy: data });
  } catch (error) {
    console.error('PATCH strategies error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Deprecate Strategy
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hardDelete = searchParams.get('hardDelete') === 'true';

    if (!id) {
      return Response.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    if (hardDelete) {
      // Actually delete the record
      const { error } = await supabase
        .from('tax_strategies')
        .delete()
        .eq('id', id);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ message: 'Strategy deleted' });
    }

    // Soft delete - mark as deprecated
    const { data, error } = await supabase
      .from('tax_strategies')
      .update({ status: 'deprecated' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Strategy deprecated',
      strategy: data,
    });
  } catch (error) {
    console.error('DELETE strategies error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
