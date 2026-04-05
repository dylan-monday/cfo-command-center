'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
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
        <CardHeader
          label="Needs Your Attention"
          title="Action Items"
          action={<AlertTriangle className="w-5 h-5 text-text-muted" />}
        />
        <SkeletonList rows={3} />
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader
          label="Needs Your Attention"
          title="Action Items"
          action={<AlertTriangle className="w-5 h-5 text-success" />}
        />
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-success-light mx-auto mb-3 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-success" />
            </div>
            <p className="text-text-secondary font-medium">All clear!</p>
            <p className="text-text-muted text-sm mt-1">No open alerts. Nice work!</p>
          </div>
        </div>
      </Card>
    );
  }

  const isUrgent = (priority: AlertPriority) =>
    priority === 'critical' || priority === 'high';

  return (
    <Card>
      <CardHeader
        label="Needs Your Attention"
        title="Action Items"
        action={
          <span className="badge badge-at-risk">
            {alerts.length} open
          </span>
        }
      />
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ delay: index * 0.05 }}
              className={`alert-item cursor-pointer group ${
                isUrgent(alert.priority) ? 'alert-item-urgent' : ''
              }`}
            >
              <span className={`priority-dot ${priorityDotClass[alert.priority]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text leading-snug font-medium">
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {alert.entities && (
                    <EntityBadge slug={alert.entities.slug} name={alert.entities.name} />
                  )}
                  <span className="text-text-faint">·</span>
                  <span className="badge badge-explore text-[10px] px-2 py-0.5">
                    {alert.type}
                  </span>
                  {alert.due_date && (
                    <>
                      <span className="text-text-faint">·</span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.due_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
