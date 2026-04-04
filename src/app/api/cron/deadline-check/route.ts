/**
 * Deadline Check Cron Job
 *
 * Runs daily to check for upcoming deadlines and send reminder emails.
 * Vercel cron schedule: 0 9 * * * (9 AM UTC daily)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendDeadlineReminder, sendCriticalAlert } from '@/lib/gmail';

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
  const results = {
    checked: 0,
    reminders: 0,
    critical: 0,
    errors: [] as string[],
  };

  try {
    // Get all open alerts with due dates
    const { data: alerts, error } = await supabase
      .from('proactive_queue')
      .select(`
        id,
        type,
        priority,
        message,
        due_date,
        entity_id,
        entities (name)
      `)
      .eq('status', 'open')
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    results.checked = alerts?.length || 0;

    for (const alert of alerts || []) {
      const dueDate = new Date(alert.due_date);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine if we should send a reminder based on priority and days until due
      let shouldNotify = false;
      let isCritical = false;

      switch (alert.priority) {
        case 'critical':
          // Critical: notify if due within 7 days, treat as critical if within 3 days
          if (daysUntilDue <= 7) {
            shouldNotify = true;
            isCritical = daysUntilDue <= 3;
          }
          break;
        case 'high':
          // High: notify if due within 5 days
          if (daysUntilDue <= 5) {
            shouldNotify = true;
            isCritical = daysUntilDue <= 1;
          }
          break;
        case 'medium':
          // Medium: notify if due within 3 days
          if (daysUntilDue <= 3) {
            shouldNotify = true;
          }
          break;
        case 'low':
        case 'monitor':
          // Low/Monitor: notify if due tomorrow or overdue
          if (daysUntilDue <= 1) {
            shouldNotify = true;
          }
          break;
      }

      // Check if already notified recently (within last 24 hours)
      if (shouldNotify) {
        const { data: recentNotification } = await supabase
          .from('notification_log')
          .select('id')
          .eq('alert_id', alert.id)
          .gte('sent_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentNotification && recentNotification.length > 0) {
          // Already notified recently, skip
          continue;
        }

        // Send notification
        try {
          const entityData = alert.entities as { name: string } | { name: string }[] | null;
          const entityName = Array.isArray(entityData) ? entityData[0]?.name : entityData?.name;

          if (isCritical) {
            const success = await sendCriticalAlert(
              alert.id,
              alert.message,
              entityName
            );
            if (success) results.critical++;
          } else {
            const success = await sendDeadlineReminder(
              alert.id,
              alert.message,
              alert.due_date,
              alert.priority
            );
            if (success) results.reminders++;
          }
        } catch (emailError) {
          results.errors.push(
            `Failed to send reminder for alert ${alert.id}: ${emailError}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Deadline check cron error:', error);
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
