import { RotateCw, Search, CheckCircle2 } from "lucide-react";
import type { DayState } from "@/lib/types";

const LABELS: Record<DayState, string> = {
  guncelleniyor: "Güncelleniyor",
  dogrulaniyor: "Doğrulanıyor",
  kesinlesti: "Kesinleşti",
};

const STYLES: Record<DayState, string> = {
  guncelleniyor: "bg-[var(--tcrm-yellow)]/15 text-[var(--tcrm-yellow)] ring-1 ring-[var(--tcrm-yellow)]/30",
  dogrulaniyor: "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/25",
  kesinlesti: "bg-[var(--tcrm-teal)]/12 tcrm-text-accent ring-1 ring-[var(--tcrm-teal)]/30",
};

const ICONS: Record<DayState, typeof RotateCw> = {
  guncelleniyor: RotateCw,
  dogrulaniyor: Search,
  kesinlesti: CheckCircle2,
};

export default function StatusBadge({ state, reason }: { state: DayState; reason?: string }) {
  const Icon = ICONS[state];
  return (
    <span title={reason} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black whitespace-nowrap ${STYLES[state]}`}>
      <Icon className="h-2.5 w-2.5" />
      {LABELS[state]}
    </span>
  );
}
