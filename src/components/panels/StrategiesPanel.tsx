'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader, StatusBadge, EntityBadge, SkeletonList } from '@/components/ui';
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

  const impactBadge: Record<StrategyImpact, string> = {
    high: 'bg-success-light text-success-text',
    medium: 'bg-warning-light text-warning-text',
    low: 'bg-surface-alt text-text-muted',
  };

  if (loading) {
    return (
      <Card animate={false}>
        <CardHeader label="Tax Optimization" title="Active Strategies" />
        <SkeletonList rows={4} />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader label="Tax Optimization" title="Active Strategies" />

      {/* Quick stats */}
      {stats && (
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
          <div>
            <span className="font-data text-sm font-medium text-success">
              {stats.byStatus.active}
            </span>
            <span className="text-xs text-text-muted ml-1">active</span>
          </div>
          <div>
            <span className="font-data text-sm font-medium text-danger">
              {stats.byStatus.atRisk}
            </span>
            <span className="text-xs text-text-muted ml-1">at risk</span>
          </div>
          <div>
            <span className="font-data text-sm font-medium text-warning">
              {stats.byStatus.review}
            </span>
            <span className="text-xs text-text-muted ml-1">review</span>
          </div>
          {stats.cpaFlagCount > 0 && (
            <div className="ml-auto">
              <span className="text-xs text-text-muted">
                <span className="font-data">{stats.cpaFlagCount}</span> CPA items
              </span>
            </div>
          )}
        </div>
      )}

      {/* Strategy list */}
      <div className="space-y-3">
        {strategies.length === 0 ? (
          <p className="text-text-muted text-sm">No strategies found.</p>
        ) : (
          strategies.map((strategy, index) => (
            <motion.div
              key={strategy.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-start gap-3"
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-data uppercase ${
                  impactBadge[strategy.impact]
                }`}
              >
                {strategy.impact}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{strategy.name}</span>
                  <StatusBadge status={strategy.status} />
                  {strategy.cpa_flag && (
                    <span className="text-[9px] font-data text-accent bg-accent-light px-1 rounded">
                      CPA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {strategy.entities && (
                    <EntityBadge slug={strategy.entities.slug} name={strategy.entities.name} />
                  )}
                  {strategy.estimated_savings && (
                    <>
                      <span className="text-text-faint">·</span>
                      <span className="small-data">
                        ~${strategy.estimated_savings.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  );
}
