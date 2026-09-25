export function PersenBadge({ value }: { value: number }) {
  const cls =
    value >= 90
      ? "bg-emerald-100 text-emerald-700"
      : value >= 75
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {value}%
    </span>
  );
}
