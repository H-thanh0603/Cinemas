export function Rating({
  value,
  count,
}: {
  value: number;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-amber-400">★</span>
      <span className="text-surface-200 font-medium">{value.toFixed(1)}</span>
      {count != null && (
        <span className="text-surface-500">({count})</span>
      )}
    </div>
  );
}
