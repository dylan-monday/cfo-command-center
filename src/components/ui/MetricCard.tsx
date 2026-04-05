'use client';

import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  variant?: 'default' | 'gradient' | 'accent' | 'success' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  format = 'number',
  variant = 'default',
  trend,
  trendValue,
  delay = 0,
  icon,
}: MetricCardProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 });

  const display = useTransform(spring, (v) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(v);
    }
    if (format === 'percent') {
      return `${Math.round(v)}%`;
    }
    return Math.round(v).toLocaleString();
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const variantStyles: Record<string, { card: string; text: string; label: string }> = {
    default: {
      card: 'card',
      text: 'text-text',
      label: 'text-text-muted',
    },
    gradient: {
      card: 'card-gradient',
      text: 'text-text-on-gradient',
      label: 'text-text-on-gradient/70',
    },
    accent: {
      card: 'card-accent',
      text: 'text-white',
      label: 'text-white/70',
    },
    success: {
      card: 'card-success',
      text: 'text-white',
      label: 'text-white/70',
    },
    warning: {
      card: 'bg-warning-light border border-warning/20 rounded-[var(--radius-lg)] p-6',
      text: 'text-warning-text',
      label: 'text-warning-text/70',
    },
    danger: {
      card: 'card-danger',
      text: 'text-white',
      label: 'text-white/70',
    },
  };

  const styles = variantStyles[variant];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted';

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`metric-label ${styles.label}`}>{label}</span>
        {icon && (
          <span className={styles.label}>{icon}</span>
        )}
      </div>
      <motion.div className={`metric-value ${styles.text}`}>
        {display}
      </motion.div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 ${variant === 'default' ? trendColor : styles.label}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}
