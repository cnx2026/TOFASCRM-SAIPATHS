# TOFASCRM — Sanalyzer Modülü

TOFASCRM raporlarının Sanalyzer platformuna **modül** olarak eklenmiş arayüzü.

## Bu repo ne içerir, ne içermez

- **İçerir:** sadece ekrana çizilen kısım — React bileşenleri, Tailwind stilleri.
- **İçermez:** veritabanı bağlantısı, iş kuralları, kullanıcı girişi/kimlik doğrulama,
  KVKK maskeleme, veri girişi mantığı. Bunların hepsi `cnx2026/TOFASCRM` (private)
  repo'sunda kalır ve hiç değişmedi. Bu modül, verisini TOFASCRM'in **zaten çalışan**
  API'sine (`/api/reports/*`) HTTPS üzerinden `fetch` ile çeker.

## Entegrasyon için gerekli iki ortam değişkeni

Bu modülü barındıran platformun (Sanalyzer) **build zamanında** şu iki değişkeni
tanımlaması gerekir (bkz. `.env.example`):

| Değişken | Açıklama |
|---|---|
| `VITE_TOFASCRM_API_URL` | TOFASCRM'in canlı Vercel adresi |
| `VITE_TOFASCRM_MODULE_TOKEN` | TOFASCRM backend'indeki `MODULE_API_TOKEN` ile aynı değer |

`VITE_` ön eki olmayan değişkenler Vite tarafından tarayıcı paketine hiç dahil
edilmez — bu yüzden isimler birebir bu şekilde kalmalı.

## Güvenlik notu (önemli)

Bu bir SPA (Vite) modülü olduğu için, yukarıdaki token derlenen JavaScript
dosyasının içinde düz metin olarak bulunur — tarayıcı geliştirici araçlarıyla
görülebilir. Bu riski azaltmak için token'ın yetkisi TOFASCRM backend'inde
**bilerek** sadece `/api/reports/*` (salt-okunur rapor) uçlarıyla sınırlandı;
kullanıcı yönetimi, veri girişi gibi hassas uçlarda bu token hiçbir zaman
geçerli değildir (bkz. `cnx2026/TOFASCRM` → `src/middleware.ts`,
`src/lib/require-user.ts`).

## Yerel geliştirme

```bash
npm install
cp .env.example .env.local   # değerleri doldur
npm run dev
```

## Giriş noktası

Sanalyzer, bu modülü `src/App.tsx`'teki `export default function App()`
üzerinden import edip kendi sayfa çatısının içine mount eder. Bu bileşen
kendi `<html>`/sidebar/header'ını içermez — sadece içerik alanını `w-full
min-h-screen` ile doldurur, böylece nereye yerleştirilirse yerleştirilsin
alanı kaplar.
