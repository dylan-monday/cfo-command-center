/**
 * Staleness Check Cron Job
 *
 * Runs daily to identify potentially stale knowledge base facts
 * and creates alerts for review.
 * Vercel cron schedule: 0 6 * * * (6 AM UTC daily)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// Categories and keys that should be checked for staleness
const STALENESS_CONFIG: Record<string, { maxAgeDays: number; keys?: string[] }> = {
  // Financial facts should be reviewed quarterly
  financial: { maxAgeDays: 90 },
  // Tax facts should be reviewed annually
  tax: { maxAgeDays: 365 },
  // Property facts like balances should be reviewed monthly
  property: {
    maxAgeDays: 30,
    keys: ['mortgage_balance', 'insurance', 'monthly_rent', 'pm_fee'],
  },
  // Personal facts can be longer
  personal: { maxAgeDays: 365 },
  // Strategy facts should be reviewed quarterly
  strategy: { maxAgeDays: 90 },
};

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const results = {
    checked: 0,
    staleFound: 0,
    alertsCreated: 0,
    errors: [] as string[],
  };

  try {
    // Check each category for stale facts
    for (const [category, config] of Object.entries(STALENESS_CONFIG)) {
      const cutoffDate = new Date(
        now.getTime() - config.maxAgeDays * 24 * 60 * 60 * 1000
      );

      // Build query for facts that haven't been verified since cutoff
      let query = supabase
        .from('knowledge_base')
        .select(`
          id,
          entity_id,
          category,
          key,
          value,
          confidence,
          created_at,
          verified_at,
          entities (name, slug)
        `)
        .eq('category', category)
        .neq('confidence', 'stale');

      // Filter by specific keys if configured
      if (config.keys) {
        query = query.in('key', config.keys);
      }

      // Find facts that are older than cutoff and haven't been verified recently
      const { data: facts, error } = await query;

      if (error) {
        results.errors.push(`Failed to query ${category}: ${error.message}`);
        continue;
      }

      results.checked += facts?.length || 0;

      for (const fact of facts || []) {
        // Check if fact is stale (not verified since cutoff)
        const lastVerified = fact.verified_at
          ? new Date(fact.verified_at)
          : new Date(fact.created_at);

        if (lastVerified < cutoffDate) {
          results.staleFound++;

          // Check if we already have an alert for this fact
          const { data: existingAlert } = await supabase
            .from('proactive_queue')
            .select('id')
            .eq('type', 'question')
            .like('message', `%${fact.key}%`)
            .eq('status', 'open')
            .limit(1);

          if (!existingAlert || existingAlert.length === 0) {
            // Create an alert to review this fact
            const entityData = fact.entities as { name: string } | { name: string }[] | null;
            const entityName = Array.isArray(entityData) ? entityData[0]?.name : entityData?.name;
            const { error: insertError } = await supabase
              .from('proactive_queue')
              .insert({
                type: 'question',
                priority: 'low',
                entity_id: fact.entity_id,
                message: `Review stale fact: ${fact.key} = "${fact.value}"${entityName ? ` (${entityName})` : ''} - last verified ${Math.floor((now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24))} days ago`,
                status: 'open',
              });

            if (insertError) {
              results.errors.push(
                `Failed to create alert for fact ${fact.id}: ${insertError.message}`
              );
            } else {
              results.alertsCreated++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Staleness check cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}
