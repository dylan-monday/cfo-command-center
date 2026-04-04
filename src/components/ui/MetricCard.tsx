'use client';

import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { Card } from './Card';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  delay?: number;
}

export function MetricCard({
  label,
  value,
  format = 'number',
  variant = 'default',
  delay = 0,
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

  const colorMap: Record<string, string> = {
    default: 'var(--text)',
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
  };

  return (
    <Card delay={delay}>
      <div className="metric-label mb-2">{label}</div>
      <motion.div
        className="metric-value"
        style={{ color: colorMap[variant] }}
      >
        {display}
      </motion.div>
    </Card>
  );
}
