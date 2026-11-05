// TOFASCRM backend'indeki gerçek tiplerle birebir eşleşir
// (kaynak: cnx2026/tofascrm — src/lib/metrics/types.ts, src/types/index.ts).
// Burada sadece arayüzün ihtiyaç duyduğu alt küme tutulur.

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

export interface Metrics {
  days: string[];
  daily: Record<string, DayRow>;
  cum: DayRow;
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
