interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
}

export function Skeleton({ className = '', height, width }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton height={12} width="40%" className="mb-3" />
      <Skeleton height={28} width="60%" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton height={8} width={8} className="rounded-full" />
          <Skeleton height={16} className="flex-1" />
        </div>
      ))}
    </div>
  );
}
