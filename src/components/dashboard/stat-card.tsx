type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  accent?: "brand" | "accent" | "danger";
};

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "text-[hsl(var(--color-brand))]",
  accent: "text-[hsl(var(--color-accent))]",
  danger: "text-[hsl(var(--color-danger))]",
};

export function StatCard({
  title,
  value,
  description,
  accent = "brand",
}: StatCardProps) {
  return (
    <div className="glass-panel flex flex-col gap-2 px-5 py-4">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`text-3xl font-semibold ${accentMap[accent]}`}>{value}</p>
      {description ? (
        <p className="text-xs text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
