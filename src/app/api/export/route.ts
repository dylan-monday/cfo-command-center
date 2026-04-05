/**
 * CPA Export API Route
 *
 * POST /api/export - Generate CPA export to Google Drive
 * GET /api/export - Get export history/status
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  generateCPAExport,
  exportKnowledgeBase,
  exportStrategies,
  exportActionItems,
} from '@/lib/google-drive';

export const runtime = 'nodejs';

// ============================================================================
// POST /api/export - Generate exports
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taxYear, type, entitySlug, partnerId } = body;

    // Get partner info if provided
    let partner: { name: string; company?: string } | null = null;
    if (partnerId) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from('partners')
        .select('name, company')
        .eq('id', partnerId)
        .single();
      partner = data;
    }

    // Validate tax year
    const year = taxYear || new Date().getFullYear();
    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Invalid tax year' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'knowledge':
        result = await exportKnowledgeBase(year, entitySlug, partner);
        return NextResponse.json({
          success: result.success,
          file: result.fileUrl
            ? { name: 'Knowledge Base', url: result.fileUrl }
            : null,
          error: result.error,
        });

      case 'strategies':
        result = await exportStrategies(year, partner);
        return NextResponse.json({
          success: result.success,
          file: result.fileUrl
            ? { name: 'Tax Strategies', url: result.fileUrl }
            : null,
          error: result.error,
        });

      case 'actions':
        result = await exportActionItems(year, partner);
        return NextResponse.json({
          success: result.success,
          file: result.fileUrl
            ? { name: 'Action Items', url: result.fileUrl }
            : null,
          error: result.error,
        });

      case 'full':
      default:
        // Full CPA export package
        const fullResult = await generateCPAExport(year, partner);
        return NextResponse.json({
          success: fullResult.success,
          files: fullResult.files,
          errors: fullResult.errors,
          taxYear: year,
          partner: partner ? { name: partner.name, company: partner.company } : null,
        });
    }
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Export failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/export - Get export info
// ============================================================================

export async function GET(request: Request) {
  const url = new URL(request.url);
  const taxYear = url.searchParams.get('taxYear');

  // Return available export types
  return NextResponse.json({
    availableExports: [
      {
        type: 'full',
        name: 'Full CPA Package',
        description: 'Complete export including knowledge base, strategies, and action items',
      },
      {
        type: 'knowledge',
        name: 'Knowledge Base',
        description: 'All facts and data points by category',
      },
      {
        type: 'strategies',
        name: 'Tax Strategies',
        description: 'Tax optimization strategies with CPA review flags',
      },
      {
        type: 'actions',
        name: 'Action Items',
        description: 'Open and resolved action items and alerts',
      },
    ],
    defaultTaxYear: taxYear || new Date().getFullYear(),
    driveConfigured: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
  });
}
