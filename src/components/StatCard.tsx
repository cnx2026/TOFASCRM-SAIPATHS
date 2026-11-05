import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="rounded-lg bg-slate-50 p-2">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
