/**
 * Alerts API Route (Proactive Queue)
 *
 * GET /api/alerts - List alerts
 * POST /api/alerts - Create new alert
 * PATCH /api/alerts - Update alert status
 * DELETE /api/alerts - Delete alert
 */

import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { AlertType, AlertPriority, AlertStatus } from '@/types';

// Type for alert records from database
interface AlertRecord {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  entity_id: string | null;
  message: string;
  due_date: string | null;
  resolved_note: string | null;
  created_at: string;
  entities?: { slug: string; name: string; color: string } | null;
}

// ============================================================================
// GET - List Alerts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entitySlug = searchParams.get('entity');
    const status = searchParams.get('status') as AlertStatus | null;
    const priority = searchParams.get('priority') as AlertPriority | null;
    const type = searchParams.get('type') as AlertType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('proactive_queue')
      .select('*, entities!left(slug, name, color)', { count: 'exact' });

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

    // Filter by status (default to open)
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'open');
    }

    // Filter by priority
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Filter by type
    if (type) {
      query = query.eq('type', type);
    }

    // Order by priority (critical first) then due_date
    const priorityOrder = ['critical', 'high', 'medium', 'low', 'monitor'];
    const { data, error, count } = await query
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1) as { data: AlertRecord[] | null; error: Error | null; count: number | null };

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sort by priority manually (since Postgres can't easily sort by custom order)
    const sorted = data?.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.priority);
      const bPriority = priorityOrder.indexOf(b.priority);
      if (aPriority !== bPriority) return aPriority - bPriority;
      // Then by due_date
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

    return Response.json({
      alerts: sorted,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET alerts error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Alert
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      priority,
      entitySlug,
      message,
      dueDate,
    }: {
      type: AlertType;
      priority: AlertPriority;
      entitySlug?: string;
      message: string;
      dueDate?: string;
    } = body;

    // Validate required fields
    if (!type || !priority || !message) {
      return Response.json(
        { error: 'type, priority, and message are required' },
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

    // Insert alert
    const { data, error } = await supabase
      .from('proactive_queue')
      .insert({
        type,
        priority,
        entity_id: entityId,
        message,
        due_date: dueDate,
        status: 'open',
      } as Record<string, unknown>)
      .select()
      .single() as { data: AlertRecord | null; error: Error | null };

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ alert: data }, { status: 201 });
  } catch (error) {
    console.error('POST alerts error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Alert Status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      priority,
      message,
      dueDate,
      resolvedNote,
    }: {
      id: string;
      status?: AlertStatus;
      priority?: AlertPriority;
      message?: string;
      dueDate?: string;
      resolvedNote?: string;
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

    if (status !== undefined) {
      updates.status = status;
    }

    if (priority !== undefined) {
      updates.priority = priority;
    }

    if (message !== undefined) {
      updates.message = message;
    }

    if (dueDate !== undefined) {
      updates.due_date = dueDate;
    }

    if (resolvedNote !== undefined) {
      updates.resolved_note = resolvedNote;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('proactive_queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return Response.json({ alert: data });
  } catch (error) {
    console.error('PATCH alerts error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Alert
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

    const { error } = await supabase
      .from('proactive_queue')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('DELETE alerts error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
