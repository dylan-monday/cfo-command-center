'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader, StatusBadge, EntityBadge, SkeletonList } from '@/components/ui';
import { Target, TrendingUp, Flag, ChevronRight } from 'lucide-react';
import type { StrategyStatus, StrategyImpact } from '@/types';

interface Strategy {
  id: string;
  name: string;
  status: StrategyStatus;
  impact: StrategyImpact;
  description: string;
  estimated_savings: number | null;
  cpa_flag: boolean;
  entities?: { slug: string; name: string };
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

interface StrategiesPanelProps {
  entitySlug?: string | null;
  limit?: number;
}

export function StrategiesPanel({ entitySlug, limit = 5 }: StrategiesPanelProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStrategies() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (entitySlug) params.set('entity', entitySlug);

        const res = await fetch(`/api/strategies?${params}`);
        const data = await res.json();
        setStrategies((data.strategies || []).slice(0, limit));
        setStats(data.stats || null);
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStrategies();
  }, [entitySlug, limit]);

  const impactStyles: Record<StrategyImpact, { badge: string; icon: string }> = {
    high: {
      badge: 'bg-success-light text-success-text border border-success/20',
      icon: 'text-success',
    },
    medium: {
      badge: 'bg-warning-light text-warning-text border border-warning/20',
      icon: 'text-warning',
    },
    low: {
      badge: 'bg-surface-alt text-text-muted border border-border',
      icon: 'text-text-muted',
    },
  };

  if (loading) {
    return (
      <Card animate={false}>
        <CardHeader
          label="Tax Optimization"
          title="Active Strategies"
          action={<Target className="w-5 h-5 text-text-muted" />}
        />
        <SkeletonList rows={4} />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        label="Tax Optimization"
        title="Active Strategies"
        action={<Target className="w-5 h-5 text-accent" />}
      />

      {/* Quick stats bar */}
      {stats && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="font-data text-sm font-semibold">{stats.byStatus.active}</span>
              <span className="text-xs text-text-muted">active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-danger" />
              <span className="font-data text-sm font-semibold">{stats.byStatus.atRisk}</span>
              <span className="text-xs text-text-muted">at risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="font-data text-sm font-semibold">{stats.byStatus.review}</span>
              <span className="text-xs text-text-muted">review</span>
            </div>
          </div>
          {stats.cpaFlagCount > 0 && (
            <div className="flex items-center gap-1 text-accent">
              <Flag className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{stats.cpaFlagCount} CPA</span>
            </div>
          )}
        </div>
      )}

      {/* Strategy list */}
      <div className="space-y-2">
        {strategies.length === 0 ? (
          <div className="text-center py-6">
            <Target className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-sm">No strategies found.</p>
          </div>
        ) : (
          strategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-3 rounded-lg border border-border hover:border-border-active hover:bg-surface-hover transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                  strategy.impact === 'high' ? 'bg-success-light' :
                  strategy.impact === 'medium' ? 'bg-warning-light' : 'bg-surface-alt'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${impactStyles[strategy.impact].icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate">{strategy.name}</span>
                    <StatusBadge status={strategy.status} />
                    {strategy.cpa_flag && (
                      <span className="badge text-[10px] px-2 py-0.5 bg-accent-light text-accent-text">
                        CPA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {strategy.entities && (
                      <EntityBadge slug={strategy.entities.slug} name={strategy.entities.name} />
                    )}
                    {strategy.estimated_savings && (
                      <>
                        <span className="text-text-faint">·</span>
                        <span className="text-xs font-medium text-success">
                          ~${strategy.estimated_savings.toLocaleString()} savings
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  );
}
