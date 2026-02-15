function Skeleton({ className = '', width, height, rounded = 'rounded-xl' }) {
  return (
    <div
      className={`skeleton-pulse ${rounded} ${className}`}
      style={{ width, height, minHeight: height || 16, background: 'var(--c-subtle)' }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-inner rounded-2xl p-4 space-y-3">
      <Skeleton height={14} width="40%" />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <Skeleton key={i} height={12} width={`${60 + Math.random() * 30}%`} />
      ))}
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="led-panel rounded-none px-4 py-2 flex gap-6 overflow-hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-2 items-center shrink-0">
          <Skeleton width={40} height={12} rounded="rounded" />
          <Skeleton width={60} height={14} rounded="rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-inner rounded-2xl p-4 space-y-3">
      <Skeleton height={14} width="30%" />
      <div className="flex items-end gap-1 h-32">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="flex-1" height={`${30 + Math.random() * 70}%`} rounded="rounded-sm" />
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
