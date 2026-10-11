export function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-3 overflow-hidden rounded-full bg-line"
    >
      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
