// TOFASCRM backend'indeki gerçek tiplerle birebir eşleşir
// (kaynak: cnx2026/tofascrm — src/lib/metrics/types.ts, src/types/index.ts).

export const BRANDS = ["Peugeot", "Citroen", "DS", "Opel"] as const;
export type Brand = (typeof BRANDS)[number];

export interface DayRow {
  gelen: number;
  aranan: number;
  arama: number;
  ul: number;
  bay: number;
  acik: number;
}

export type DayState = "guncelleniyor" | "dogrulaniyor" | "kesinlesti";
export interface DayStatus {
  state: DayState;
  reason: string;
}

export interface TalkStat { n: number; all: number | null; a20: number | null; n20: number; bins: number[] }
export interface FirstCall { le30: number; s30_60: number; gt60: number; off: number; total: number }

export interface Metrics {
  days: string[];
  daily: Record<string, DayRow>;
  cum: DayRow;
  firstCall: Record<string, FirstCall>;
  firstAvg: Record<string, number | null>;
  talk: Record<string, TalkStat>;
  leadTotal: number;
  reached: number;
  // Rapor özetinde kullanılmayan diğer alanlar (hourly, sources, vb.) kasıtlı olarak atlandı.
  [key: string]: unknown;
}

export interface SummaryResponse {
  brand: string;
  scope: Brand[];
  range: { min: string; max: string };
  from: string;
  to: string;
  brands: Brand[];
  metrics: Metrics;
  status: Record<string, DayStatus>;
  leadCount: number;
  callCount: number;
  empty?: boolean;
  error?: string;
}
