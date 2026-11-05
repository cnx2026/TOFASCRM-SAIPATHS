export default function StatCard({ label, value, hi, small, i = 0 }: { label: string; value: string; hi?: boolean; small?: boolean; i?: number }) {
  return (
    <div
      style={{ "--i": i } as React.CSSProperties}
      className={`tcrm-card-in tcrm-lift rounded-2xl ${hi ? "tcrm-glass-hi tcrm-glass-accent" : "tcrm-glass"} ${small ? "px-4 py-3" : "px-5 py-4"}`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-widest tcrm-text-muted ${small ? "" : "min-h-[30px]"}`}>{label}</p>
      <p className={`font-extrabold tracking-tight tabular-nums mt-1 ${small ? "text-xl" : "text-[28px] leading-none pt-1"} ${hi ? "tcrm-text-accent" : ""}`}>{value}</p>
    </div>
  );
}
