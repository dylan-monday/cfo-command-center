import type { StrategyStatus, AlertPriority } from '@/types';
import { Briefcase, Home, Building, Mountain, User, type LucideIcon } from 'lucide-react';

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
  showIcon?: boolean;
}

export function EntityBadge({ slug, name, showIcon = true }: EntityBadgeProps) {
  // Entity icons by slug
  const iconMap: Record<string, LucideIcon> = {
    mp: Briefcase,     // M+P → work/business
    got: Home,         // GOT → rental property
    saratoga: Home,    // Saratoga → rental property
    nice: Building,    // Nice → apartment
    chippewa: Home,    // Chippewa → primary residence
    hvr: Mountain,     // Hidden Valley → land
    personal: User,    // Personal → person
  };

  const Icon = iconMap[slug];

  return (
    <span
      className="entity-tag inline-flex items-center gap-1"
      style={{ color: `var(--entity-${slug})` }}
    >
      {showIcon && Icon && <Icon className="w-3 h-3" />}
      {name || slug}
    </span>
  );
}
