import type { SummaryResponse } from "./types";

// Bu iki değer Sanalyzer'ın kendi build sürecinde (Vite env) tanımlanmalı.
// VITE_ ön eki olmayan değişkenler tarayıcı paketine hiç girmez (Vite kuralı).
const API_BASE = import.meta.env.VITE_TOFASCRM_API_URL as string | undefined;
const MODULE_TOKEN = import.meta.env.VITE_TOFASCRM_MODULE_TOKEN as string | undefined;

export class ApiConfigError extends Error {}

function getConfig(): { base: string; token: string } {
  if (!API_BASE || !MODULE_TOKEN) {
    throw new ApiConfigError(
      "VITE_TOFASCRM_API_URL ve VITE_TOFASCRM_MODULE_TOKEN tanımlı değil. " +
        "Bu modülü barındıran platformun build ortamında bu iki değişken ayarlanmalı."
    );
  }
  return { base: API_BASE, token: MODULE_TOKEN };
}

async function get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const { base, token } = getConfig();
  const qs = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined)
  );
  const res = await fetch(`${base}${path}?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `İstek başarısız (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Özet rapor: marka (veya "PCDO") + tarih aralığı → gün bazlı ve toplam metrikler + gün durumu. */
export function fetchSummary(brand: string, from: string, to: string) {
  return get<SummaryResponse>("/api/reports/summary", { brand, from, to });
}

/** TOFASCRM'in Detail PDF export uç noktasının doğrudan indirme linki (yeni sekmede açılır). */
export function pdfDownloadUrl(brand: string, from: string, to: string): string {
  // Render sırasında fırlatmamak için burada sessizce "#" döner; asıl yapılandırma
  // hatası zaten özet rapor isteği (fetchSummary) üzerinden kullanıcıya gösterilir.
  if (!API_BASE || !MODULE_TOKEN) return "#";
  // PDF uç noktası tarayıcıdan doğrudan <a href> ile açıldığı için Authorization
  // header'ı taşınamaz; token bu yüzden query param olarak gönderilir (backend
  // tarafında /api/reports/* için bu şekilde de kabul ediliyor — aynı dar kapsam).
  const qs = new URLSearchParams({ brand, from, to, token: MODULE_TOKEN });
  return `${API_BASE}/api/reports/pdf?${qs.toString()}`;
}
