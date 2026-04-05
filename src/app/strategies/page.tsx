'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, StatusBadge, EntityBadge, SkeletonList } from '@/components/ui';
import { Target, TrendingUp, Flag, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import type { StrategyStatus, StrategyImpact } from '@/types';

interface Strategy {
  id: string;
  name: string;
  status: StrategyStatus;
  impact: StrategyImpact;
  description: string;
  action_required: string | null;
  estimated_savings: number | null;
  cpa_flag: boolean;
  tax_year: number | null;
  entities?: { slug: string; name: string; color: string };
}

interface Stats {
  total: number;
  byStatus: {
    active: number;
    atRisk: number;
    review: number;
    notStarted: number;
  };
  totalEstimatedSavings: number;
  cpaFlagCount: number;
}

type FilterStatus = StrategyStatus | 'all';
type FilterImpact = StrategyImpact | 'all';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [impactFilter, setImpactFilter] = useState<FilterImpact>('all');
  const [cpaOnly, setCpaOnly] = useState(false);

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (impactFilter !== 'all') params.set('impact', impactFilter);
      if (cpaOnly) params.set('cpaOnly', 'true');

      const res = await fetch(`/api/strategies?${params}`);
      const data = await res.json();
      setStrategies(data.strategies || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, impactFilter, cpaOnly]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const impactStyles: Record<StrategyImpact, { badge: string; icon: string; bg: string }> = {
    high: {
      badge: 'bg-success-light text-success-text border border-success/20',
      icon: 'text-success',
      bg: 'bg-success-light',
    },
    medium: {
      badge: 'bg-warning-light text-warning-text border border-warning/20',
      icon: 'text-warning',
      bg: 'bg-warning-light',
    },
    low: {
      badge: 'bg-surface-alt text-text-muted border border-border',
      icon: 'text-text-muted',
      bg: 'bg-surface-alt',
    },
  };

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'at-risk', label: 'At Risk' },
    { value: 'review', label: 'Review' },
    { value: 'not-started', label: 'Not Started' },
  ];

  const impactOptions: { value: FilterImpact; label: string }[] = [
    { value: 'all', label: 'All Impact' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Tax Strategies</h1>
        <p className="text-text-secondary mt-2">
          Your active tax optimization strategies across all entities
        </p>
      </motion.div>

      {/* Stats bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="p-4 bg-surface border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-text-muted font-data uppercase tracking-wider">Active</span>
            </div>
            <span className="text-2xl font-semibold font-data">{stats.byStatus.active}</span>
          </div>
          <div className="p-4 bg-surface border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-danger" />
              <span className="text-xs text-text-muted font-data uppercase tracking-wider">At Risk</span>
            </div>
            <span className="text-2xl font-semibold font-data">{stats.byStatus.atRisk}</span>
          </div>
          <div className="p-4 bg-surface border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs text-text-muted font-data uppercase tracking-wider">Review</span>
            </div>
            <span className="text-2xl font-semibold font-data">{stats.byStatus.review}</span>
          </div>
          <div className="p-4 bg-surface border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3 h-3 text-accent" />
              <span className="text-xs text-text-muted font-data uppercase tracking-wider">Est. Savings</span>
            </div>
            <span className="text-2xl font-semibold font-data text-accent">
              ${stats.totalEstimatedSavings.toLocaleString()}
            </span>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 text-text-muted">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-data uppercase tracking-wider">Filters</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
          className="px-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={impactFilter}
          onChange={(e) => setImpactFilter(e.target.value as FilterImpact)}
          className="px-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
        >
          {impactOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cpaOnly}
            onChange={(e) => setCpaOnly(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-secondary">CPA Items Only</span>
        </label>

        {(statusFilter !== 'all' || impactFilter !== 'all' || cpaOnly) && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setImpactFilter('all');
              setCpaOnly(false);
            }}
            className="text-xs text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Strategy list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card animate={false}>
          <CardHeader
            label="Tax Optimization"
            title={`${strategies.length} Strategies`}
            action={<Target className="w-5 h-5 text-accent" />}
          />

          {loading ? (
            <SkeletonList rows={6} />
          ) : strategies.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No strategies found</p>
              <p className="text-text-muted text-sm mt-1">
                {statusFilter !== 'all' || impactFilter !== 'all' || cpaOnly
                  ? 'Try adjusting your filters'
                  : 'Add strategies to track your tax optimization'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {strategies.map((strategy, index) => {
                  const isExpanded = expandedId === strategy.id;
                  return (
                    <motion.div
                      key={strategy.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isExpanded
                          ? 'border-accent/30 bg-accent-light/30'
                          : 'border-border hover:border-border-active hover:bg-surface-hover'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : strategy.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Impact indicator */}
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                            impactStyles[strategy.impact].bg
                          }`}
                        >
                          <TrendingUp className={`w-5 h-5 ${impactStyles[strategy.impact].icon}`} />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{strategy.name}</span>
                            <StatusBadge status={strategy.status} />
                            {strategy.cpa_flag && (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-accent-light text-accent-text rounded font-data">
                                <Flag className="w-3 h-3" />
                                CPA
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {strategy.entities && (
                              <EntityBadge
                                slug={strategy.entities.slug}
                                name={strategy.entities.name}
                              />
                            )}
                            {strategy.estimated_savings && (
                              <>
                                <span className="text-text-faint">·</span>
                                <span className="text-xs font-data font-medium text-success">
                                  ~${strategy.estimated_savings.toLocaleString()} savings
                                </span>
                              </>
                            )}
                            {strategy.tax_year && (
                              <>
                                <span className="text-text-faint">·</span>
                                <span className="text-xs font-data text-text-muted">
                                  TY{strategy.tax_year}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-border space-y-3">
                                  <div>
                                    <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                      Description
                                    </span>
                                    <p className="text-sm text-text-secondary mt-1">
                                      {strategy.description}
                                    </p>
                                  </div>
                                  {strategy.action_required && (
                                    <div>
                                      <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                        Action Required
                                      </span>
                                      <p className="text-sm text-warning-text mt-1">
                                        {strategy.action_required}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Expand/collapse indicator */}
                        <div className="flex-shrink-0 mt-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-accent" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
