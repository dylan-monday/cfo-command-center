interface EntityDotProps {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EntityDot({ slug, size = 'md' }: EntityDotProps) {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={`entity-dot ${sizeMap[size]}`}
      style={{ background: `var(--entity-${slug})` }}
    />
  );
}
