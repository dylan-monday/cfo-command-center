/**
 * Google Drive Integration
 *
 * Exports CPA-ready documents to Google Drive.
 * Used for quarterly summaries, tax documents, and fact exports.
 */

import { google } from 'googleapis';
import { createServerSupabaseClient } from './supabase';

// ============================================================================
// Configuration
// ============================================================================

const CPA_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

/**
 * Get authenticated Drive client using OAuth2.
 */
function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Create or find a folder in Google Drive.
 */
async function ensureFolder(
  name: string,
  parentId?: string
): Promise<string> {
  const drive = getDriveClient();

  // Check if folder exists
  const query = parentId
    ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const { data: existing } = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  if (existing.files && existing.files.length > 0) {
    return existing.files[0].id!;
  }

  // Create folder
  const { data: folder } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : CPA_FOLDER_ID ? [CPA_FOLDER_ID] : undefined,
    },
    fields: 'id',
  });

  return folder.id!;
}

/**
 * Upload a file to Google Drive.
 */
async function uploadFile(
  name: string,
  content: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();

  // Check if file exists (to update instead of create duplicate)
  const { data: existing } = await drive.files.list({
    q: `name='${name}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });

  let fileId: string;

  if (existing.files && existing.files.length > 0) {
    // Update existing file
    fileId = existing.files[0].id!;
    await drive.files.update({
      fileId,
      media: {
        mimeType,
        body: content,
      },
    });
  } else {
    // Create new file
    const { data: file } = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: content,
      },
      fields: 'id',
    });
    fileId = file.id!;
  }

  // Get web view link
  const { data: fileInfo } = await drive.files.get({
    fileId,
    fields: 'webViewLink',
  });

  return {
    id: fileId,
    webViewLink: fileInfo.webViewLink || '',
  };
}

// ============================================================================
// Types
// ============================================================================

interface PartnerInfo {
  name: string;
  company?: string;
}

// ============================================================================
// Cover Page Helper
// ============================================================================

/**
 * Generate the standard cover page header for exports.
 */
function generateCoverPage(
  title: string,
  taxYear: number,
  partner?: PartnerInfo | null
): string {
  let coverPage = `# DiBona Financial\n\n`;
  coverPage += `## Tax Year ${taxYear} — ${title}\n\n`;

  if (partner) {
    coverPage += `**Prepared for:** ${partner.name}`;
    if (partner.company) {
      coverPage += `, ${partner.company}`;
    }
    coverPage += `\n`;
  }

  coverPage += `**Generated:** ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}\n\n`;
  coverPage += `---\n\n`;

  return coverPage;
}

// ============================================================================
// CPA Export Functions
// ============================================================================

/**
 * Export knowledge base facts for CPA review.
 */
export async function exportKnowledgeBase(
  taxYear: number,
  entitySlug?: string,
  partner?: PartnerInfo | null
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('knowledge_base')
      .select(`
        id,
        category,
        key,
        value,
        source,
        confidence,
        created_at,
        verified_at,
        entity_id,
        entities (name, slug)
      `)
      .neq('confidence', 'stale')
      .order('category')
      .order('key');

    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single();

      if (entity) {
        query = query.eq('entity_id', entity.id);
      }
    }

    const { data: facts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch facts: ${error.message}`);
    }

    // Format as markdown with cover page
    let markdown = generateCoverPage('Knowledge Base', taxYear, partner);

    if (entitySlug) {
      markdown += `**Entity Filter:** ${entitySlug}\n\n`;
    }
    markdown += `**Total Facts:** ${facts?.length || 0}\n\n`;

    // Group by category
    const byCategory: Record<string, typeof facts> = {};
    for (const fact of facts || []) {
      const cat = fact.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(fact);
    }

    for (const [category, categoryFacts] of Object.entries(byCategory)) {
      markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

      for (const fact of categoryFacts || []) {
        const entityData = fact.entities as { name: string; slug: string } | { name: string; slug: string }[] | null;
        const entityName = Array.isArray(entityData) ? entityData[0]?.name : entityData?.name;
        markdown += `### ${fact.key}\n`;
        markdown += `- **Value:** ${fact.value}\n`;
        markdown += `- **Confidence:** ${fact.confidence}\n`;
        markdown += `- **Source:** ${fact.source}\n`;
        if (entityName) {
          markdown += `- **Entity:** ${entityName}\n`;
        }
        if (fact.verified_at) {
          markdown += `- **Last Verified:** ${new Date(fact.verified_at).toLocaleDateString()}\n`;
        }
        markdown += `\n`;
      }
    }

    // Upload to Drive
    const yearFolder = await ensureFolder(`Tax Year ${taxYear}`, CPA_FOLDER_ID);
    const filename = entitySlug
      ? `knowledge-base-${entitySlug}-${taxYear}.md`
      : `knowledge-base-all-${taxYear}.md`;

    const { webViewLink } = await uploadFile(
      filename,
      markdown,
      'text/markdown',
      yearFolder
    );

    return { success: true, fileUrl: webViewLink };
  } catch (error) {
    console.error('Export knowledge base error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export tax strategies for CPA review.
 */
export async function exportStrategies(
  taxYear: number,
  partner?: PartnerInfo | null
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: strategies, error } = await supabase
      .from('tax_strategies')
      .select(`
        id,
        name,
        status,
        impact,
        description,
        action_required,
        estimated_savings,
        cpa_flag,
        tax_year,
        entities (name, slug)
      `)
      .order('cpa_flag', { ascending: false })
      .order('impact')
      .order('status');

    if (error) {
      throw new Error(`Failed to fetch strategies: ${error.message}`);
    }

    // Format as markdown with cover page
    let markdown = generateCoverPage('Tax Strategies', taxYear, partner);
    markdown += `**Total Strategies:** ${strategies?.length || 0}\n\n`;

    // Summary stats
    const cpaItems = strategies?.filter((s) => s.cpa_flag) || [];
    const totalSavings = strategies?.reduce(
      (sum, s) => sum + (s.estimated_savings || 0),
      0
    ) || 0;

    markdown += `## Summary\n\n`;
    markdown += `- **CPA Review Items:** ${cpaItems.length}\n`;
    markdown += `- **Total Estimated Savings:** $${totalSavings.toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    // CPA Flag items first
    if (cpaItems.length > 0) {
      markdown += `## Items Requiring CPA Review\n\n`;
      for (const strategy of cpaItems) {
        const entityData = strategy.entities as { name: string } | { name: string }[] | null;
        const entityName = Array.isArray(entityData) ? entityData[0]?.name : entityData?.name;
        markdown += `### ${strategy.name}\n`;
        markdown += `- **Status:** ${strategy.status}\n`;
        markdown += `- **Impact:** ${strategy.impact}\n`;
        if (entityName) {
          markdown += `- **Entity:** ${entityName}\n`;
        }
        if (strategy.estimated_savings) {
          markdown += `- **Est. Savings:** $${strategy.estimated_savings.toLocaleString()}\n`;
        }
        markdown += `- **Description:** ${strategy.description}\n`;
        if (strategy.action_required) {
          markdown += `- **Action Required:** ${strategy.action_required}\n`;
        }
        markdown += `\n`;
      }
    }

    // All other strategies
    markdown += `## All Strategies\n\n`;
    for (const strategy of strategies || []) {
      if (strategy.cpa_flag) continue; // Already listed above
      const entityData = strategy.entities as { name: string } | { name: string }[] | null;
      const entityName = Array.isArray(entityData) ? entityData[0]?.name : entityData?.name;
      markdown += `### ${strategy.name}\n`;
      markdown += `- **Status:** ${strategy.status}\n`;
      markdown += `- **Impact:** ${strategy.impact}\n`;
      if (entityName) {
        markdown += `- **Entity:** ${entityName}\n`;
      }
      if (strategy.estimated_savings) {
        markdown += `- **Est. Savings:** $${strategy.estimated_savings.toLocaleString()}\n`;
      }
      markdown += `- **Description:** ${strategy.description}\n`;
      markdown += `\n`;
    }

    // Upload to Drive
    const yearFolder = await ensureFolder(`Tax Year ${taxYear}`, CPA_FOLDER_ID);
    const { webViewLink } = await uploadFile(
      `tax-strategies-${taxYear}.md`,
      markdown,
      'text/markdown',
      yearFolder
    );

    return { success: true, fileUrl: webViewLink };
  } catch (error) {
    console.error('Export strategies error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export action items/alerts for CPA review.
 */
export async function exportActionItems(
  taxYear: number,
  partner?: PartnerInfo | null
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: alerts, error } = await supabase
      .from('proactive_queue')
      .select(`
        id,
        type,
        priority,
        message,
        due_date,
        status,
        resolved_note,
        created_at,
        entities (name, slug)
      `)
      .order('priority')
      .order('due_date');

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    // Format as markdown with cover page
    let markdown = generateCoverPage('Action Items', taxYear, partner);
    markdown += `**Total Items:** ${alerts?.length || 0}\n\n`;

    const openItems = alerts?.filter((a) => a.status === 'open') || [];
    const resolvedItems = alerts?.filter((a) => a.status === 'resolved') || [];

    markdown += `## Summary\n\n`;
    markdown += `- **Open Items:** ${openItems.length}\n`;
    markdown += `- **Resolved Items:** ${resolvedItems.length}\n\n`;
    markdown += `---\n\n`;

    // Open items by priority
    const priorityOrder = ['critical', 'high', 'medium', 'low', 'monitor'];
    for (const priority of priorityOrder) {
      const items = openItems.filter((a) => a.priority === priority);
      if (items.length === 0) continue;

      markdown += `## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority (Open)\n\n`;
      for (const item of items) {
        const entityData = item.entities as { name: string } | { name: string }[] | null;
        const entityName = Array.isArray(entityData) ? entityData[0]?.name : entityData?.name;
        markdown += `### ${item.message.slice(0, 60)}...\n`;
        markdown += `- **Type:** ${item.type}\n`;
        if (entityName) {
          markdown += `- **Entity:** ${entityName}\n`;
        }
        if (item.due_date) {
          markdown += `- **Due Date:** ${new Date(item.due_date).toLocaleDateString()}\n`;
        }
        markdown += `- **Full Message:** ${item.message}\n\n`;
      }
    }

    // Upload to Drive
    const yearFolder = await ensureFolder(`Tax Year ${taxYear}`, CPA_FOLDER_ID);
    const { webViewLink } = await uploadFile(
      `action-items-${taxYear}.md`,
      markdown,
      'text/markdown',
      yearFolder
    );

    return { success: true, fileUrl: webViewLink };
  } catch (error) {
    console.error('Export action items error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate full CPA export package.
 */
export async function generateCPAExport(
  taxYear: number,
  partner?: PartnerInfo | null
): Promise<{
  success: boolean;
  files: { name: string; url: string }[];
  errors: string[];
}> {
  const files: { name: string; url: string }[] = [];
  const errors: string[] = [];

  // Export knowledge base
  const kbResult = await exportKnowledgeBase(taxYear, undefined, partner);
  if (kbResult.success && kbResult.fileUrl) {
    files.push({ name: 'Knowledge Base', url: kbResult.fileUrl });
  } else if (kbResult.error) {
    errors.push(`Knowledge Base: ${kbResult.error}`);
  }

  // Export strategies
  const stratResult = await exportStrategies(taxYear, partner);
  if (stratResult.success && stratResult.fileUrl) {
    files.push({ name: 'Tax Strategies', url: stratResult.fileUrl });
  } else if (stratResult.error) {
    errors.push(`Strategies: ${stratResult.error}`);
  }

  // Export action items
  const actionsResult = await exportActionItems(taxYear, partner);
  if (actionsResult.success && actionsResult.fileUrl) {
    files.push({ name: 'Action Items', url: actionsResult.fileUrl });
  } else if (actionsResult.error) {
    errors.push(`Action Items: ${actionsResult.error}`);
  }

  return {
    success: errors.length === 0,
    files,
    errors,
  };
}
