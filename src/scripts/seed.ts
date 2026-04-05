/**
 * CFO Command Center - Seed Data Script
 *
 * This script populates the database with initial data for:
 * - 7 entities (business/property/personal)
 * - ~15 accounts across all entities
 * - 120+ knowledge base facts
 * - 17 tax strategies
 * - 20+ proactive queue items
 *
 * Run with: npm run seed
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type {
  EntitySlug,
  EntityType,
  AccountType,
  KnowledgeCategory,
  KnowledgeSource,
  KnowledgeConfidence,
  StrategyStatus,
  StrategyImpact,
  AlertType,
  AlertPriority,
  AlertStatus,
  PartnerRole,
  PartnerStatus,
} from '../types';

// Supabase types for insert operations (simpler than full Database type)
interface EntityInsert {
  slug: EntitySlug;
  name: string;
  type: EntityType;
  tax_treatment: string;
  color: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface AccountInsert {
  entity_id: string;
  name: string;
  type: AccountType;
  institution: string;
  last4?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface KnowledgeInsert {
  entity_id?: string;
  category: KnowledgeCategory;
  key: string;
  value: string;
  source?: KnowledgeSource;
  confidence?: KnowledgeConfidence;
}

interface StrategyInsert {
  entity_id: string;
  name: string;
  status: StrategyStatus;
  impact: StrategyImpact;
  description: string;
  action_required?: string;
  estimated_savings?: number;
  cpa_flag: boolean;
  tax_year?: number;
  metadata?: Record<string, unknown>;
}

interface AlertInsert {
  type: AlertType;
  priority: AlertPriority;
  entity_id?: string | null;
  message: string;
  due_date?: string;
  status?: AlertStatus;
}

interface PartnerInsert {
  name: string;
  role: PartnerRole;
  company?: string;
  email?: string;
  phone?: string;
  entities?: string[];  // Will be populated with entity IDs
  notes?: string;
  status: PartnerStatus;
}

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Create admin client (bypasses RLS) - using 'any' to avoid type complexity for seed script
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// ENTITIES
// ============================================================================

const entities: EntityInsert[] = [
  {
    slug: 'mp',
    name: 'Monday + Partners LLC',
    type: 's-corp',
    tax_treatment: 'S-Corporation - Pass-through to Dylan\'s personal return via K-1',
    color: '#1A8A7D',
    notes: 'Dylan\'s consulting business. Single-member S-Corp.',
    metadata: { ein: 'redacted', state: 'LA' },
  },
  {
    slug: 'got',
    name: 'Game of Thrones LLC',
    type: 'partnership',
    tax_treatment: 'Partnership - 50/50 split with Kevin Lakritz, K-1 to each partner',
    color: '#CC3333',
    notes: '4-unit rental property at 3520 18th St, San Francisco. Dylan+Keelin 50%, Kevin 50%.',
    metadata: { ein: 'redacted', state: 'CA' },
  },
  {
    slug: 'saratoga',
    name: '4605/4607 S. Saratoga St',
    type: 'rental-property',
    tax_treatment: 'Schedule E rental income on personal return',
    color: '#7C5CFC',
    notes: 'Duplex in New Orleans - Lower unit 3BR/2BA, Upper unit 2BR/2BA',
    metadata: { address: '4605/4607 S. Saratoga St, New Orleans, LA 70115' },
  },
  {
    slug: 'nice',
    name: 'Nice Apartment',
    type: 'foreign-property',
    tax_treatment: 'Foreign rental property - ADS 40-year depreciation, FBAR/FATCA required',
    color: '#D4930D',
    notes: 'F2 apartment in Nice, France. 50m², 3rd floor. Purchased 04/14/2025.',
    metadata: { address: 'Nice, France', currency: 'EUR' },
  },
  {
    slug: 'chippewa',
    name: '2365 Chippewa St (Primary Residence)',
    type: 'primary-residence',
    tax_treatment: 'Primary residence - mortgage interest deduction, property tax deduction',
    color: '#E07C24',
    notes: 'Family home in New Orleans',
    metadata: { address: '2365 Chippewa St, New Orleans, LA 70130' },
  },
  {
    slug: 'hvr',
    name: 'Hidden Valley Ranch (NM)',
    type: 'vacant-land',
    tax_treatment: 'Vacant land - no depreciation, property tax only',
    color: '#8B6B4E',
    notes: '5.2 acres in San Miguel County, NM. Purchased 2008.',
    metadata: { address: 'Lot W(2), San Miguel County, NM', acreage: 5.2 },
  },
  {
    slug: 'personal',
    name: 'Personal / Individual',
    type: 'personal',
    tax_treatment: 'Personal accounts - interest, dividends, capital gains on Form 1040',
    color: '#2D8A4E',
    notes: 'Personal and investment accounts for Dylan and Keelin',
    metadata: {},
  },
];

// ============================================================================
// ACCOUNTS
// ============================================================================

// We'll use entity slugs as keys and insert proper IDs after entity insertion
const accountsByEntity: Record<string, Array<{
  name: string;
  type: AccountType;
  institution: string;
  last4?: string;
  notes?: string;
}>> = {
  mp: [
    { name: 'Chase Business Checking', type: 'checking', institution: 'Chase', last4: '9695', notes: 'Primary operating account' },
    { name: 'Chase Business Credit 1', type: 'credit', institution: 'Chase', notes: 'Business credit card #1' },
    { name: 'Chase Business Credit 2', type: 'credit', institution: 'Chase', notes: 'Business credit card #2' },
    { name: 'Schwab Solo 401(k)', type: 'retirement', institution: 'Schwab', last4: '767', notes: 'Solo 401(k) for Dylan' },
  ],
  personal: [
    { name: 'Chase Personal Checking', type: 'checking', institution: 'Chase', last4: '1346', notes: 'Primary personal checking' },
    { name: 'Schwab Brokerage', type: 'brokerage', institution: 'Schwab', notes: 'Main taxable investment account' },
    { name: 'Public.com Brokerage', type: 'brokerage', institution: 'Public.com', notes: 'Secondary brokerage' },
    { name: 'START 529 (Sabine)', type: '529', institution: 'Louisiana START', notes: 'Sabine\'s college savings - TO BE OPENED' },
  ],
  got: [
    { name: 'Chase Business Checking (GOT)', type: 'checking', institution: 'Chase', last4: '2864', notes: 'GOT LLC operating account' },
    { name: 'Mr. Cooper Mortgage (18th St)', type: 'mortgage', institution: 'Mr. Cooper', notes: 'GOT property mortgage. 4.125% fixed.' },
  ],
  saratoga: [
    { name: 'Chase Personal Checking (Saratoga)', type: 'checking', institution: 'Chase', last4: '6459', notes: 'Saratoga rental income account' },
    { name: 'Dovenmuehle Mortgage (Saratoga)', type: 'mortgage', institution: 'Dovenmuehle', notes: 'First Horizon serviced by Dovenmuehle' },
  ],
  nice: [
    { name: 'CCF Joint Checking', type: 'checking', institution: 'CCF', notes: 'French bank account for Nice property. EUR account.' },
    { name: 'CCF Mortgage', type: 'mortgage', institution: 'CCF', notes: 'French mortgage for Nice apartment' },
  ],
  chippewa: [
    { name: 'Rocket Mortgage (Chippewa)', type: 'mortgage', institution: 'Rocket', notes: 'Primary residence mortgage. 5.99% rate.' },
  ],
};

// ============================================================================
// KNOWLEDGE BASE FACTS
// ============================================================================

// Facts without entity_id (global/personal)
const globalFacts: Array<{ category: KnowledgeCategory; key: string; value: string }> = [
  // Filing & Family
  { category: 'tax', key: 'filing_status', value: 'Married Filing Jointly' },
  { category: 'cpa', key: 'cpa_firm', value: 'Ready CPA LLC (Aaron Ready)' },
  { category: 'cpa', key: 'cpa_contact', value: 'Aaron Ready - Ready CPA LLC' },
  { category: 'personal', key: 'spouse_name', value: 'Keelin' },
  { category: 'personal', key: 'spouse_age', value: '42' },
  { category: 'personal', key: 'spouse_employment', value: 'Employed by M+P via Gusto, $40K/year W-2 salary' },
  { category: 'personal', key: 'daughter_name', value: 'Sabine' },
  { category: 'personal', key: 'daughter_age', value: '7 (turns 8 on 05/05/2026)' },
  { category: 'personal', key: 'daughter_school', value: 'French immersion school, New Orleans' },
  { category: 'personal', key: 'citizenship', value: 'US + Italian dual citizen (Dylan)' },

  // Investment approach
  { category: 'financial', key: 'investment_approach', value: 'VTI-focused passive indexing with DRIP enabled' },
  { category: 'financial', key: 'investment_philosophy', value: 'Buy and hold index funds, minimize trading, reinvest dividends' },

  // 529 Plan
  { category: 'tax', key: '529_status', value: 'NOT YET OPENED — NEEDS ACTION' },
  { category: 'tax', key: 'louisiana_529_plan', value: 'START program - state tax deduction available' },

  // Other income
  { category: 'financial', key: 'natrx_role', value: 'Part-time Head of Marketing' },
  { category: 'financial', key: 'natrx_compensation', value: 'Equity via SAFE + options (vesting)' },

  // Tax year info
  { category: 'tax', key: 'tax_year_current', value: '2026' },
  { category: 'tax', key: 'q1_estimated_due', value: '04/15/2026' },
  { category: 'tax', key: 'q2_estimated_due', value: '06/15/2026' },
  { category: 'tax', key: 'q3_estimated_due', value: '09/15/2026' },
  { category: 'tax', key: 'q4_estimated_due', value: '01/15/2027' },
];

// Facts by entity slug
const factsByEntity: Record<string, Array<{ category: KnowledgeCategory; key: string; value: string }>> = {
  mp: [
    // M+P Business Structure
    { category: 'financial', key: 'mp_structure', value: 'S-Corp, single-member (Dylan)' },
    { category: 'financial', key: 'mp_gross_annual', value: '~$350,000' },
    { category: 'financial', key: 'mp_state', value: 'Louisiana' },

    // M+P Operations
    { category: 'financial', key: 'bookkeeper', value: 'Dawn' },
    { category: 'financial', key: 'payroll_provider', value: 'Gusto' },
    { category: 'financial', key: 'accounting_software', value: 'QuickBooks Online' },

    // M+P Retirement
    { category: 'tax', key: '401k_custodian', value: 'Schwab' },
    { category: 'tax', key: '401k_advisor', value: 'Occidental Asset Management' },
    { category: 'tax', key: '2025_employee_deferral', value: '$35,937' },
    { category: 'tax', key: '2026_employee_deferral_limit', value: '$23,500' },
    { category: 'tax', key: '2026_employer_limit', value: '25% of W-2 wages' },

    // M+P Health Insurance
    { category: 'tax', key: 'health_insurance_per_paycheck', value: '$729.33 (2026 rate)' },
    { category: 'tax', key: 'health_insurance_annual', value: '~$17,500' },
    { category: 'tax', key: 'health_insurance_deduction_type', value: 'Self-employed health insurance deduction (above the line)' },

    // Keelin on M+P payroll
    { category: 'tax', key: 'keelin_w2_salary', value: '$40,000/year from M+P via Gusto' },
    { category: 'tax', key: 'keelin_w2_purpose', value: 'Legitimate W-2 income enables IRA contributions, SS credits, income splitting' },

    // M+P Deductions
    { category: 'tax', key: 'accountable_plan_status', value: 'NOT YET ADOPTED — NEEDS ACTION' },
    { category: 'tax', key: 'home_office_status', value: 'Need to measure square footage and adopt accountable plan' },
    { category: 'financial', key: 'cowork_membership', value: 'Cowork — confirm flowing through M+P business account' },

    // M+P Banking
    { category: 'financial', key: 'primary_bank', value: 'Chase' },
    { category: 'financial', key: 'chase_checking_last4', value: '9695' },
  ],

  got: [
    // GOT Property Details
    { category: 'property', key: 'address', value: '3520 18th St, San Francisco, CA 94110' },
    { category: 'property', key: 'property_type', value: '4 units + 2 parking spaces' },
    { category: 'property', key: 'building_size', value: '3,634 sqft' },
    { category: 'property', key: 'year_built', value: '1923' },

    // GOT Ownership
    { category: 'legal', key: 'ownership_split', value: 'Dylan+Keelin 50%, Kevin Lakritz 50%' },
    { category: 'legal', key: 'partner', value: 'Kevin Lakritz' },

    // GOT Property Management
    { category: 'property', key: 'pm_company', value: 'Morley Fredericks' },
    { category: 'property', key: 'pm_contact', value: 'Steve Crane' },
    { category: 'property', key: 'pm_software', value: 'AppFolio' },
    { category: 'property', key: 'pm_fee', value: '7% of collected rent = ~$962.50/mo' },

    // GOT Financials
    { category: 'financial', key: 'gross_monthly_rent', value: '$13,750' },
    { category: 'financial', key: 'gross_annual_rent', value: '$165,000' },
    { category: 'financial', key: 'occupancy', value: '100%' },

    // GOT Mortgage
    { category: 'financial', key: 'mortgage_balance', value: '$664,114.44 (as of 03/03/2026)' },
    { category: 'financial', key: 'mortgage_rate', value: '4.125% fixed' },
    { category: 'financial', key: 'mortgage_servicer', value: 'Mr. Cooper (formerly Rocket)' },

    // GOT Insurance
    { category: 'property', key: 'insurance_provider', value: 'Honeycomb' },
    { category: 'property', key: 'insurance_annual', value: '$3,910.23/yr' },

    // GOT Taxes & Compliance
    { category: 'tax', key: 'ca_llc_tax', value: '$800/yr minimum franchise tax' },
    { category: 'legal', key: 'soi_status', value: 'OVERDUE since 04/30/2024 — bizfile.sos.ca.gov, $20 fee' },

    // GOT Tenants
    { category: 'property', key: 'tenant_unit1', value: 'Gabriela Guerrero, $3,450/mo, pays in 3 installments' },
    { category: 'property', key: 'tenant_unit2', value: 'Mabel Salazar, $3,250/mo, reliable' },
    { category: 'property', key: 'tenant_unit3', value: 'Teresa Moore, $3,350/mo, pays last day, 2 NSFs on record' },
    { category: 'property', key: 'tenant_unit4', value: 'Charles Miller, $3,200/mo ($1K below market, rent control)' },

    // GOT Utilities
    { category: 'property', key: 'water_provider', value: 'SFPUC' },
    { category: 'property', key: 'water_bill_method', value: 'Passed through to tenants via RUBS' },
    { category: 'property', key: 'trash_provider', value: 'Recology' },
    { category: 'property', key: 'recology_issue', value: 'Billing address redirect — confirm Morley updated' },
  ],

  saratoga: [
    // Saratoga Property Details
    { category: 'property', key: 'address', value: '4605/4607 S. Saratoga St, New Orleans, LA 70115' },
    { category: 'property', key: 'property_type', value: 'Duplex — Lower 3BR/2BA, Upper 2BR/2BA' },

    // Saratoga Property Management
    { category: 'property', key: 'pm_company', value: 'Satsuma Property Management' },
    { category: 'property', key: 'pm_trust_level', value: 'LOW — scrutinize everything' },
    { category: 'property', key: 'pm_fee', value: '10% of gross rent = ~$377/mo' },

    // Saratoga Financials
    { category: 'financial', key: 'gross_monthly_rent', value: '$3,770' },
    { category: 'financial', key: 'gross_annual_rent', value: '$45,240' },
    { category: 'financial', key: 'cash_flow_status', value: 'Deficit ~($5,700)/yr — monitor closely' },

    // Saratoga Mortgage
    { category: 'financial', key: 'mortgage_balance', value: '$260,567.69 (as of 03/09/2026)' },
    { category: 'financial', key: 'mortgage_servicer', value: 'Dovenmuehle (First Horizon)' },

    // Saratoga Insurance
    { category: 'property', key: 'insurance_provider', value: 'LA Citizens FAIRPLAN' },
    { category: 'property', key: 'insurance_annual', value: '$5,784/yr' },

    // Saratoga Issues
    { category: 'property', key: 'water_provider', value: 'SWBNO (Sewerage & Water Board of New Orleans)' },
    { category: 'property', key: 'water_bill_issue', value: '$1,119.83 overcharge STILL UNRESOLVED — Satsuma no status' },
    { category: 'property', key: 'water_usage_issue', value: 'Usage doubled from $149 to $228 — investigation in progress' },
  ],

  nice: [
    // Nice Property Details
    { category: 'property', key: 'location', value: 'Nice, France' },
    { category: 'property', key: 'property_type', value: 'F2 apartment, 50m², 3rd floor' },
    { category: 'property', key: 'purchase_date', value: '04/14/2025' },

    // Nice Financials
    { category: 'financial', key: 'monthly_carrying_cost', value: '~€1,477' },
    { category: 'financial', key: 'ccf_balance', value: '€14,486.26 (as of 03/07/2026)' },
    { category: 'financial', key: 'currency', value: 'EUR' },

    // Nice Rental Status
    { category: 'property', key: 'rental_status', value: 'NOT TENANTED — need tenant or track as personal use cost' },

    // Nice Tax/Compliance
    { category: 'tax', key: 'fbar_required', value: 'YES — CCF balance exceeds $10K threshold' },
    { category: 'tax', key: 'fatca_required', value: 'YES — foreign financial account' },
    { category: 'tax', key: 'depreciation_method', value: 'ADS 40-year (required for foreign property)' },

    // Nice Misc
    { category: 'financial', key: 'kylian_heckel_payment', value: '€65 payment — personal or property? CLARIFY' },
  ],

  chippewa: [
    // Chippewa Property Details
    { category: 'property', key: 'address', value: '2365 Chippewa St, New Orleans, LA 70130' },
    { category: 'property', key: 'property_type', value: 'Primary residence' },

    // Chippewa Mortgage
    { category: 'financial', key: 'mortgage_balance', value: '$607,870.35 (as of 02/16/2026)' },
    { category: 'financial', key: 'mortgage_rate', value: '5.990%' },
    { category: 'financial', key: 'mortgage_servicer', value: 'Rocket Mortgage' },

    // Chippewa Insurance
    { category: 'property', key: 'insurance_provider', value: 'SafeChoice/Sagesure' },
    { category: 'property', key: 'insurance_annual', value: '$7,634.13/yr' },

    // Chippewa Property Tax
    { category: 'tax', key: 'property_tax_2026', value: '$7,734.74' },
  ],

  hvr: [
    // HVR Property Details
    { category: 'property', key: 'address', value: 'Lot W(2), San Miguel County, NM' },
    { category: 'property', key: 'property_type', value: 'Vacant land' },
    { category: 'property', key: 'acreage', value: '5.2 acres' },
    { category: 'property', key: 'purchase_year', value: '2008' },

    // HVR Taxes
    { category: 'tax', key: 'annual_property_tax', value: '$132.50' },

    // HVR Water Rights
    { category: 'property', key: 'water_rights', value: '3 acre-feet per annum' },
  ],

  personal: [
    // Personal Investment Strategy
    { category: 'financial', key: 'primary_brokerage', value: 'Schwab' },
    { category: 'financial', key: 'secondary_brokerage', value: 'Public.com' },
    { category: 'financial', key: 'investment_style', value: 'Passive index investing, VTI-focused' },
    { category: 'financial', key: 'drip_enabled', value: 'Yes - dividend reinvestment active' },

    // Sabine School
    { category: 'personal', key: 'sabine_school_type', value: 'UNKNOWN — is it public or private? What\'s tuition?' },
  ],
};

// ============================================================================
// TAX STRATEGIES
// ============================================================================

const strategiesByEntity: Record<string, Array<{
  name: string;
  status: StrategyStatus;
  impact: StrategyImpact;
  description: string;
  action_required?: string;
  estimated_savings?: number;
  cpa_flag: boolean;
  tax_year?: number;
}>> = {
  mp: [
    {
      name: 'Solo 401(k) — Dylan',
      status: 'active',
      impact: 'high',
      description: 'Max out Solo 401(k) contributions: $23,500 employee deferral + 25% employer match on W-2 wages.',
      action_required: 'Confirm 2026 contribution limits with Occidental. Ensure employer contribution added to 2025 return.',
      estimated_savings: 15000,
      cpa_flag: true,
      tax_year: 2026,
    },
    {
      name: 'Solo 401(k) — Keelin',
      status: 'review',
      impact: 'high',
      description: 'Keelin may be eligible for Solo 401(k) if treated as self-employed or partner. $40K W-2 would enable significant contribution.',
      action_required: 'Confirm Keelin eligibility with Occidental/Schwab. Structure may need adjustment.',
      estimated_savings: 10000,
      cpa_flag: true,
      tax_year: 2026,
    },
    {
      name: 'Self-Employed Health Insurance',
      status: 'active',
      impact: 'high',
      description: 'Deduct 100% of health insurance premiums as self-employed health insurance deduction (above the line).',
      action_required: 'Ensure premiums tracked separately from other business expenses.',
      estimated_savings: 5000,
      cpa_flag: false,
      tax_year: 2026,
    },
    {
      name: 'Keelin Health Insurance',
      status: 'review',
      impact: 'medium',
      description: 'Is Keelin on the Gusto health plan? If so, additional deduction available.',
      action_required: 'Verify if Keelin enrolled in M+P health plan via Gusto.',
      cpa_flag: true,
    },
    {
      name: 'QBI Deduction (20%)',
      status: 'active',
      impact: 'high',
      description: 'S-Corp pass-through income qualifies for 20% QBI deduction. Significant tax savings on K-1 income.',
      estimated_savings: 20000,
      cpa_flag: false,
      tax_year: 2026,
    },
    {
      name: 'Home Office Reimbursement',
      status: 'not-started',
      impact: 'medium',
      description: 'Adopt accountable plan to reimburse Dylan for home office expenses tax-free.',
      action_required: 'Measure home office square footage. Adopt accountable plan. Calculate reimbursement.',
      estimated_savings: 3000,
      cpa_flag: true,
    },
    {
      name: 'Keelin on Payroll',
      status: 'active',
      impact: 'high',
      description: 'Keelin\'s $40K W-2 salary from M+P provides legitimate income for IRA contributions, Social Security credits, and income splitting.',
      cpa_flag: false,
    },
    {
      name: 'Augusta Rule',
      status: 'review',
      impact: 'low',
      description: 'Rent personal residence to M+P for up to 14 days tax-free. Requires documentation and fair market rent.',
      action_required: 'Research fair market rent for Chippewa. Document qualifying business use.',
      cpa_flag: true,
    },
  ],

  got: [
    {
      name: 'Cost Segregation Study',
      status: 'review',
      impact: 'high',
      description: 'Accelerate depreciation on GOT property components (appliances, fixtures, etc.) to front-load deductions.',
      action_required: 'Get cost basis from CPA. Evaluate if study cost justified by tax savings.',
      estimated_savings: 25000,
      cpa_flag: true,
    },
  ],

  nice: [
    {
      name: 'Foreign Tax/FBAR/FATCA',
      status: 'active',
      impact: 'medium',
      description: 'CCF account balance exceeds $10K threshold. FBAR (FinCEN 114) required annually. FATCA reporting on Form 8938.',
      action_required: 'File FBAR by April 15. Include Form 8938 with tax return.',
      cpa_flag: true,
    },
    {
      name: 'Nice Depreciation (ADS 40yr)',
      status: 'review',
      impact: 'medium',
      description: 'Foreign rental property must use ADS 40-year depreciation (vs MACRS 27.5 years for US property).',
      action_required: 'Get cost basis and start depreciation schedule.',
      cpa_flag: true,
    },
  ],

  personal: [
    {
      name: 'Estimated Payment Optimization',
      status: 'active',
      impact: 'medium',
      description: 'Optimize estimated tax payments to avoid underpayment penalty while not overpaying.',
      cpa_flag: false,
    },
    {
      name: '529 Plan for Sabine',
      status: 'not-started',
      impact: 'medium',
      description: 'Open Louisiana START 529 plan for Sabine. State tax deduction available for LA residents.',
      action_required: 'Open START 529 account this month. Set up automatic contributions.',
      estimated_savings: 1000,
      cpa_flag: false,
    },
    {
      name: 'Child Tax Credit',
      status: 'review',
      impact: 'medium',
      description: 'Claim Child Tax Credit for Sabine. Verify income phase-out limits.',
      action_required: 'Confirm CTC eligibility given income level.',
      cpa_flag: true,
    },
    {
      name: 'Charitable Giving (Appreciated Securities)',
      status: 'not-started',
      impact: 'low',
      description: 'Donate appreciated securities directly to charity to avoid capital gains while getting full FMV deduction.',
      cpa_flag: false,
    },
    {
      name: 'Dependent Care FSA',
      status: 'not-started',
      impact: 'low',
      description: 'Use dependent care FSA for childcare expenses (summer camp, after-school care). $5,000 limit.',
      cpa_flag: false,
    },
    {
      name: 'Custodial Roth IRA (Sabine, future)',
      status: 'not-started',
      impact: 'low',
      description: 'When Sabine has earned income, open custodial Roth IRA for tax-free growth.',
      cpa_flag: false,
    },
  ],
};

// ============================================================================
// PROACTIVE QUEUE
// ============================================================================

const alertsByEntity: Record<string | 'global', Array<{
  type: AlertType;
  priority: AlertPriority;
  message: string;
  due_date?: string;
}>> = {
  global: [
    // Critical
    {
      type: 'deadline',
      priority: 'critical',
      message: 'Form 1065 (8879-PE) STILL UNSIGNED — Dylan must sign before e-filing. GOT partnership return cannot be filed until signed.',
    },
  ],

  mp: [
    // High
    {
      type: 'alert',
      priority: 'high',
      message: '2025 return unsigned — missing Solo 401(k) employer deduction. Confirm employer contribution added before signing.',
    },
    {
      type: 'recommendation',
      priority: 'high',
      message: 'Accountable plan needed for home office reimbursement — measure home office square footage and adopt plan.',
    },
    // Medium
    {
      type: 'question',
      priority: 'medium',
      message: 'Is Keelin on Gusto health plan? If so, additional deduction available.',
    },
    {
      type: 'question',
      priority: 'medium',
      message: 'Cowork membership — confirm flowing through M+P business account, not personal.',
    },
    {
      type: 'question',
      priority: 'medium',
      message: 'Keelin Solo 401(k) eligibility — confirm with Occidental/Schwab if structure allows.',
    },
  ],

  got: [
    // High
    {
      type: 'deadline',
      priority: 'high',
      message: 'GOT SOI (Statement of Information) filing OVERDUE since 04/30/2024 — bizfile.sos.ca.gov, $20 fee. File immediately.',
    },
    {
      type: 'recommendation',
      priority: 'high',
      message: 'Depreciation schedules needed — get cost basis from CPA to evaluate cost segregation study.',
    },
    {
      type: 'alert',
      priority: 'high',
      message: 'Recology billing address redirect — confirm Morley updated billing address.',
    },
    // Medium
    {
      type: 'question',
      priority: 'medium',
      message: 'Guerrero split rent (3 installments/mo) — can it be consolidated to reduce admin overhead?',
    },
    // Monitor
    {
      type: 'alert',
      priority: 'monitor',
      message: 'Teresa Moore pays last day every month, 2 NSFs on record — monitor payment patterns.',
    },
    {
      type: 'alert',
      priority: 'monitor',
      message: 'Charles Miller below market by $1,000/mo — rent control limits options, accept or wait for vacancy.',
    },
  ],

  saratoga: [
    // Critical
    {
      type: 'alert',
      priority: 'critical',
      message: 'SWBNO water bill overcharge ($1,119.83) still unresolved — Satsuma has provided no status. Escalate.',
    },
    // High
    {
      type: 'alert',
      priority: 'high',
      message: 'SWBNO water usage doubled ($149→$228) — investigation in progress. Check for leaks or meter issues.',
    },
    // Monitor
    {
      type: 'alert',
      priority: 'monitor',
      message: 'Saratoga cash flow deficit ~($5,700)/yr — property is cash-flow negative. Monitor expenses.',
    },
    {
      type: 'alert',
      priority: 'monitor',
      message: 'Satsuma oversight quality generally poor — scrutinize all statements and invoices.',
    },
  ],

  nice: [
    // Medium
    {
      type: 'question',
      priority: 'medium',
      message: 'Nice apartment rental status — need tenant or track carrying costs as personal use expense.',
    },
    {
      type: 'question',
      priority: 'medium',
      message: 'Kylian Heckel €65 payment — is this personal or property-related? Clarify.',
    },
  ],

  personal: [
    // High
    {
      type: 'recommendation',
      priority: 'high',
      message: '529 plan for Sabine — open Louisiana START account this month. State tax deduction available.',
    },
    // Medium
    {
      type: 'question',
      priority: 'medium',
      message: 'Is Sabine\'s school public or private? What\'s the tuition? Need for education planning.',
    },
  ],
};

// ============================================================================
// PARTNERS
// ============================================================================

// Partners with their associated entity slugs (will be converted to IDs)
const partnersByEntitySlug: Array<{
  name: string;
  role: PartnerRole;
  company?: string;
  email?: string;
  phone?: string;
  entitySlugs: string[];  // 'all' means all entities
  notes?: string;
  status: PartnerStatus;
}> = [
  {
    name: 'Aaron Ready',
    role: 'cpa',
    company: 'Ready CPA LLC',
    entitySlugs: ['all'],
    notes: 'Primary CPA for all entities and personal taxes',
    status: 'active',
  },
  {
    name: 'Dawn',
    role: 'bookkeeper',
    entitySlugs: ['mp'],
    notes: 'M+P bookkeeper, manages QuickBooks',
    status: 'active',
  },
  {
    name: 'Steve Crane',
    role: 'property-manager',
    company: 'Morley Fredericks',
    entitySlugs: ['got'],
    notes: 'GOT property manager, uses AppFolio. 7% management fee.',
    status: 'active',
  },
  {
    name: 'Satsuma Property Management',
    role: 'property-manager',
    company: 'Satsuma',
    entitySlugs: ['saratoga'],
    notes: 'Saratoga PM. LOW TRUST — scrutinize everything. 10% fee.',
    status: 'active',
  },
  {
    name: 'Occidental Asset Management',
    role: 'advisor',
    entitySlugs: ['mp'],
    notes: 'Solo 401(k) advisor for M+P retirement accounts',
    status: 'active',
  },
  {
    name: 'Objectif Reussite Immobilier',
    role: 'syndic',
    entitySlugs: ['nice'],
    notes: 'French syndic (building management) for Nice apartment',
    status: 'active',
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('🌱 Starting CFO Command Center seed...\n');

  // -------------------------------------------------------------------------
  // Step 1: Clear existing data (optional, for re-runs)
  // -------------------------------------------------------------------------
  console.log('🧹 Clearing existing data...');

  // Delete in reverse dependency order
  await supabase.from('notification_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('account_balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('proactive_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tax_estimates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tax_strategies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('document_patterns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('entities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('   ✓ Existing data cleared\n');

  // -------------------------------------------------------------------------
  // Step 2: Insert entities
  // -------------------------------------------------------------------------
  console.log('📦 Inserting entities...');

  const { data: insertedEntities, error: entitiesError } = await supabase
    .from('entities')
    .insert(entities)
    .select();

  if (entitiesError) {
    console.error('   ✗ Error inserting entities:', entitiesError);
    process.exit(1);
  }

  // Create slug -> id map
  const entityIdMap: Record<string, string> = {};
  for (const entity of insertedEntities!) {
    entityIdMap[entity.slug] = entity.id;
  }

  console.log(`   ✓ ${insertedEntities!.length} entities inserted\n`);

  // -------------------------------------------------------------------------
  // Step 3: Insert accounts
  // -------------------------------------------------------------------------
  console.log('🏦 Inserting accounts...');

  const accountsToInsert = [];
  for (const [entitySlug, accounts] of Object.entries(accountsByEntity)) {
    const entityId = entityIdMap[entitySlug];
    if (!entityId) continue;

    for (const account of accounts) {
      accountsToInsert.push({
        entity_id: entityId,
        ...account,
      });
    }
  }

  const { data: insertedAccounts, error: accountsError } = await supabase
    .from('accounts')
    .insert(accountsToInsert)
    .select();

  if (accountsError) {
    console.error('   ✗ Error inserting accounts:', accountsError);
    process.exit(1);
  }

  console.log(`   ✓ ${insertedAccounts!.length} accounts inserted\n`);

  // -------------------------------------------------------------------------
  // Step 4: Insert knowledge base facts
  // -------------------------------------------------------------------------
  console.log('🧠 Inserting knowledge base facts...');

  // Global facts (no entity_id)
  const globalFactsToInsert = globalFacts.map((fact) => ({
    ...fact,
    source: 'seed' as const,
    confidence: 'confirmed' as const,
  }));

  // Entity-specific facts
  const entityFactsToInsert = [];
  for (const [entitySlug, facts] of Object.entries(factsByEntity)) {
    const entityId = entityIdMap[entitySlug];
    if (!entityId) continue;

    for (const fact of facts) {
      entityFactsToInsert.push({
        entity_id: entityId,
        ...fact,
        source: 'seed' as const,
        confidence: 'confirmed' as const,
      });
    }
  }

  const allFacts = [...globalFactsToInsert, ...entityFactsToInsert];

  const { error: factsError } = await supabase.from('knowledge_base').insert(allFacts);

  if (factsError) {
    console.error('   ✗ Error inserting facts:', factsError);
    process.exit(1);
  }

  console.log(`   ✓ ${allFacts.length} knowledge base facts inserted\n`);

  // -------------------------------------------------------------------------
  // Step 5: Insert tax strategies
  // -------------------------------------------------------------------------
  console.log('📊 Inserting tax strategies...');

  const strategiesToInsert = [];
  for (const [entitySlug, strategies] of Object.entries(strategiesByEntity)) {
    const entityId = entityIdMap[entitySlug];
    if (!entityId) continue;

    for (const strategy of strategies) {
      strategiesToInsert.push({
        entity_id: entityId,
        ...strategy,
      });
    }
  }

  const { error: strategiesError } = await supabase.from('tax_strategies').insert(strategiesToInsert);

  if (strategiesError) {
    console.error('   ✗ Error inserting strategies:', strategiesError);
    process.exit(1);
  }

  console.log(`   ✓ ${strategiesToInsert.length} tax strategies inserted\n`);

  // -------------------------------------------------------------------------
  // Step 6: Insert proactive queue items
  // -------------------------------------------------------------------------
  console.log('🔔 Inserting proactive queue items...');

  const alertsToInsert = [];
  for (const [entitySlugOrGlobal, alerts] of Object.entries(alertsByEntity)) {
    const entityId = entitySlugOrGlobal === 'global' ? null : entityIdMap[entitySlugOrGlobal];

    for (const alert of alerts) {
      alertsToInsert.push({
        entity_id: entityId,
        ...alert,
        status: 'open' as const,
      });
    }
  }

  const { error: alertsError } = await supabase.from('proactive_queue').insert(alertsToInsert);

  if (alertsError) {
    console.error('   ✗ Error inserting alerts:', alertsError);
    process.exit(1);
  }

  console.log(`   ✓ ${alertsToInsert.length} proactive queue items inserted\n`);

  // -------------------------------------------------------------------------
  // Step 7: Insert partners
  // -------------------------------------------------------------------------
  console.log('🤝 Inserting partners...');

  const partnersToInsert = partnersByEntitySlug.map((partner) => {
    // Convert entity slugs to IDs
    let entityIds: string[] | undefined;
    if (partner.entitySlugs.includes('all')) {
      // All entities
      entityIds = Object.values(entityIdMap);
    } else {
      entityIds = partner.entitySlugs
        .map((slug) => entityIdMap[slug])
        .filter(Boolean);
    }

    return {
      name: partner.name,
      role: partner.role,
      company: partner.company,
      email: partner.email,
      phone: partner.phone,
      entities: entityIds,
      notes: partner.notes,
      status: partner.status,
    };
  });

  const { data: insertedPartners, error: partnersError } = await supabase
    .from('partners')
    .insert(partnersToInsert)
    .select();

  if (partnersError) {
    console.error('   ✗ Error inserting partners:', partnersError);
    process.exit(1);
  }

  console.log(`   ✓ ${insertedPartners!.length} partners inserted\n`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('═'.repeat(50));
  console.log('✅ Seed completed successfully!');
  console.log('═'.repeat(50));
  console.log(`
Summary:
  • Entities:           ${insertedEntities!.length}
  • Accounts:           ${insertedAccounts!.length}
  • Knowledge Facts:    ${allFacts.length}
  • Tax Strategies:     ${strategiesToInsert.length}
  • Proactive Items:    ${alertsToInsert.length}
  • Partners:           ${insertedPartners!.length}
`);
}

// Run the seed
seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
