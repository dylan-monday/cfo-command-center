/**
 * Partners API Route
 *
 * GET /api/partners - List all partners (optionally filter by role/status)
 * POST /api/partners - Create a new partner
 * PUT /api/partners - Update a partner
 * DELETE /api/partners - Delete a partner
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// ============================================================================
// GET /api/partners - List partners
// ============================================================================

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role');
  const status = url.searchParams.get('status') || 'active';
  const includeFormer = url.searchParams.get('includeFormer') === 'true';

  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('partners')
      .select('*')
      .order('role')
      .order('name');

    // Filter by role if specified
    if (role) {
      query = query.eq('role', role);
    }

    // Filter by status (default: active only)
    if (!includeFormer) {
      query = query.eq('status', 'active');
    }

    const { data: partners, error } = await query;

    if (error) {
      console.error('Failed to fetch partners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch partners' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      partners: partners || [],
      total: partners?.length || 0,
    });
  } catch (error) {
    console.error('Partners API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/partners - Create a partner
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, company, email, phone, entities, notes, status } = body;

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: partner, error } = await supabase
      .from('partners')
      .insert({
        name,
        role,
        company: company || null,
        email: email || null,
        phone: phone || null,
        entities: entities || null,
        notes: notes || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create partner:', error);
      return NextResponse.json(
        { error: 'Failed to create partner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error('Partners POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/partners - Update a partner
// ============================================================================

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, role, company, email, phone, entities, notes, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (company !== undefined) updateData.company = company || null;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (entities !== undefined) updateData.entities = entities || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (status !== undefined) updateData.status = status;

    const { data: partner, error } = await supabase
      .from('partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update partner:', error);
      return NextResponse.json(
        { error: 'Failed to update partner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error('Partners PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/partners - Delete a partner
// ============================================================================

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Partner ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete partner:', error);
      return NextResponse.json(
        { error: 'Failed to delete partner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partners DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
