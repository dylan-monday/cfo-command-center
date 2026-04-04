/**
 * Gmail API Integration
 *
 * Sends notification emails using Gmail API.
 * Used for weekly digests, deadline alerts, and critical notifications.
 */

import { google } from 'googleapis';
import { createServerSupabaseClient } from './supabase';

// ============================================================================
// Configuration
// ============================================================================

const SENDER_EMAIL = process.env.NOTIFICATION_EMAIL || 'dylan@mondayandpartners.com';

/**
 * Get authenticated Gmail client using OAuth2.
 */
function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// ============================================================================
// Email Sending
// ============================================================================

/**
 * Send an email using Gmail API.
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = getGmailClient();

    // Build MIME message
    const boundary = 'boundary_' + Date.now();
    const mimeMessage = [
      `From: CFO Command Center <${SENDER_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      textBody || htmlBody.replace(/<[^>]+>/g, ''),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlBody,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    // Encode to base64url
    const encodedMessage = Buffer.from(mimeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: response.data.id || undefined,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Notification Email Types
// ============================================================================

/**
 * Send a deadline reminder email.
 */
export async function sendDeadlineReminder(
  alertId: string,
  message: string,
  dueDate: string,
  priority: string
): Promise<boolean> {
  const subject = `[${priority.toUpperCase()}] Deadline Reminder: ${message.slice(0, 50)}...`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1A1A1F; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A8A7D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #FFFFFF; padding: 20px; border: 1px solid #E5E5E0; border-top: none; border-radius: 0 0 8px 8px; }
    .priority-critical { background: #CC3333; }
    .priority-high { background: #D4930D; }
    .due-date { font-size: 24px; font-weight: bold; color: #1A8A7D; margin: 16px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header ${priority === 'critical' ? 'priority-critical' : priority === 'high' ? 'priority-high' : ''}">
      <h1 style="margin: 0;">Deadline Reminder</h1>
    </div>
    <div class="content">
      <p><strong>${message}</strong></p>
      <div class="due-date">Due: ${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <p>This is a ${priority} priority item that requires your attention.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cfo.mondayandpartners.com'}" style="color: #1A8A7D;">Open CFO Command Center</a></p>
    </div>
    <div class="footer">
      <p>Sent by CFO Command Center</p>
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail(SENDER_EMAIL, subject, htmlBody);

  // Log notification
  if (result.success) {
    await logNotification(alertId, 'email', subject, message.slice(0, 100));
  }

  return result.success;
}

/**
 * Send a weekly digest email.
 */
export async function sendWeeklyDigest(
  stats: {
    openAlerts: number;
    criticalAlerts: number;
    documentsProcessed: number;
    newFacts: number;
    upcomingDeadlines: Array<{ message: string; dueDate: string }>;
    strategyUpdates: Array<{ name: string; status: string }>;
  }
): Promise<boolean> {
  const subject = `CFO Weekly Digest - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1A1A1F; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1A8A7D; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #FFFFFF; padding: 20px; border: 1px solid #E5E5E0; border-top: none; border-radius: 0 0 8px 8px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
    .stat-box { background: #FAFAF9; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 32px; font-weight: bold; color: #1A8A7D; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .alert-critical { color: #CC3333; }
    .section { margin: 24px 0; }
    .section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #E5E5E0; padding-bottom: 8px; }
    .deadline-item { padding: 8px 0; border-bottom: 1px solid #E5E5E0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Weekly Digest</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
    <div class="content">
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-number">${stats.openAlerts}</div>
          <div class="stat-label">Open Items</div>
        </div>
        <div class="stat-box">
          <div class="stat-number ${stats.criticalAlerts > 0 ? 'alert-critical' : ''}">${stats.criticalAlerts}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${stats.documentsProcessed}</div>
          <div class="stat-label">Docs Processed</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${stats.newFacts}</div>
          <div class="stat-label">New Facts</div>
        </div>
      </div>

      ${stats.upcomingDeadlines.length > 0 ? `
      <div class="section">
        <div class="section-title">Upcoming Deadlines</div>
        ${stats.upcomingDeadlines.map((d) => `
          <div class="deadline-item">
            <strong>${new Date(d.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> - ${d.message}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${stats.strategyUpdates.length > 0 ? `
      <div class="section">
        <div class="section-title">Strategy Updates</div>
        ${stats.strategyUpdates.map((s) => `
          <div class="deadline-item">
            <strong>${s.name}</strong> - Status: ${s.status}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cfo.mondayandpartners.com'}" style="color: #1A8A7D; font-weight: bold;">Open CFO Command Center</a></p>
    </div>
    <div class="footer">
      <p>Sent by CFO Command Center</p>
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail(SENDER_EMAIL, subject, htmlBody);
  return result.success;
}

/**
 * Send a critical alert email immediately.
 */
export async function sendCriticalAlert(
  alertId: string,
  message: string,
  entityName?: string
): Promise<boolean> {
  const subject = `[CRITICAL] ${entityName ? `${entityName}: ` : ''}${message.slice(0, 60)}...`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1A1A1F; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #CC3333; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #FFFFFF; padding: 20px; border: 1px solid #E5E5E0; border-top: none; border-radius: 0 0 8px 8px; }
    .alert-box { background: #FFF5F5; border: 2px solid #CC3333; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Critical Alert</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p style="margin: 0; font-size: 18px;"><strong>${message}</strong></p>
      </div>
      ${entityName ? `<p>Related to: <strong>${entityName}</strong></p>` : ''}
      <p>This requires immediate attention.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cfo.mondayandpartners.com'}" style="color: #1A8A7D; font-weight: bold;">Open CFO Command Center</a></p>
    </div>
    <div class="footer">
      <p>Sent by CFO Command Center</p>
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail(SENDER_EMAIL, subject, htmlBody);

  // Log notification
  if (result.success) {
    await logNotification(alertId, 'email', subject, message.slice(0, 100));
  }

  return result.success;
}

// ============================================================================
// Notification Logging
// ============================================================================

/**
 * Log a sent notification to the database.
 */
async function logNotification(
  alertId: string,
  channel: 'email' | 'in-app' | 'push',
  subject: string,
  bodyPreview: string
): Promise<void> {
  const supabase = createServerSupabaseClient();

  await supabase.from('notification_log').insert({
    alert_id: alertId,
    channel,
    subject,
    body_preview: bodyPreview,
  });
}

/**
 * Mark a notification as opened.
 */
export async function markNotificationOpened(notificationId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('notification_log')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}

/**
 * Mark a notification as dismissed.
 */
export async function markNotificationDismissed(notificationId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('notification_log')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);

  return !error;
}
