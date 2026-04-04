/**
 * Tax Estimate API Route
 *
 * GET /api/tax-estimate - Get latest tax estimate or history
 * POST /api/tax-estimate - Create new tax estimate
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// ============================================================================
// GET /api/tax-estimate
// ============================================================================

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const url = new URL(request.url);
  const taxYear = url.searchParams.get('taxYear');
  const history = url.searchParams.get('history') === 'true';

  try {
    const year = taxYear ? parseInt(taxYear) : new Date().getFullYear();

    if (history) {
      // Get all estimates for the year
      const { data: estimates, error } = await supabase
        .from('tax_estimates')
        .select('*')
        .eq('tax_year', year)
        .order('as_of_date', { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        taxYear: year,
        estimates: estimates || [],
        count: estimates?.length || 0,
      });
    } else {
      // Get latest estimate
      const { data: estimate, error } = await supabase
        .from('tax_estimates')
        .select('*')
        .eq('tax_year', year)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        throw error;
      }

      if (!estimate) {
        return NextResponse.json({
          taxYear: year,
          estimate: null,
          message: 'No estimate found for this tax year',
        });
      }

      // Calculate status indicators
      const projectedLiability = estimate.projected_liability || 0;
      const status =
        projectedLiability > 5000
          ? 'owes'
          : projectedLiability < -1000
          ? 'refund'
          : 'balanced';

      return NextResponse.json({
        taxYear: year,
        estimate: {
          ...estimate,
          status,
          statusLabel:
            status === 'owes'
              ? `Projected to owe $${Math.abs(projectedLiability).toLocaleString()}`
              : status === 'refund'
              ? `Projected refund $${Math.abs(projectedLiability).toLocaleString()}`
              : 'Approximately balanced',
        },
      });
    }
  } catch (error) {
    console.error('Tax estimate GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/tax-estimate
// ============================================================================

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const {
      taxYear,
      grossIncome,
      totalDeductions,
      estimatedPayments = 0,
      withholding = 0,
      breakdown,
      notes,
    } = body;

    // Validate required fields
    if (!taxYear || grossIncome === undefined || totalDeductions === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: taxYear, grossIncome, totalDeductions' },
        { status: 400 }
      );
    }

    // Calculate taxable income and estimated tax
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Simple progressive tax calculation (2024 MFJ brackets)
    // This is simplified - real calculation would need more detail
    const taxBrackets = [
      { min: 0, max: 23200, rate: 0.1 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 },
    ];

    let estimatedTax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of taxBrackets) {
      if (remainingIncome <= 0) break;
      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max - bracket.min
      );
      estimatedTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    // Calculate projected liability
    const projectedLiability =
      estimatedTax - estimatedPayments - withholding;

    // Insert new estimate
    const { data: estimate, error } = await supabase
      .from('tax_estimates')
      .insert({
        tax_year: taxYear,
        as_of_date: new Date().toISOString().split('T')[0],
        gross_income: grossIncome,
        total_deductions: totalDeductions,
        taxable_income: taxableIncome,
        estimated_tax: Math.round(estimatedTax),
        estimated_payments: estimatedPayments,
        withholding: withholding,
        projected_liability: Math.round(projectedLiability),
        breakdown: breakdown || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      estimate: {
        ...estimate,
        status:
          projectedLiability > 5000
            ? 'owes'
            : projectedLiability < -1000
            ? 'refund'
            : 'balanced',
      },
    });
  } catch (error) {
    console.error('Tax estimate POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create estimate' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/tax-estimate - Update an estimate
// ============================================================================

export async function PATCH(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Estimate ID required' },
        { status: 400 }
      );
    }

    // Recalculate if income/deductions changed
    if (updates.gross_income !== undefined || updates.total_deductions !== undefined) {
      // Fetch current estimate to get missing values
      const { data: current } = await supabase
        .from('tax_estimates')
        .select('*')
        .eq('id', id)
        .single();

      if (current) {
        const grossIncome = updates.gross_income ?? current.gross_income;
        const totalDeductions = updates.total_deductions ?? current.total_deductions;
        const taxableIncome = Math.max(0, grossIncome - totalDeductions);

        // Recalculate tax (simplified)
        const taxBrackets = [
          { min: 0, max: 23200, rate: 0.1 },
          { min: 23200, max: 94300, rate: 0.12 },
          { min: 94300, max: 201050, rate: 0.22 },
          { min: 201050, max: 383900, rate: 0.24 },
          { min: 383900, max: 487450, rate: 0.32 },
          { min: 487450, max: 731200, rate: 0.35 },
          { min: 731200, max: Infinity, rate: 0.37 },
        ];

        let estimatedTax = 0;
        let remainingIncome = taxableIncome;

        for (const bracket of taxBrackets) {
          if (remainingIncome <= 0) break;
          const taxableInBracket = Math.min(
            remainingIncome,
            bracket.max - bracket.min
          );
          estimatedTax += taxableInBracket * bracket.rate;
          remainingIncome -= taxableInBracket;
        }

        const estimatedPayments = updates.estimated_payments ?? current.estimated_payments;
        const withholding = updates.withholding ?? current.withholding;
        const projectedLiability = estimatedTax - estimatedPayments - withholding;

        updates.taxable_income = taxableIncome;
        updates.estimated_tax = Math.round(estimatedTax);
        updates.projected_liability = Math.round(projectedLiability);
      }
    }

    const { data: estimate, error } = await supabase
      .from('tax_estimates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, estimate });
  } catch (error) {
    console.error('Tax estimate PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update estimate' },
      { status: 500 }
    );
  }
}
