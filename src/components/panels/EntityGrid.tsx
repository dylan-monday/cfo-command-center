'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Card, CardHeader, EntityDot, SkeletonCard } from '@/components/ui';
import { ChevronRight, Building2 } from 'lucide-react';

interface EntityWithCounts {
  id: string;
  slug: string;
  name: string;
  type: string;
  tax_treatment: string;
  _counts: {
    accounts: number;
    strategies: number;
    openAlerts: number;
  };
}

export function EntityGrid() {
  const [entities, setEntities] = useState<EntityWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch('/api/entities');
        const data = await res.json();
        setEntities(data.entities || []);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEntities();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-text-muted" />
          <span className="section-label">Entity Map</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    's-corp': 'S-Corp',
    'partnership': 'Partnership',
    'personal': 'Personal',
    'rental-property': 'Rental',
    'primary-residence': 'Primary Residence',
    'foreign-property': 'Foreign Property',
    'vacant-land': 'Land',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-text-muted" />
        <span className="section-label">Entity Map</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entities.map((entity, index) => (
          <motion.div
            key={entity.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
          >
            <Link href={`/entity/${entity.slug}`}>
              <div className="card card-hover cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, var(--entity-${entity.slug}) 15%, transparent)` }}
                  >
                    <EntityDot slug={entity.slug} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="card-title truncate group-hover:text-accent transition-colors">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {typeLabels[entity.type] || entity.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entity._counts.openAlerts > 0 && (
                      <span className="badge badge-at-risk">
                        {entity._counts.openAlerts}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                  <div>
                    <div className="font-data text-lg font-semibold">{entity._counts.accounts}</div>
                    <div className="metric-label">Accounts</div>
                  </div>
                  <div>
                    <div className="font-data text-lg font-semibold">{entity._counts.strategies}</div>
                    <div className="metric-label">Strategies</div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
