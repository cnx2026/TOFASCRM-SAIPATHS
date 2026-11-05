import SummaryReport from "./components/SummaryReport";

/**
 * Sanalyzer modül giriş noktası.
 *
 * Bu bileşen, Sanalyzer'ın kendi sayfa çatısının (sidebar/header) İÇİNE
 * mount edilmek üzere tasarlandı: kendi <html>/<body>'si, kendi
 * router'ı, kendi login ekranı yok. Sadece içerik alanını dolduran
 * bir React bileşeni.
 *
 * Veri: TOFASCRM'in kendi (private) API'sine, sabit bir okuma-amaçlı
 * token ile bağlanır (bkz. src/lib/api.ts). Hiçbir iş mantığı, veri
 * tabanı bağlantısı veya kimlik doğrulama kodu burada yok.
 */
export default function App() {
  return <SummaryReport />;
}
