import { useEffect, useMemo, useState } from "react";
import { FileDown, PhoneCall, Users, CheckCircle2, Building2, Loader2, AlertTriangle } from "lucide-react";
import { fetchSummary, pdfDownloadUrl, ApiConfigError } from "@/lib/api";
import { BRANDS, type SummaryResponse } from "@/lib/types";
import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const SCOPE_OPTIONS = ["PCDO", ...BRANDS] as const;

export default function SummaryReport() {
  const [brand, setBrand] = useState<string>("PCDO");
  const [from, setFrom] = useState(() => isoDaysAgo(13));
  const [to, setTo] = useState(() => isoDaysAgo(0));
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSummary(brand, from, to)
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiConfigError ? e.message : e instanceof Error ? e.message : "Rapor alınamadı");
        setData(null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [brand, from, to]);

  const days = useMemo(() => (data ? [...data.metrics.days].sort() : []), [data]);

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">TOFASCRM — Raporlar</h1>
            <p className="text-sm text-slate-500">PCDO lead/çağrı özeti</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              {SCOPE_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            />
            <a
              href={pdfDownloadUrl(brand, from, to)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              <FileDown className="h-4 w-4" /> PDF
            </a>
          </div>
        </header>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data && data.empty && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Bu aralıkta/markada veri yok.
          </div>
        )}

        {!loading && !error && data && !data.empty && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Gelen Lead" value={data.metrics.cum.gelen.toLocaleString("tr-TR")} icon={Users} />
              <StatCard label="Ulaşılan" value={data.metrics.cum.ul.toLocaleString("tr-TR")} icon={PhoneCall} />
              <StatCard label="Bayiye Yönlendirilen" value={data.metrics.cum.bay.toLocaleString("tr-TR")} icon={Building2} />
              <StatCard label="Kesinleşen Gün Sayısı" value={days.filter((d) => data.status[d]?.state === "kesinlesti").length} icon={CheckCircle2} />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Tarih</th>
                    <th className="px-4 py-2.5">Gelen</th>
                    <th className="px-4 py-2.5">Aranan</th>
                    <th className="px-4 py-2.5">Arama</th>
                    <th className="px-4 py-2.5">Ulaşılan</th>
                    <th className="px-4 py-2.5">Bayiye</th>
                    <th className="px-4 py-2.5">Açık</th>
                    <th className="px-4 py-2.5">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {days.map((d) => {
                    const row = data.metrics.daily[d];
                    const st = data.status[d];
                    return (
                      <tr key={d}>
                        <td className="px-4 py-2.5 font-medium">{d}</td>
                        <td className="px-4 py-2.5">{row?.gelen ?? 0}</td>
                        <td className="px-4 py-2.5">{row?.aranan ?? 0}</td>
                        <td className="px-4 py-2.5">{row?.arama ?? 0}</td>
                        <td className="px-4 py-2.5">{row?.ul ?? 0}</td>
                        <td className="px-4 py-2.5">{row?.bay ?? 0}</td>
                        <td className="px-4 py-2.5">{row?.acik ?? 0}</td>
                        <td className="px-4 py-2.5">
                          {st && <StatusBadge state={st.state} reason={st.reason} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
