import type { DayState } from "@/lib/types";

const LABELS: Record<DayState, string> = {
  guncelleniyor: "Güncelleniyor",
  dogrulaniyor: "Doğrulanıyor",
  kesinlesti: "Kesinleşti",
};

const STYLES: Record<DayState, string> = {
  guncelleniyor: "bg-amber-50 text-amber-700 ring-amber-600/20",
  dogrulaniyor: "bg-blue-50 text-blue-700 ring-blue-600/20",
  kesinlesti: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export default function StatusBadge({ state, reason }: { state: DayState; reason?: string }) {
  return (
    <span
      title={reason}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  );
}
