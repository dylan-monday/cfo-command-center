import type { StrategyStatus, AlertPriority } from '@/types';

interface StatusBadgeProps {
  status: StrategyStatus | 'deprecated';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusMap: Record<string, string> = {
    active: 'badge-active',
    'at-risk': 'badge-at-risk',
    review: 'badge-review',
    'not-started': 'badge-not-started',
    deprecated: 'badge-explore',
  };

  const displayMap: Record<string, string> = {
    active: 'active',
    'at-risk': 'at risk',
    review: 'review',
    'not-started': 'not started',
    deprecated: 'deprecated',
  };

  return (
    <span className={`badge ${statusMap[status] || ''}`}>
      {displayMap[status] || status}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: AlertPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityMap: Record<AlertPriority, string> = {
    critical: 'badge-at-risk',
    high: 'badge-at-risk',
    medium: 'badge-review',
    low: 'badge-explore',
    monitor: 'badge-explore',
  };

  return (
    <span className={`badge ${priorityMap[priority]}`}>
      {priority}
    </span>
  );
}

interface EntityBadgeProps {
  slug: string;
  name?: string;
}

export function EntityBadge({ slug, name }: EntityBadgeProps) {
  const colorMap: Record<string, string> = {
    mp: 'color-entity-mp',
    got: 'color-entity-got',
    saratoga: 'color-entity-saratoga',
    nice: 'color-entity-nice',
    chippewa: 'color-entity-chippewa',
    hvr: 'color-entity-hvr',
    personal: 'color-entity-personal',
  };

  return (
    <span
      className="entity-tag"
      style={{ color: `var(--entity-${slug})` }}
    >
      {name || slug}
    </span>
  );
}
