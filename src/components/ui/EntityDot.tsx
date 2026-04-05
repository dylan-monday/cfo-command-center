interface EntityDotProps {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EntityDot({ slug, size = 'md' }: EntityDotProps) {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={`${size === 'lg' ? 'entity-dot-lg' : 'entity-dot'} ${sizeMap[size]}`}
      style={{ background: `var(--entity-${slug})` }}
    />
  );
}
