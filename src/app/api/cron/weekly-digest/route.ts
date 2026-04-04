/**
 * Weekly Digest Cron Job
 *
 * Runs every Monday at 8 AM to send a weekly summary email.
 * Vercel cron schedule: 0 8 * * 1 (8 AM UTC every Monday)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendWeeklyDigest } from '@/lib/gmail';

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

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  try {
    // Get open alerts count
    const { count: openAlerts } = await supabase
      .from('proactive_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get critical alerts count
    const { count: criticalAlerts } = await supabase
      .from('proactive_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .eq('priority', 'critical');

    // Get documents processed this week
    const { count: documentsProcessed } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    // Get new facts added this week
    const { count: newFacts } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    // Get upcoming deadlines (next 2 weeks)
    const { data: deadlines } = await supabase
      .from('proactive_queue')
      .select('message, due_date')
      .eq('status', 'open')
      .not('due_date', 'is', null)
      .gte('due_date', now.toISOString())
      .lte('due_date', twoWeeksFromNow.toISOString())
      .order('due_date', { ascending: true })
      .limit(10);

    // Get strategy status changes this week
    const { data: strategies } = await supabase
      .from('tax_strategies')
      .select('name, status')
      .gte('updated_at', oneWeekAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(5);

    // Build digest stats
    const stats = {
      openAlerts: openAlerts || 0,
      criticalAlerts: criticalAlerts || 0,
      documentsProcessed: documentsProcessed || 0,
      newFacts: newFacts || 0,
      upcomingDeadlines: (deadlines || []).map((d) => ({
        message: d.message,
        dueDate: d.due_date,
      })),
      strategyUpdates: (strategies || []).map((s) => ({
        name: s.name,
        status: s.status,
      })),
    };

    // Send digest email
    const success = await sendWeeklyDigest(stats);

    return NextResponse.json({
      success,
      timestamp: now.toISOString(),
      stats,
    });
  } catch (error) {
    console.error('Weekly digest cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
