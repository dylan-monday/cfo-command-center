/**
 * CPA Packet PDF Styles
 *
 * Design system for professional PDF generation.
 * Uses Urbanist for headings/body, JetBrains Mono for financial data.
 */

import { StyleSheet, Font } from '@react-pdf/renderer';

// ============================================================================
// Font Registration
// ============================================================================

// Register Urbanist font (Google Fonts)
Font.register({
  family: 'Urbanist',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/urbanist/v15/L0xjDF02iFML4hGCyOCpRdycFsGxSrqDyx8fFpOrS8SlKw.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/urbanist/v15/L0xjDF02iFML4hGCyOCpRdycFsGxSrqD-RofFpOrS8SlKw.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/urbanist/v15/L0xjDF02iFML4hGCyOCpRdycFsGxSrqDFR0fFpOrS8SlKw.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/urbanist/v15/L0xjDF02iFML4hGCyOCpRdycFsGxSrqDLB0fFpOrS8SlKw.ttf',
      fontWeight: 700,
    },
  ],
});

// Register JetBrains Mono (Google Fonts)
Font.register({
  family: 'JetBrains Mono',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8-axjPVmUsaaDhw.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8laxjPVmUsaaDhw.ttf',
      fontWeight: 700,
    },
  ],
});

// ============================================================================
// Color Palette
// ============================================================================

export const colors = {
  // Page
  background: '#F7F6F3',
  surface: '#FFFFFF',

  // Text
  text: '#1A1A1F',
  textSecondary: '#4A4A52',
  textMuted: '#6B6B73',

  // Brand
  accent: '#1A8A7D',
  accentLight: '#E8F5F3',

  // Status
  success: '#2D8A4E',
  warning: '#D4930D',
  danger: '#CC3333',

  // Entity colors
  entities: {
    mp: '#1A8A7D',
    got: '#CC3333',
    saratoga: '#7C5CFC',
    nice: '#D4930D',
    chippewa: '#E07C24',
    hvr: '#8B6B4E',
    personal: '#2D8A4E',
  } as Record<string, string>,

  // Table
  border: '#E5E5E0',
  rowAlt: '#FAFAF9',
};

// ============================================================================
// Base Styles
// ============================================================================

export const styles = StyleSheet.create({
  // Page
  page: {
    backgroundColor: colors.background,
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 50,
    fontFamily: 'Urbanist',
    fontSize: 10,
    color: colors.text,
  },

  // Cover page
  coverPage: {
    backgroundColor: colors.background,
    padding: 50,
    fontFamily: 'Urbanist',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },

  coverTitle: {
    fontFamily: 'Urbanist',
    fontSize: 36,
    fontWeight: 700,
    color: colors.accent,
    marginBottom: 12,
  },

  coverSubtitle: {
    fontFamily: 'Urbanist',
    fontSize: 20,
    fontWeight: 500,
    color: colors.text,
    marginBottom: 40,
  },

  coverMeta: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  coverDate: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 20,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 8,
  },

  sectionTitle: {
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
  },

  // Entity headers
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },

  entityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  entityName: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },

  // Text styles
  heading: {
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },

  subheading: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },

  body: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.text,
  },

  bodySecondary: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.textSecondary,
  },

  label: {
    fontFamily: 'Urbanist',
    fontSize: 9,
    fontWeight: 500,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Financial data
  money: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    textAlign: 'right',
  },

  moneyPositive: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    textAlign: 'right',
    color: colors.success,
  },

  moneyNegative: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    textAlign: 'right',
    color: colors.danger,
  },

  date: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: colors.textMuted,
  },

  // Tables
  table: {
    width: '100%',
    marginVertical: 12,
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 4,
  },

  tableHeaderCell: {
    fontFamily: 'Urbanist',
    fontSize: 9,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },

  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    backgroundColor: colors.rowAlt,
  },

  tableCell: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    color: colors.text,
    paddingRight: 8,
  },

  tableCellMono: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    color: colors.text,
    textAlign: 'right',
  },

  // Status indicators
  statusReceived: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    color: colors.success,
  },

  statusMissing: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    color: colors.danger,
  },

  statusReview: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    color: colors.warning,
  },

  // Cards/boxes
  card: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    marginVertical: 8,
  },

  alertBox: {
    backgroundColor: '#FEF3E7',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: 12,
    marginVertical: 8,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },

  footerText: {
    fontFamily: 'Urbanist',
    fontSize: 8,
    color: colors.textMuted,
  },

  footerPage: {
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
    color: colors.textMuted,
  },

  // Utilities
  row: {
    flexDirection: 'row',
  },

  col: {
    flexDirection: 'column',
  },

  spacer: {
    height: 16,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 16,
  },

  // Column widths for tables
  colFlex: {
    flex: 1,
  },

  colSmall: {
    width: 60,
  },

  colMedium: {
    width: 100,
  },

  colLarge: {
    width: 150,
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `($${formatted})` : `$${formatted}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getEntityColor(slug: string): string {
  return colors.entities[slug] || colors.accent;
}
