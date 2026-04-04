'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import type { AlertPriority } from '@/types';

interface Alert {
  id: string;
  type: string;
  priority: AlertPriority;
  message: string;
  due_date: string | null;
  entities?: { slug: string; name: string } | null;
}

interface AlertsPanelProps {
  entitySlug?: string | null;
  limit?: number;
}

export function AlertsPanel({ entitySlug, limit = 5 }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (entitySlug) params.set('entity', entitySlug);
        params.set('limit', limit.toString());

        const res = await fetch(`/api/alerts?${params}`);
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, [entitySlug, limit]);

  const priorityDotClass: Record<AlertPriority, string> = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
    monitor: 'priority-monitor',
  };

  if (loading) {
    return (
      <Card animate={false}>
        <CardHeader label="Needs Your Attention" title="Action Items" />
        <SkeletonList rows={3} />
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader label="Needs Your Attention" title="Action Items" />
        <p className="text-text-muted text-sm">No open alerts. Nice work!</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader label="Needs Your Attention" title="Action Items" />
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ delay: index * 0.05 }}
              className={`alert-item ${
                alert.priority === 'critical' || alert.priority === 'high'
                  ? 'bg-danger-light -mx-4 px-4 border-l-2 border-l-danger'
                  : ''
              }`}
            >
              <span className={`priority-dot ${priorityDotClass[alert.priority]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text leading-snug">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  {alert.entities && (
                    <EntityBadge slug={alert.entities.slug} name={alert.entities.name} />
                  )}
                  <span className="text-text-faint">·</span>
                  <span className="text-xs text-text-muted">{alert.type}</span>
                  {alert.due_date && (
                    <>
                      <span className="text-text-faint">·</span>
                      <span className="small-data">
                        {new Date(alert.due_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
