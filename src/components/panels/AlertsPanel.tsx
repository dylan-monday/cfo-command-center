'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  Check,
  AlarmClock,
  Loader2,
  X,
} from 'lucide-react';
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
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Action state
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showResolveNote, setShowResolveNote] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  // Fetch alerts function (extracted for reuse)
  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (entitySlug) params.set('entity', entitySlug);
      params.set('limit', limit.toString());

      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAlerts().finally(() => setLoading(false));
  }, [entitySlug, limit]);

  // Handle resolve action
  const handleResolve = async (alertId: string, note?: string) => {
    setActionLoading(alertId);
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertId,
          status: 'resolved',
          resolvedNote: note || undefined,
        }),
      });

      if (res.ok) {
        // Remove from local state
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        setShowResolveNote(null);
        setResolveNote('');
        setActiveItemId(null);
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle snooze action (7 days)
  const handleSnooze = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + 7);

      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertId,
          status: 'snoozed',
          dueDate: snoozeUntil.toISOString(),
        }),
      });

      if (res.ok) {
        // Remove from local state
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        setActiveItemId(null);
      }
    } catch (error) {
      console.error('Failed to snooze alert:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle discuss in chat
  const handleDiscuss = (alert: Alert) => {
    // Encode alert context for chat
    const context = encodeURIComponent(alert.message);
    const alertId = encodeURIComponent(alert.id);
    router.push(`/chat?alertId=${alertId}&context=${context}`);
  };

  const priorityDotClass: Record<AlertPriority, string> = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
    monitor: 'priority-monitor',
  };

  // Type labels that explain where alerts come from
  const typeLabels: Record<string, { label: string; description: string }> = {
    question: { label: 'Question', description: 'From document parsing' },
    alert: { label: 'Alert', description: 'System notification' },
    recommendation: { label: 'Suggestion', description: 'Proactive advice' },
    deadline: { label: 'Deadline', description: 'Due date approaching' },
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
              {alerts.map((alert, index) => {
                const isActive = activeItemId === alert.id;
                const isLoading = actionLoading === alert.id;
                const showNoteInput = showResolveNote === alert.id;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`alert-item group cursor-pointer transition-all ${
                      isActive ? 'ring-2 ring-accent/30 bg-accent-light/20' : ''
                    }`}
                    onClick={() => setActiveItemId(isActive ? null : alert.id)}
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
                        <span
                          className="badge badge-explore text-[10px] px-2 py-0.5"
                          title={typeLabels[alert.type]?.description || 'Action item'}
                        >
                          {typeLabels[alert.type]?.label || alert.type}
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

                      {/* Action buttons - show when item is active */}
                      <AnimatePresence>
                        {isActive && !showNoteInput && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowResolveNote(alert.id);
                                }}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-success hover:bg-success/90 rounded-md transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                Resolve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDiscuss(alert);
                                }}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent-light hover:bg-accent/10 rounded-md transition-colors disabled:opacity-50"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Discuss
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSnooze(alert.id);
                                }}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-alt hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <AlarmClock className="w-3 h-3" />
                                )}
                                Snooze 7d
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Resolve note input */}
                      <AnimatePresence>
                        {showNoteInput && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              <input
                                type="text"
                                placeholder="Resolution note (optional)"
                                value={resolveNote}
                                onChange={(e) => setResolveNote(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 text-sm bg-surface-alt border border-border rounded-md focus:outline-none focus:border-accent"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResolve(alert.id, resolveNote);
                                  }}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-success hover:bg-success/90 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Confirm
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowResolveNote(null);
                                    setResolveNote('');
                                  }}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text rounded-md transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Chevron - only show when not active */}
                    {!isActive && (
                      <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
