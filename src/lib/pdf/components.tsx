/**
 * CPA Packet PDF Components
 *
 * React-PDF components for generating professional CPA packets.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import { styles, colors, formatCurrency, formatDate, getEntityColor } from './styles';
import type {
  CPAPacketData,
  EntitySummary,
  DocumentChecklistItem,
  StrategyItem,
  OpenQuestion,
  LineItem,
  DocumentStatus,
} from './types';

// ============================================================================
// Page Footer (used on every page)
// ============================================================================

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Prepared by CFO Command Center — Not tax advice. Discuss with your CPA.
      </Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

// ============================================================================
// Cover Page
// ============================================================================

function CoverPage({ data }: { data: CPAPacketData }) {
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.coverTitle}>CFO Command Center</Text>
        <Text style={styles.coverSubtitle}>
          Tax Year {data.taxYear} — CPA Packet
        </Text>

        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={styles.coverMeta}>{data.preparedBy}</Text>
          {data.preparedFor && (
            <Text style={[styles.coverMeta, { marginTop: 20 }]}>
              Prepared for: {data.preparedFor.name}
              {data.preparedFor.company && `, ${data.preparedFor.company}`}
            </Text>
          )}
        </View>

        <Text style={styles.coverDate}>
          Generated {formatDate(data.generatedAt)}
        </Text>
      </View>
    </Page>
  );
}

// ============================================================================
// Section Header
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ============================================================================
// Executive Summary Page
// ============================================================================

function ExecutiveSummaryPage({ data }: { data: CPAPacketData }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <SectionHeader title="Executive Summary" />

      <View style={styles.card}>
        <Text style={styles.body}>{data.executiveSummary}</Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={styles.subheading}>Key Numbers</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colFlex]}>Total Income</Text>
            <Text style={[styles.tableCellMono, styles.colMedium]}>
              {formatCurrency(data.stats.totalIncome)}
            </Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={[styles.tableCell, styles.colFlex]}>Total Expenses</Text>
            <Text style={[styles.tableCellMono, styles.colMedium]}>
              {formatCurrency(data.stats.totalExpenses)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colFlex, { fontWeight: 600 }]}>
              Net Income
            </Text>
            <Text
              style={[
                styles.tableCellMono,
                styles.colMedium,
                { fontWeight: 700 },
                data.stats.netIncome >= 0
                  ? { color: colors.success }
                  : { color: colors.danger },
              ]}
            >
              {formatCurrency(data.stats.netIncome)}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={styles.subheading}>Document Status</Text>
        <View style={[styles.row, { gap: 20 }]}>
          <View>
            <Text style={[styles.label, { marginBottom: 4 }]}>Received</Text>
            <Text style={[styles.body, styles.statusReceived, { fontSize: 16, fontWeight: 600 }]}>
              {data.stats.documentsReceived}
            </Text>
          </View>
          <View>
            <Text style={[styles.label, { marginBottom: 4 }]}>Missing</Text>
            <Text style={[styles.body, styles.statusMissing, { fontSize: 16, fontWeight: 600 }]}>
              {data.stats.documentsMissing}
            </Text>
          </View>
          <View>
            <Text style={[styles.label, { marginBottom: 4 }]}>Needs Review</Text>
            <Text style={[styles.body, styles.statusReview, { fontSize: 16, fontWeight: 600 }]}>
              {data.stats.documentsReview}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={styles.subheading}>Tax Strategies</Text>
        <View style={[styles.row, { gap: 20 }]}>
          <View>
            <Text style={[styles.label, { marginBottom: 4 }]}>Active Strategies</Text>
            <Text style={[styles.body, { fontSize: 16, fontWeight: 600 }]}>
              {data.stats.activeStrategies}
            </Text>
          </View>
          <View>
            <Text style={[styles.label, { marginBottom: 4 }]}>Est. Tax Savings</Text>
            <Text
              style={[
                styles.body,
                { fontSize: 16, fontWeight: 600, color: colors.success },
              ]}
            >
              {formatCurrency(data.stats.totalEstimatedSavings)}
            </Text>
          </View>
        </View>
      </View>

      <PageFooter />
    </Page>
  );
}

// ============================================================================
// Entity Section
// ============================================================================

function EntitySection({ entity }: { entity: EntitySummary }) {
  const entityColor = getEntityColor(entity.slug);

  return (
    <Page size="LETTER" style={styles.page} wrap>
      {/* Entity header */}
      <View style={styles.entityHeader}>
        <View style={[styles.entityDot, { backgroundColor: entityColor }]} />
        <Text style={styles.entityName}>{entity.name}</Text>
      </View>
      <Text style={[styles.label, { marginBottom: 16 }]}>
        {entity.type.replace('-', ' ').toUpperCase()}
      </Text>

      {/* Income section */}
      {entity.income.length > 0 && (
        <View>
          <Text style={styles.subheading}>Income</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colFlex]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.colMedium, { textAlign: 'right' }]}>
                Amount
              </Text>
            </View>
            {entity.income.map((item, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colFlex}>
                  <Text style={styles.tableCell}>{item.label}</Text>
                  {item.taxFormRef && (
                    <Text style={[styles.tableCell, { fontSize: 8, color: colors.textMuted }]}>
                      {item.taxFormRef}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCellMono, styles.colMedium]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
            <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: colors.border }]}>
              <Text style={[styles.tableCell, styles.colFlex, { fontWeight: 600 }]}>
                Total Income
              </Text>
              <Text style={[styles.tableCellMono, styles.colMedium, { fontWeight: 700 }]}>
                {formatCurrency(entity.totalIncome)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Expenses section */}
      {entity.expenses.length > 0 && (
        <View>
          <Text style={styles.subheading}>Expenses</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colFlex]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.colMedium, { textAlign: 'right' }]}>
                Amount
              </Text>
            </View>
            {entity.expenses.map((item, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colFlex}>
                  <Text style={styles.tableCell}>{item.label}</Text>
                  {item.taxFormRef && (
                    <Text style={[styles.tableCell, { fontSize: 8, color: colors.textMuted }]}>
                      {item.taxFormRef}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCellMono, styles.colMedium]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
            <View style={[styles.tableRow, { borderTopWidth: 2, borderTopColor: colors.border }]}>
              <Text style={[styles.tableCell, styles.colFlex, { fontWeight: 600 }]}>
                Total Expenses
              </Text>
              <Text style={[styles.tableCellMono, styles.colMedium, { fontWeight: 700 }]}>
                {formatCurrency(entity.totalExpenses)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Net income */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <View style={styles.row}>
          <Text style={[styles.body, { flex: 1, fontWeight: 600 }]}>Net Income</Text>
          <Text
            style={[
              styles.money,
              { fontSize: 14, fontWeight: 700 },
              entity.netIncome >= 0 ? styles.moneyPositive : styles.moneyNegative,
            ]}
          >
            {formatCurrency(entity.netIncome)}
          </Text>
        </View>
      </View>

      {/* Documents */}
      {entity.documents.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Key Documents</Text>
          <View style={styles.table}>
            {entity.documents.map((doc, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, styles.colFlex]}>{doc.name}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colSmall,
                    doc.status === 'received'
                      ? styles.statusReceived
                      : doc.status === 'missing'
                      ? styles.statusMissing
                      : styles.statusReview,
                  ]}
                >
                  {doc.status === 'received' ? '✓ Received' : doc.status === 'missing' ? '✕ Missing' : '● Review'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Notable items */}
      {entity.notableItems.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Notable Items</Text>
          {entity.notableItems.map((item, idx) => (
            <View key={idx} style={styles.alertBox}>
              <Text style={styles.body}>• {item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Strategy notes */}
      {entity.strategyNotes.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>Tax Strategy Notes</Text>
          {entity.strategyNotes.map((note, idx) => (
            <Text key={idx} style={[styles.body, { marginBottom: 4 }]}>
              • {note}
            </Text>
          ))}
        </View>
      )}

      <PageFooter />
    </Page>
  );
}

// ============================================================================
// Document Checklist Page
// ============================================================================

function DocumentChecklistPage({ items }: { items: DocumentChecklistItem[] }) {
  // Group by entity
  const byEntity: Record<string, DocumentChecklistItem[]> = {};
  items.forEach((item) => {
    if (!byEntity[item.entitySlug]) byEntity[item.entitySlug] = [];
    byEntity[item.entitySlug].push(item);
  });

  return (
    <Page size="LETTER" style={styles.page} wrap>
      <SectionHeader title="Document Checklist" />

      {Object.entries(byEntity).map(([slug, docs]) => (
        <View key={slug} style={{ marginBottom: 20 }} wrap={false}>
          <View style={styles.entityHeader}>
            <View style={[styles.entityDot, { backgroundColor: getEntityColor(slug) }]} />
            <Text style={styles.entityName}>{docs[0].entityName}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colFlex]}>Document</Text>
              <Text style={[styles.tableHeaderCell, styles.colSmall]}>Status</Text>
            </View>
            {docs.map((doc, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colFlex}>
                  <Text style={styles.tableCell}>{doc.description}</Text>
                  {doc.notes && (
                    <Text style={[styles.tableCell, { fontSize: 8, color: colors.textMuted }]}>
                      {doc.notes}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colSmall,
                    doc.status === 'received'
                      ? styles.statusReceived
                      : doc.status === 'missing'
                      ? styles.statusMissing
                      : styles.statusReview,
                  ]}
                >
                  {doc.status === 'received' ? '✓' : doc.status === 'missing' ? '✕' : '●'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <PageFooter />
    </Page>
  );
}

// ============================================================================
// Tax Strategies Page
// ============================================================================

function TaxStrategiesPage({ strategies }: { strategies: StrategyItem[] }) {
  // Separate CPA flagged items
  const cpaFlagged = strategies.filter((s) => s.cpaFlag);
  const others = strategies.filter((s) => !s.cpaFlag);

  return (
    <Page size="LETTER" style={styles.page} wrap>
      <SectionHeader title="Tax Strategy Summary" />

      {cpaFlagged.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.heading, { color: colors.warning }]}>
            Items Requiring CPA Discussion
          </Text>
          {cpaFlagged.map((strategy, idx) => (
            <View key={idx} style={[styles.alertBox, { marginBottom: 8 }]} wrap={false}>
              <Text style={[styles.body, { fontWeight: 600, marginBottom: 4 }]}>
                {strategy.name}
              </Text>
              <Text style={[styles.bodySecondary, { marginBottom: 4 }]}>
                {strategy.entityName} • {strategy.status} • {strategy.impact} impact
              </Text>
              <Text style={styles.body}>{strategy.description}</Text>
              {strategy.estimatedSavings && (
                <Text style={[styles.body, { marginTop: 4, color: colors.success }]}>
                  Estimated savings: {formatCurrency(strategy.estimatedSavings)}
                </Text>
              )}
              {strategy.actionRequired && (
                <Text style={[styles.body, { marginTop: 4, fontWeight: 500 }]}>
                  Action: {strategy.actionRequired}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {others.length > 0 && (
        <View>
          <Text style={styles.heading}>All Strategies</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colFlex]}>Strategy</Text>
              <Text style={[styles.tableHeaderCell, styles.colSmall]}>Status</Text>
              <Text style={[styles.tableHeaderCell, styles.colSmall]}>Impact</Text>
              <Text style={[styles.tableHeaderCell, styles.colMedium, { textAlign: 'right' }]}>
                Est. Savings
              </Text>
            </View>
            {others.map((strategy, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <View style={styles.colFlex}>
                  <Text style={styles.tableCell}>{strategy.name}</Text>
                  <Text style={[styles.tableCell, { fontSize: 8, color: colors.textMuted }]}>
                    {strategy.entityName}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.colSmall]}>{strategy.status}</Text>
                <Text style={[styles.tableCell, styles.colSmall]}>{strategy.impact}</Text>
                <Text style={[styles.tableCellMono, styles.colMedium]}>
                  {strategy.estimatedSavings ? formatCurrency(strategy.estimatedSavings) : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <PageFooter />
    </Page>
  );
}

// ============================================================================
// Open Questions Page
// ============================================================================

function OpenQuestionsPage({ questions }: { questions: OpenQuestion[] }) {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...questions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <Page size="LETTER" style={styles.page} wrap>
      <SectionHeader title="Open Questions for CPA" />

      <Text style={[styles.bodySecondary, { marginBottom: 16 }]}>
        The following items need your input or clarification:
      </Text>

      {sorted.map((q, idx) => (
        <View
          key={idx}
          style={[
            styles.card,
            {
              borderLeftWidth: 3,
              borderLeftColor:
                q.priority === 'high'
                  ? colors.danger
                  : q.priority === 'medium'
                  ? colors.warning
                  : colors.textMuted,
            },
          ]}
          wrap={false}
        >
          <View style={[styles.row, { marginBottom: 4 }]}>
            <Text
              style={[
                styles.label,
                {
                  color:
                    q.priority === 'high'
                      ? colors.danger
                      : q.priority === 'medium'
                      ? colors.warning
                      : colors.textMuted,
                },
              ]}
            >
              {q.priority.toUpperCase()} PRIORITY
            </Text>
            {q.entityName && (
              <Text style={[styles.label, { marginLeft: 12 }]}>{q.entityName}</Text>
            )}
          </View>
          <Text style={[styles.body, { fontWeight: 500 }]}>{q.question}</Text>
          {q.context && (
            <Text style={[styles.bodySecondary, { marginTop: 4 }]}>{q.context}</Text>
          )}
        </View>
      ))}

      <PageFooter />
    </Page>
  );
}

// ============================================================================
// Main Document
// ============================================================================

export function CPAPacketDocument({ data }: { data: CPAPacketData }) {
  return (
    <Document>
      <CoverPage data={data} />
      <ExecutiveSummaryPage data={data} />
      {data.entities.map((entity) => (
        <EntitySection key={entity.id} entity={entity} />
      ))}
      <DocumentChecklistPage items={data.documentChecklist} />
      <TaxStrategiesPage strategies={data.strategies} />
      {data.openQuestions.length > 0 && (
        <OpenQuestionsPage questions={data.openQuestions} />
      )}
    </Document>
  );
}
