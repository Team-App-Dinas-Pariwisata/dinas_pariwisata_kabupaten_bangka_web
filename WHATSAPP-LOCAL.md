# SI PARIK WhatsApp Lokal — Node.js + whatsapp-web.js

Konfigurasi ini ditujukan untuk menjalankan SI PARIK sepenuhnya di komputer lokal. Tidak diperlukan Railway, Docker, atau server WhatsApp terpisah di internet.

## Arsitektur

- Next.js SI PARIK: `http://localhost:3000`
- WhatsApp Node.js service: `http://127.0.0.1:3001`
- Database: MySQL sesuai konfigurasi project
- WhatsApp session: `whatsapp-service/.wwebjs_auth/`

Keduanya dijalankan dalam dua terminal.

## 1. Install portal

Dari folder root project:

```powershell
npm install
```

Buat file `.env.local` di root project dan isi minimal:

```env
WHATSAPP_PROVIDER=webjs
WA_SERVICE_URL=http://127.0.0.1:3001
WA_SERVICE_API_KEY=ganti-dengan-kunci-acak-minimal-32-karakter
DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

`WA_SERVICE_API_KEY` harus sama dengan nilai di `whatsapp-service/.env`.

## 2. Install WhatsApp Node.js service

Terminal kedua:

```powershell
cd whatsapp-service
Copy-Item .env.example .env
npm install
```

Edit `whatsapp-service/.env`:

```env
PORT=3001
WA_SERVICE_API_KEY=ganti-dengan-kunci-acak-minimal-32-karakter
WA_SESSION_PATH=./.wwebjs_auth
WA_CLIENT_ID=siparik
WA_AUTO_START=true
WA_PRINT_QR_TERMINAL=false
WA_DEFAULT_COUNTRY_CODE=62
WA_QR_MAX_RETRIES=0
WA_HEADLESS=true
```

Untuk pengembangan, `WA_HEADLESS=true` tetap dianjurkan. QR ditampilkan oleh halaman admin SI PARIK.

## 3. Jalankan service WhatsApp

Di terminal kedua:

```powershell
npm start
```

Harus tampil kurang lebih:

```text
SI PARIK WhatsApp service listening on :3001
```

## 4. Jalankan Next.js

Terminal pertama:

```powershell
npm run dev
```

Buka:

```text
http://localhost:3000/admin/whatsapp
```

Login sebagai admin. QR akan muncul ketika status WhatsApp berada pada `qr`.

## 5. Scan QR

Di halaman admin:

1. Tunggu QR muncul.
2. Buka WhatsApp pada telepon utama.
3. Pilih **Perangkat tertaut**.
4. Pilih **Tautkan perangkat**.
5. Scan QR yang muncul di halaman SI PARIK.

Setelah berhasil, status berubah menjadi `ready` dan nomor/name akun akan ditampilkan.

## 6. Session tidak perlu scan setiap start

`whatsapp-web.js` menggunakan `LocalAuth`. Session disimpan di:

```text
whatsapp-service/.wwebjs_auth/
```

Selama folder tersebut tidak dihapus, restart service biasanya menggunakan session yang sudah tersimpan.

Jangan hapus folder ini apabila ingin mempertahankan login WhatsApp.

## 7. Membuat QR baru

Gunakan tombol **Hapus Sesi & Buat QR Baru** dari halaman admin hanya ketika memang ingin menautkan WhatsApp ke nomor lain atau session bermasalah.

Tindakan tersebut menghapus session lokal `session-siparik` dan memulai autentikasi baru.

## 8. Menjalankan kembali setelah komputer restart

Buka dua terminal:

Terminal 1:
```powershell
npm run dev
```

Terminal 2:
```powershell
npm run whatsapp:start
```

Atau dari root project langsung jalankan:

```powershell
npm run whatsapp:install
npm run whatsapp:start
```

## 9. Pemeriksaan service

Dari browser lokal:

```text
http://127.0.0.1:3001/health
```

Endpoint tersebut tidak membutuhkan API key dan dapat dipakai untuk memastikan process Node.js hidup.

Endpoint status yang dipanggil portal adalah:

```text
GET http://127.0.0.1:3001/api/status
```

Endpoint kontrol dan kirim pesan membutuhkan `Authorization: Bearer <WA_SERVICE_API_KEY>`.

## 10. Troubleshooting QR

Jika QR tidak muncul:

1. Pastikan terminal Node.js service menampilkan `listening on :3001`.
2. Pastikan `WA_SERVICE_URL=http://127.0.0.1:3001`.
3. Pastikan API key portal dan service identik.
4. Buka `http://127.0.0.1:3001/health`.
5. Cek `/admin/whatsapp` dan tekan **Mulai Ulang Koneksi**.
6. Jika session rusak, gunakan **Hapus Sesi & Buat QR Baru**.

Jika Chrome/Chromium tidak dapat dijalankan, pastikan Node.js LTS dan dependency service sudah terpasang dengan:

```powershell
cd whatsapp-service
npm install
```

## 11. Catatan keamanan lokal

- Jangan membagikan `WA_SERVICE_API_KEY`.
- Jangan commit `.env`.
- Jangan commit `.wwebjs_auth`.
- Gunakan satu nomor WhatsApp khusus notifikasi sistem.
- Hindari pengiriman pesan massal/spam.

## File penting

- `lib/whatsapp.ts` — integrasi portal ke service WhatsApp.
- `components/portal/WhatsAppManager.tsx` — halaman admin WhatsApp.
- `app/api/admin/whatsapp/route.ts` — endpoint portal.
- `whatsapp-service/server.js` — Node.js + whatsapp-web.js.
- `whatsapp-service/.env.example` — konfigurasi service lokal.
