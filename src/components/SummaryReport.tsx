import { useEffect, useMemo, useState, useCallback } from "react";
import { FileText, Loader2 } from "lucide-react";
import { fetchSummary, pdfDownloadUrl, executiveDownloadUrl, ApiConfigError } from "@/lib/api";
import { BRANDS, type Brand, type DayState, type SummaryResponse } from "@/lib/types";
import DatePicker from "./DatePicker";
import { AreaChart, Ring, Skeleton } from "./Charts";
import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";

const nf = (n: number) => n.toLocaleString("tr-TR");
const pct = (a: number, b: number) => (b ? `%${((a / b) * 100).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : "–");
const f1 = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const dLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("tr-TR", { timeZone: "UTC", day: "2-digit", month: "short", weekday: "short" });

const STATE_TEXT: Record<DayState, string> = { guncelleniyor: "Güncelleniyor", dogrulaniyor: "Doğrulanıyor", kesinlesti: "Kesinleşti" };

// Sekmeler arası geçişte son hesaplanan rapor anında gösterilir; arka planda yenilenir.
const CACHE = new Map<string, SummaryResponse>();

export default function SummaryReport() {
  // Modül her zaman tüm markalara erişimli tek bir kimlikle çalışır (bkz. MODULE_API_TOKEN) — bu yüzden PCDO + tüm markalar her zaman gösterilir.
  const [brand, setBrand] = useState<Brand | "PCDO">("PCDO");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (b: Brand | "PCDO", f?: string, t?: string) => {
    const ck = `${b}|${f ?? ""}|${t ?? ""}`;
    const hit = CACHE.get(ck);
    if (hit) { setData(hit); if (!hit.empty) { setFrom(hit.from); setTo(hit.to); } }
    setLoading(!hit);
    setErr(null);
    try {
      const j = await fetchSummary(b, f ?? "", t ?? "");
      CACHE.set(ck, j);
      setData(j);
      if (!j.empty) { setFrom(j.from); setTo(j.to); }
    } catch (e) {
      setErr(e instanceof ApiConfigError ? e.message : e instanceof Error ? e.message : "Rapor alınamadı");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(brand); }, [brand, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const m = data?.metrics;
  const days = useMemo(() => (m ? [...m.days].sort() : []), [m]);
  const cum = m?.cum;

  const counts = useMemo(() => {
    const c: Record<DayState, number> = { guncelleniyor: 0, dogrulaniyor: 0, kesinlesti: 0 };
    for (const d of days) if (data?.status[d]) c[data.status[d].state]++;
    return c;
  }, [days, data]);

  const kpi = cum ? [
    { label: "Gelen Lead", value: nf(cum.gelen) },
    { label: "Aranan Lead", value: nf(cum.aranan) },
    { label: "Ulaşılan Lead", value: nf(cum.ul) },
    { label: "Ulaşım %", value: pct(cum.ul, cum.gelen), hi: true },
    { label: "Bayiye Yönlendirme", value: nf(cum.bay) },
    { label: "Bayiye Yönlendirme %", value: pct(cum.bay, cum.gelen), hi: true },
  ] : [];
  const fcC = m?.firstCall?.cum;
  const kpi2 = m && cum && fcC ? [
    { label: "Arama Adeti", value: nf(cum.arama) },
    { label: "Lead Başına Arama", value: cum.aranan ? f1(cum.arama / cum.aranan) : "–" },
    { label: "Ort. İlk Arama (sn)", value: f1(m.firstAvg?.cum ?? null) },
    { label: "30 sn İçinde Aranan", value: pct(fcC.le30, fcC.total) },
    { label: "AHT · 20 sn ve üzeri (sn)", value: f1(m.talk?.cum?.a20 ?? null) },
  ] : [];

  const inp = "px-3 py-2 rounded-xl tcrm-glass text-xs font-bold";
  const canExport = !!brand && !!from && !!to && from <= to;

  return (
    <div className="tcrm-root">
      <div className="tcrm-app-bg" />
      <div className="tcrm-content p-6 space-y-6">
        <header>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] tcrm-text-accent mb-1">Raporlar</p>
          <h2 className="text-2xl font-extrabold tracking-tight">TOFASCRM — Özet</h2>
          <p className="text-xs tcrm-text-muted font-medium mt-1 max-w-3xl">Yüklenen ham verilerden canlı hesaplanır. Her günün yanındaki durum, o günün rakamlarının değişip değişmeyeceğini gösterir.</p>
        </header>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => { setBrand("PCDO"); setFrom(""); setTo(""); }}
              disabled={loading}
              title="Tüm markaların kümülatif görünümü"
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest tcrm-pressable disabled:opacity-60 mr-1 ${
                brand === "PCDO" ? "bg-[var(--tcrm-teal)] text-[var(--tcrm-navy-deep)] shadow-[0_0_0_1px_rgba(46,216,195,.5),0_6px_18px_-6px_rgba(46,216,195,.6)]" : "tcrm-glass tcrm-text-muted hover:text-[var(--tcrm-text)]"
              }`}
            >
              PCDO
            </button>
            {BRANDS.map((b) => (
              <button
                key={b}
                onClick={() => { setBrand(b); setFrom(""); setTo(""); }}
                disabled={loading}
                className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest tcrm-pressable disabled:opacity-60 ${
                  brand === b ? "bg-[var(--tcrm-teal)] text-[var(--tcrm-navy-deep)] shadow-[0_0_0_1px_rgba(46,216,195,.5),0_6px_18px_-6px_rgba(46,216,195,.6)]" : "tcrm-glass tcrm-text-muted hover:text-[var(--tcrm-text)]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 ml-auto flex-wrap">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest tcrm-text-muted mb-1">Başlangıç</label>
              <DatePicker value={from} min={data?.range?.min} max={data?.range?.max} onChange={setFrom} placeholder="Tarih" className={inp + " !p-0 w-40"} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest tcrm-text-muted mb-1">Bitiş</label>
              <DatePicker value={to} min={data?.range?.min} max={data?.range?.max} onChange={setTo} placeholder="Tarih" className={inp + " !p-0 w-40"} />
            </div>
            <button
              onClick={() => load(brand, from, to)}
              disabled={loading || !from || !to || from > to}
              className="px-5 py-2.5 rounded-xl bg-[var(--tcrm-teal)] hover:brightness-110 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-widest tcrm-pressable"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Uygula"}
            </button>
            <div className="flex items-center gap-1 pl-2 ml-1 border-l border-[var(--tcrm-border)]">
              <span className="text-[9px] font-bold uppercase tracking-widest tcrm-text-muted mr-1">PDF</span>
              {([["detail", "Detail", pdfDownloadUrl], ["executive", "Executive", executiveDownloadUrl]] as const).map(([k, l, fn]) => (
                <a
                  key={k}
                  href={canExport ? fn(brand, from, to) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3.5 py-2.5 rounded-xl tcrm-glass hover:border-[var(--tcrm-border-hi)] text-xs font-extrabold uppercase tracking-widest tcrm-pressable inline-flex items-center gap-1.5 ${!canExport ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <FileText className="h-3.5 w-3.5 tcrm-text-accent" />{l}
                </a>
              ))}
            </div>
          </div>
        </div>

        {err && <p className="px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-400 text-sm font-bold">{err}</p>}

        {loading && !data && (
          <div className="space-y-4" aria-busy="true" aria-label="Rapor hesaplanıyor">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[92px]" />)}</div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4"><Skeleton className="h-72 xl:col-span-2" /><Skeleton className="h-72" /></div>
            <Skeleton className="h-64" />
          </div>
        )}

        {data?.empty && <div className="py-16 text-center tcrm-text-muted text-sm font-bold">{brand} için henüz yüklenmiş veri yok.</div>}

        {m && cum && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {kpi.map((k, i) => <StatCard key={k.label} {...k} i={i} />)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {kpi2.map((k, i) => <StatCard key={k.label} {...k} small i={i + 6} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="tcrm-glass rounded-3xl p-6 xl:col-span-2 tcrm-card-in" style={{ "--i": 11 } as React.CSSProperties}>
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-widest">Günlük Trend</h3>
                  <span className="text-[10px] font-bold tcrm-text-muted uppercase tracking-widest">{days.length} gün · {data?.brand}</span>
                </div>
                <AreaChart
                  labels={days.map(dLabel)}
                  short={(i) => new Date(`${days[i]}T00:00:00Z`).toLocaleDateString("tr-TR", { timeZone: "UTC", day: "2-digit", month: "short" })}
                  series={[
                    { key: "gelen", label: "Gelen", color: "#2ED8C3", values: days.map((d) => m.daily[d]?.gelen ?? 0) },
                    { key: "ul", label: "Ulaşılan", color: "#7CC8F0", values: days.map((d) => m.daily[d]?.ul ?? 0) },
                    { key: "bay", label: "Bayiye Yönlendirme", color: "#FBCA18", values: days.map((d) => m.daily[d]?.bay ?? 0) },
                  ]}
                />
              </div>
              <div className="tcrm-glass rounded-3xl p-6 tcrm-card-in" style={{ "--i": 12 } as React.CSSProperties}>
                <h3 className="font-extrabold text-sm uppercase tracking-widest mb-5">Dönüşüm</h3>
                <div className="grid grid-cols-2 gap-x-2 gap-y-5">
                  <Ring ratio={cum.gelen ? cum.ul / cum.gelen : 0} label="Ulaşım" color="#2ED8C3" sub="/ GELEN" />
                  <Ring ratio={cum.gelen ? cum.bay / cum.gelen : 0} label="Bayiye Yön." color="#FBCA18" sub="/ GELEN" />
                  <Ring ratio={cum.aranan && cum.gelen ? cum.aranan / cum.gelen : 0} label="Aranan" color="#7CC8F0" sub="/ GELEN" />
                  <Ring ratio={fcC && fcC.total ? fcC.le30 / fcC.total : 0} label="30 sn İçinde" color="#6AE6D6" sub="≤ 30 SN" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              {(Object.keys(STATE_TEXT) as DayState[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <StatusBadge state={s} />
                  <span className="tcrm-text-muted">{counts[s]} gün</span>
                </span>
              ))}
              {(counts.guncelleniyor + counts.dogrulaniyor) > 0 && (
                <span className="tcrm-text-muted">Toplamlar tüm günleri içerir; Güncelleniyor/Doğrulanıyor günlerin rakamları değişebilir.</span>
              )}
            </div>

            <div className="tcrm-glass rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--tcrm-border)]">
                <h3 className="font-extrabold text-sm uppercase tracking-widest">Günlük Dağılım · {data?.brand}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--tcrm-surface)] text-[10px] font-extrabold uppercase tracking-widest tcrm-text-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Gün</th><th className="px-4 py-3 text-left">Durum</th>
                      <th className="px-4 py-3 text-center">Gelen</th>
                      <th className="px-4 py-3 text-center" title="Gelen leadlerden CRM'de henüz sonuçlanmamış (kapanış sonucu ve tarihi yok) olanlar; Fuzul Ev ve Ç. M. Gelen Aday hariç">Sonuçlanmayan</th>
                      <th className="px-4 py-3 text-center">Bayiye Yönlendirme</th><th className="px-4 py-3 text-center">Bayiye Yönlendirme %</th>
                      <th className="px-4 py-3 text-center">Aranan</th><th className="px-4 py-3 text-center">Ulaşılan</th><th className="px-4 py-3 text-center">Ulaşım %</th>
                      <th className="px-4 py-3 text-center">Arama Adeti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tcrm-border)]">
                    {days.map((d) => {
                      const r = m.daily[d], st = data?.status[d];
                      if (!r) return null;
                      return (
                        <tr key={d} className="hover:bg-[var(--tcrm-teal)]/[0.06] transition-colors">
                          <td className="px-4 py-2.5 font-bold whitespace-nowrap">{dLabel(d)}</td>
                          <td className="px-4 py-2.5">{st && <StatusBadge state={st.state} reason={st.reason} />}</td>
                          <td className="px-4 py-2.5 text-center">{nf(r.gelen)}</td><td className="px-4 py-2.5 text-center tcrm-text-muted">{nf(r.acik)}</td>
                          <td className="px-4 py-2.5 text-center">{nf(r.bay)}</td><td className="px-4 py-2.5 text-center font-bold">{pct(r.bay, r.gelen)}</td>
                          <td className="px-4 py-2.5 text-center">{nf(r.aranan)}</td><td className="px-4 py-2.5 text-center">{nf(r.ul)}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{pct(r.ul, r.gelen)}</td>
                          <td className="px-4 py-2.5 text-center">{nf(r.arama)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[var(--tcrm-surface)] font-black border-t border-[var(--tcrm-border-hi)]">
                      <td className="px-4 py-3" colSpan={2}>Toplam</td>
                      <td className="px-4 py-3 text-center">{nf(cum.gelen)}</td><td className="px-4 py-3 text-center">{nf(cum.acik)}</td>
                      <td className="px-4 py-3 text-center">{nf(cum.bay)}</td><td className="px-4 py-3 text-center">{pct(cum.bay, cum.gelen)}</td>
                      <td className="px-4 py-3 text-center">{nf(cum.aranan)}</td><td className="px-4 py-3 text-center">{nf(cum.ul)}</td>
                      <td className="px-4 py-3 text-center">{pct(cum.ul, cum.gelen)}</td>
                      <td className="px-4 py-3 text-center">{nf(cum.arama)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-2.5 border-t border-[var(--tcrm-border)] text-[10px] tcrm-text-muted font-bold">
                Gelen: mükerrer hariç, lead oluşturulma günü · Sonuçlanmayan: o gün gelen ve CRM'de henüz kapanış sonucu/tarihi olmayan lead (Fuzul Ev ve Ç. M. Gelen Aday hariç) · Bayiye Yönlendirme: kapanış gününe göre · Ulaşım %: en az bir cevaplanan çağrısı olan lead ÷ Gelen · Arama Adeti: yapılan toplam arama.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
