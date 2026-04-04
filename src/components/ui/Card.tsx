'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  animate?: boolean;
  delay?: number;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  animate = true,
  delay = 0,
}: CardProps) {
  const baseClass = `card ${hoverable ? 'card-hover' : ''} ${className}`;

  if (!animate) {
    return <div className={baseClass}>{children}</div>;
  }

  return (
    <motion.div
      className={baseClass}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      whileHover={hoverable ? { y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } : undefined}
    >
      {children}
    </motion.div>
  );
}

interface CardHeaderProps {
  title: string;
  label?: string;
  action?: ReactNode;
}

export function CardHeader({ title, label, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {label && <div className="section-label mb-1">{label}</div>}
        <h3 className="card-title">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
