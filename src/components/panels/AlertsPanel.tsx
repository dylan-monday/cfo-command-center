'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import { AlertTriangle, Clock, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

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

  const hasAlerts = alerts.length > 0;
  const criticalCount = alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length;

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

  return (
    <div
      className={`card cursor-pointer transition-all ${
        hasAlerts ? 'hover:shadow-hover' : ''
      }`}
      onClick={() => hasAlerts && setExpanded(!expanded)}
    >
      {/* Collapsible header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasAlerts
                ? criticalCount > 0
                  ? 'bg-danger-light'
                  : 'bg-warning-light'
                : 'bg-success-light'
            }`}
          >
            {hasAlerts ? (
              <AlertTriangle
                className={`w-5 h-5 ${
                  criticalCount > 0 ? 'text-danger' : 'text-warning'
                }`}
              />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-text">Action Items</h3>
            <p className="text-sm text-text-muted">
              {hasAlerts
                ? `${alerts.length} open${criticalCount > 0 ? ` · ${criticalCount} urgent` : ''}`
                : 'All clear!'}
            </p>
          </div>
        </div>

        {hasAlerts && (
          <div className="flex items-center gap-2">
            <span className="badge badge-at-risk">{alerts.length} open</span>
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronRight className="w-5 h-5 text-text-muted" />
            )}
          </div>
        )}
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && hasAlerts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="alert-item group"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
