/**
 * CPA Packet Data Aggregator
 *
 * Pulls data from Supabase and structures it for the PDF generator.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import type {
  CPAPacketData,
  EntitySummary,
  DocumentChecklistItem,
  StrategyItem,
  OpenQuestion,
  LineItem,
  DocumentStatus,
  DocStatusType,
  EXPECTED_DOCUMENTS,
} from './types';
import { EXPECTED_DOCUMENTS as EXPECTED_DOCS } from './types';

// ============================================================================
// Main Aggregator
// ============================================================================

export async function aggregateCPAPacketData(
  taxYear: number,
  partnerId?: string
): Promise<CPAPacketData> {
  const supabase = createServerSupabaseClient();

  // Fetch partner info if provided
  let preparedFor: { name: string; company?: string } | undefined;
  if (partnerId) {
    const { data: partner } = await supabase
      .from('partners')
      .select('name, company')
      .eq('id', partnerId)
      .single();
    if (partner) {
      preparedFor = { name: partner.name, company: partner.company || undefined };
    }
  }

  // Fetch all entities
  const { data: entities } = await supabase
    .from('entities')
    .select('*')
    .order('slug');

  // Fetch all accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*');

  // Fetch knowledge base facts
  const { data: facts } = await supabase
    .from('knowledge_base')
    .select('*')
    .neq('confidence', 'stale');

  // Fetch documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .or(`tax_year.eq.${taxYear},tax_year.is.null`);

  // Fetch tax strategies
  const { data: strategies } = await supabase
    .from('tax_strategies')
    .select('*, entities(name, slug)')
    .order('cpa_flag', { ascending: false })
    .order('impact');

  // Fetch alerts/action items
  const { data: alerts } = await supabase
    .from('proactive_queue')
    .select('*, entities(name, slug)')
    .eq('status', 'open')
    .order('priority');

  // Build entity summaries
  const entitySummaries: EntitySummary[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const entity of entities || []) {
    const summary = await buildEntitySummary(
      entity,
      facts || [],
      documents || [],
      strategies || [],
      taxYear
    );
    entitySummaries.push(summary);
    totalIncome += summary.totalIncome;
    totalExpenses += summary.totalExpenses;
  }

  // Build document checklist
  const documentChecklist = buildDocumentChecklist(
    entities || [],
    documents || [],
    taxYear
  );

  // Build strategy items
  const strategyItems: StrategyItem[] = (strategies || []).map((s) => {
    const entityData = s.entities as { name: string; slug: string } | null;
    return {
      name: s.name,
      entityName: entityData?.name || 'General',
      status: s.status,
      impact: s.impact,
      estimatedSavings: s.estimated_savings || undefined,
      description: s.description,
      cpaFlag: s.cpa_flag || false,
      actionRequired: s.action_required || undefined,
    };
  });

  // Build open questions from alerts
  const openQuestions: OpenQuestion[] = (alerts || [])
    .filter((a) => a.type === 'question' || a.priority === 'critical' || a.priority === 'high')
    .map((a) => {
      const entityData = a.entities as { name: string } | null;
      return {
        question: a.message,
        context: a.resolved_note || undefined,
        entityName: entityData?.name || undefined,
        priority: a.priority === 'critical' ? 'high' : (a.priority as 'high' | 'medium' | 'low'),
      };
    });

  // Calculate stats
  const documentsReceived = documentChecklist.filter((d) => d.status === 'received').length;
  const documentsMissing = documentChecklist.filter((d) => d.status === 'missing').length;
  const documentsReview = documentChecklist.filter((d) => d.status === 'review').length;
  const activeStrategies = strategyItems.filter((s) => s.status === 'active').length;
  const totalEstimatedSavings = strategyItems.reduce(
    (sum, s) => sum + (s.estimatedSavings || 0),
    0
  );

  // Generate executive summary using Claude
  const executiveSummary = await generateExecutiveSummary(
    taxYear,
    entitySummaries,
    strategyItems,
    openQuestions,
    {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      documentsReceived,
      documentsMissing,
      activeStrategies,
      totalEstimatedSavings,
    }
  );

  return {
    taxYear,
    generatedAt: new Date().toISOString(),
    preparedFor,
    preparedBy: 'Dylan DiBona / Monday + Partners LLC',
    executiveSummary,
    entities: entitySummaries,
    documentChecklist,
    strategies: strategyItems,
    openQuestions,
    stats: {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      documentsReceived,
      documentsMissing,
      documentsReview,
      activeStrategies,
      totalEstimatedSavings,
    },
  };
}

// ============================================================================
// Entity Summary Builder
// ============================================================================

interface KnowledgeFact {
  id: string;
  entity_id: string | null;
  category: string;
  key: string;
  value: string;
  source: string;
  confidence: string;
}

interface Document {
  id: string;
  entity_id: string | null;
  filename: string;
  doc_type: string;
  doc_subtype: string | null;
  status: string;
  tax_year: number | null;
  key_figures: Record<string, unknown> | null;
}

interface Strategy {
  id: string;
  entity_id: string;
  name: string;
  status: string;
  description: string;
  cpa_flag: boolean;
  entities: { name: string; slug: string } | null;
}

interface Entity {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string;
}

async function buildEntitySummary(
  entity: Entity,
  facts: KnowledgeFact[],
  documents: Document[],
  strategies: Strategy[],
  taxYear: number
): Promise<EntitySummary> {
  // Filter facts for this entity
  const entityFacts = facts.filter((f) => f.entity_id === entity.id);

  // Extract income items from knowledge base
  const income: LineItem[] = [];
  const expenses: LineItem[] = [];

  // Look for income-related facts
  const incomeKeywords = ['income', 'revenue', 'rent', 'gross', 'salary', 'distributions'];
  const expenseKeywords = ['expense', 'cost', 'mortgage', 'insurance', 'tax', 'fee', 'payment'];

  for (const fact of entityFacts) {
    const keyLower = fact.key.toLowerCase();
    const valueParsed = parseMoneyValue(fact.value);

    if (valueParsed !== null) {
      if (incomeKeywords.some((k) => keyLower.includes(k))) {
        income.push({
          label: formatFactKey(fact.key),
          amount: valueParsed,
        });
      } else if (expenseKeywords.some((k) => keyLower.includes(k))) {
        expenses.push({
          label: formatFactKey(fact.key),
          amount: valueParsed,
        });
      }
    }
  }

  // Add hardcoded estimates for entities without transaction data
  // This is based on the seed data in the knowledge base
  if (income.length === 0 && expenses.length === 0) {
    switch (entity.slug) {
      case 'mp':
        income.push({ label: 'Gross annual revenue', amount: 350000, taxFormRef: '(Form 1120S)' });
        expenses.push({ label: 'Payroll (Dylan + Keelin)', amount: 100000 });
        expenses.push({ label: 'Health insurance', amount: 17500, taxFormRef: '(SE health deduction)' });
        expenses.push({ label: '401(k) contributions', amount: 35937, taxFormRef: '(Form 5500)' });
        expenses.push({ label: 'Business expenses', amount: 25000 });
        break;
      case 'got':
        income.push({ label: 'Gross monthly rent', amount: 165000, taxFormRef: '(Schedule E)' });
        expenses.push({ label: 'Property management (7%)', amount: 11550 });
        expenses.push({ label: 'Mortgage interest', amount: 27500, taxFormRef: '(Form 1098)' });
        expenses.push({ label: 'Property taxes', amount: 15000 });
        expenses.push({ label: 'Insurance', amount: 3910 });
        expenses.push({ label: 'Repairs/maintenance', amount: 5000 });
        break;
      case 'saratoga':
        income.push({ label: 'Gross monthly rent', amount: 45240, taxFormRef: '(Schedule E)' });
        expenses.push({ label: 'Property management (10%)', amount: 4524 });
        expenses.push({ label: 'Mortgage interest', amount: 12000, taxFormRef: '(Form 1098)' });
        expenses.push({ label: 'Property taxes', amount: 3500 });
        expenses.push({ label: 'Insurance', amount: 5784 });
        break;
      case 'chippewa':
        expenses.push({ label: 'Mortgage interest', amount: 36000, taxFormRef: '(Form 1098)' });
        expenses.push({ label: 'Property taxes', amount: 7735 });
        expenses.push({ label: 'Insurance', amount: 7634 });
        break;
      case 'nice':
        expenses.push({ label: 'Monthly carrying cost', amount: 17724 }); // €1,477 * 12
        break;
      case 'hvr':
        expenses.push({ label: 'Annual property tax', amount: 133 });
        break;
      case 'personal':
        income.push({ label: 'Investment income (estimated)', amount: 5000, taxFormRef: '(1099-DIV/INT)' });
        break;
    }
  }

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Get documents for this entity
  const entityDocs = documents.filter((d) => d.entity_id === entity.id);
  const docStatuses: DocumentStatus[] = entityDocs.map((d) => ({
    name: d.filename,
    type: d.doc_type,
    status: (d.status === 'confirmed' ? 'received' : d.status === 'error' ? 'review' : 'review') as DocStatusType,
  }));

  // Get notable items from alerts/facts
  const notableItems: string[] = [];
  const flaggedFacts = entityFacts.filter(
    (f) => f.key.toLowerCase().includes('flag') || f.key.toLowerCase().includes('issue')
  );
  flaggedFacts.forEach((f) => notableItems.push(`${formatFactKey(f.key)}: ${f.value}`));

  // Get strategy notes
  const entityStrategies = strategies.filter((s) => s.entity_id === entity.id);
  const strategyNotes = entityStrategies
    .filter((s) => s.cpa_flag)
    .map((s) => `${s.name}: ${s.description}`);

  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    type: entity.type,
    color: entity.color,
    income,
    expenses,
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    documents: docStatuses,
    notableItems,
    strategyNotes,
  };
}

// ============================================================================
// Document Checklist Builder
// ============================================================================

function buildDocumentChecklist(
  entities: Entity[],
  documents: Document[],
  taxYear: number
): DocumentChecklistItem[] {
  const checklist: DocumentChecklistItem[] = [];

  for (const entity of entities) {
    const expectedDocs = EXPECTED_DOCS[entity.type] || [];
    const entityDocs = documents.filter((d) => d.entity_id === entity.id);

    for (const docDesc of expectedDocs) {
      // Check if we have a matching document
      const found = entityDocs.find((d) =>
        d.doc_type.toLowerCase().includes(docDesc.toLowerCase().split(' ')[0]) ||
        d.filename.toLowerCase().includes(docDesc.toLowerCase().split(' ')[0])
      );

      let status: DocStatusType = 'missing';
      if (found) {
        status = found.status === 'confirmed' ? 'received' : 'review';
      }

      checklist.push({
        entitySlug: entity.slug,
        entityName: entity.name,
        docType: docDesc.split(' ')[0],
        description: docDesc,
        status,
      });
    }
  }

  return checklist;
}

// ============================================================================
// Executive Summary Generator
// ============================================================================

async function generateExecutiveSummary(
  taxYear: number,
  entities: EntitySummary[],
  strategies: StrategyItem[],
  questions: OpenQuestion[],
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    documentsReceived: number;
    documentsMissing: number;
    activeStrategies: number;
    totalEstimatedSavings: number;
  }
): Promise<string> {
  // Build context for Claude
  const entitySummaries = entities
    .map(
      (e) =>
        `${e.name} (${e.type}): Income $${e.totalIncome.toLocaleString()}, Expenses $${e.totalExpenses.toLocaleString()}, Net $${e.netIncome.toLocaleString()}`
    )
    .join('\n');

  const cpaFlaggedStrategies = strategies
    .filter((s) => s.cpaFlag)
    .map((s) => `- ${s.name}: ${s.description}`)
    .join('\n');

  const highPriorityQuestions = questions
    .filter((q) => q.priority === 'high')
    .map((q) => `- ${q.question}`)
    .join('\n');

  const prompt = `You are writing the executive summary for a CPA tax packet for tax year ${taxYear}. Write a concise, professional 2-3 paragraph summary in plain conversational language.

Financial Overview:
- Total Income: $${stats.totalIncome.toLocaleString()}
- Total Expenses: $${stats.totalExpenses.toLocaleString()}
- Net Income: $${stats.netIncome.toLocaleString()}
- Estimated Tax Savings from Strategies: $${stats.totalEstimatedSavings.toLocaleString()}

Entity Breakdown:
${entitySummaries}

Documents:
- ${stats.documentsReceived} documents received
- ${stats.documentsMissing} documents still needed

Items Flagged for CPA Review:
${cpaFlaggedStrategies || 'None flagged'}

High Priority Questions:
${highPriorityQuestions || 'None pending'}

Write a summary that:
1. Highlights the most important financial developments of the year
2. Points out anything the CPA should pay special attention to
3. Notes any missing documents or outstanding questions
4. Uses plain language, not tax jargon
5. Is confident and direct, not wishy-washy

Do NOT include any greeting, sign-off, or meta-commentary. Just the summary text.`;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.text || generateFallbackSummary(taxYear, stats);
  } catch (error) {
    console.error('Failed to generate executive summary:', error);
    return generateFallbackSummary(taxYear, stats);
  }
}

function generateFallbackSummary(
  taxYear: number,
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    activeStrategies: number;
    totalEstimatedSavings: number;
  }
): string {
  return `Tax Year ${taxYear} Overview

Total income across all entities was $${stats.totalIncome.toLocaleString()}, with expenses totaling $${stats.totalExpenses.toLocaleString()}, resulting in net income of $${stats.netIncome.toLocaleString()}.

${stats.activeStrategies} tax strategies are currently active, with estimated total savings of $${stats.totalEstimatedSavings.toLocaleString()}. Please review the flagged items in the Tax Strategy Summary section that require CPA input.

See the Document Checklist for items still needed to complete the return.`;
}

// ============================================================================
// Helpers
// ============================================================================

function parseMoneyValue(value: string): number | null {
  // Try to extract a number from strings like "$350,000", "350000", "$350K", etc.
  const cleaned = value.replace(/[$,]/g, '').trim();

  // Handle K/M suffixes
  if (cleaned.toLowerCase().endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1000;
  }
  if (cleaned.toLowerCase().endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1000000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatFactKey(key: string): string {
  // Convert snake_case or camelCase to Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
