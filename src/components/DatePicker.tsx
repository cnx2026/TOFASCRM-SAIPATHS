import { useRef, useState, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

/* Asıl panelden taşınmıştır (kaynak: cnx2026/TOFASCRM, tasarim-v2,
   src/components/ui/DatePicker.tsx) — Font Awesome yerine lucide-react. */

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_DAYS = ["Pt", "Sl", "Çr", "Pr", "Cu", "Ct", "Pz"];

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
}

function parseDateLocal(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function fmtDisplay(s: string): string {
  const d = parseDateLocal(s);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function DatePicker({ value, onChange, placeholder = "Tarih seçin", disabled = false, className = "", min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initView = () => {
    const d = parseDateLocal(value) ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  };
  const [view, setView] = useState(initView);

  useEffect(() => {
    if (open) setView(initView());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const firstDay = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() { setView((v) => { const d = new Date(v.year, v.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }); }
  function nextMonth() { setView((v) => { const d = new Date(v.year, v.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }); }
  function select(day: number) { const iso = toISO(view.year, view.month, day); onChange(iso); setOpen(false); }

  const display = fmtDisplay(value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 w-full pl-3 pr-2 py-2 bg-transparent text-sm font-bold outline-none transition-colors ${
          disabled ? "tcrm-text-muted opacity-50 cursor-default" : "text-[var(--tcrm-text)] cursor-pointer"
        }`}
      >
        <CalendarDays className={`h-3.5 w-3.5 shrink-0 ${disabled ? "tcrm-text-muted opacity-50" : "tcrm-text-accent"}`} />
        <span className={`flex-1 text-left truncate ${!display ? "tcrm-text-muted" : ""}`}>{display || placeholder}</span>
        <ChevronDown className={`h-3 w-3 tcrm-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-50 tcrm-glass-hi rounded-2xl p-3 w-64 select-none">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-xl tcrm-text-muted hover:bg-[var(--tcrm-surface)] hover:text-[var(--tcrm-text)] transition-colors">
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="text-sm font-black text-[var(--tcrm-text)] tracking-tight">{TR_MONTHS[view.month]} {view.year}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-xl tcrm-text-muted hover:bg-[var(--tcrm-surface)] hover:text-[var(--tcrm-text)] transition-colors">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {TR_DAYS.map((d) => <div key={d} className="text-center text-[10px] font-black tcrm-text-muted uppercase tracking-widest py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = toISO(view.year, view.month, day);
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              const off = (!!min && iso < min) || (!!max && iso > max);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={off}
                  onClick={() => select(day)}
                  className={`w-full aspect-square flex items-center justify-center text-xs rounded-xl transition-colors font-bold ${
                    off
                      ? "tcrm-text-muted opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "bg-[var(--tcrm-teal)] text-white"
                        : isToday
                          ? "tcrm-text-accent font-black hover:bg-[var(--tcrm-teal)]/10"
                          : "text-[var(--tcrm-text)] hover:bg-[var(--tcrm-teal)]/10 hover:tcrm-text-accent"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--tcrm-border)] flex justify-between items-center">
            <button
              type="button"
              onClick={() => { if ((min && todayISO < min) || (max && todayISO > max)) return; onChange(todayISO); setOpen(false); }}
              className="text-[11px] font-black tcrm-text-accent hover:opacity-70 transition-opacity"
            >
              Bugün
            </button>
            {value && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-[11px] font-black tcrm-text-muted hover:text-rose-500 transition-colors">
                Temizle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
