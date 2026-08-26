# Provider WhatsApp Fleksibel SI PARIK

Portal SI PARIK mendukung dua provider dari satu source code:

1. **Fonnte** — pesan dikirim melalui API Fonnte.
2. **Node.js (`whatsapp-web.js`)** — pesan dikirim melalui service mandiri pada folder `whatsapp-service`, baik di komputer lokal maupun Railway.

Provider aktif dipilih melalui environment portal. Tidak perlu mengubah source code:

```env
WHATSAPP_PROVIDER=webjs
```

atau:

```env
WHATSAPP_PROVIDER=fonnte
```

Setelah mengganti provider, restart aplikasi lokal atau deploy ulang portal. Kredensial kedua provider boleh tetap tersimpan bersamaan; hanya provider yang dipilih yang dipakai.

## 1. Mode Fonnte

Isi environment portal:

```env
WHATSAPP_PROVIDER=fonnte
FONNTE_TOKEN=TOKEN_DEVICE_FONNTE_ANDA
FONNTE_API_BASE_URL=https://api.fonnte.com
FONNTE_COUNTRY_CODE=62
DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

Sebelum digunakan:

1. Buat atau login ke akun Fonnte.
2. Tambahkan perangkat dan hubungkan nomor WhatsApp dari dashboard Fonnte.
3. Salin **device token**, bukan password akun, ke `FONNTE_TOKEN`.
4. Restart/deploy ulang portal.
5. Login sebagai admin lalu buka `/admin/whatsapp` untuk memeriksa nomor, status, paket, kuota, dan masa aktif.

QR, restart perangkat, dan pergantian nomor pada mode ini dikelola melalui dashboard Fonnte. Portal tidak menampilkan token di browser.

## 2. Mode Node.js di komputer lokal

Pada folder `whatsapp-service`:

```powershell
Copy-Item .env.local.example .env
npm ci
npm start
```

Pada `.env.local` portal:

```env
WHATSAPP_PROVIDER=webjs
WA_SERVICE_URL=http://127.0.0.1:3001
WA_SERVICE_API_KEY=ganti-dengan-kunci-acak-minimal-32-karakter
DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

`WA_SERVICE_API_KEY` pada portal harus sama dengan key di `whatsapp-service/.env`.

Jalankan portal dari terminal kedua dengan `npm run dev`, login sebagai admin, lalu buka `http://localhost:3000/admin/whatsapp`. Sesi lokal tersimpan di `whatsapp-service/.wwebjs_auth`.

## 3. Mode Node.js di Railway

1. Buat service Railway dari repository proyek.
2. Atur **Root Directory** menjadi `/whatsapp-service`.
3. Tambahkan variables service:

```env
WA_SERVICE_API_KEY=PASTE_KUNCI_ACAK_MINIMAL_32_KARAKTER
WA_SESSION_PATH=/data/.wwebjs_auth
WA_CLIENT_ID=siparik
WA_DEFAULT_COUNTRY_CODE=62
WA_AUTO_START=true
WA_PRINT_QR_TERMINAL=false
```

4. Tambahkan Railway Volume dengan mount path tepat `/data`.
5. Gunakan `/health` sebagai health check.
6. Gunakan hanya satu replica.

Pada service portal:

```env
WHATSAPP_PROVIDER=webjs
WA_SERVICE_URL=http://whatsapp-service.railway.internal:3000
WA_SERVICE_API_KEY=PASTE_KUNCI_YANG_SAMA
DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

Jika portal berada di luar Railway, gunakan domain publik HTTPS service WhatsApp sebagai `WA_SERVICE_URL`.

## 4. Cara berpindah provider

Dari Node.js ke Fonnte:

```env
WHATSAPP_PROVIDER=fonnte
FONNTE_TOKEN=TOKEN_DEVICE_FONNTE_ANDA
```

Service Node.js boleh dihentikan setelah Fonnte berhasil dipakai. Untuk kembali ke Node.js:

```env
WHATSAPP_PROVIDER=webjs
WA_SERVICE_URL=http://127.0.0.1:3001
WA_SERVICE_API_KEY=KUNCI_SERVICE_NODEJS
```

Alias `fonte` diterima sebagai `fonnte`; `nodejs`, `whatsapp-webjs`, dan `whatsapp-web.js` diterima sebagai `webjs`. Nilai yang disarankan tetap `fonnte` atau `webjs`.

## 5. Alur notifikasi

Saat petugas menyetujui atau menolak pengajuan:

1. transaksi database diselesaikan terlebih dahulu;
2. portal membaca `WHATSAPP_PROVIDER`;
3. pesan WhatsApp dikirim melalui provider terpilih;
4. email tetap dikirim, baik WhatsApp berhasil maupun gagal;
5. kegagalan salah satu kanal tidak membatalkan hasil verifikasi.

Untuk mematikan WhatsApp sementara tanpa menghapus konfigurasi:

```env
DISABLE_WHATSAPP_NOTIFICATIONS=true
```

Email tetap dicoba selama alamat email pemohon dan konfigurasi SMTP tersedia.

## 6. Halaman admin

- **Node.js:** status diperbarui otomatis, QR ditampilkan, serta tersedia restart dan reset sesi.
- **Fonnte:** status perangkat, nomor, paket, kuota, dan masa aktif ditampilkan. QR dikelola dari dashboard Fonnte.

Endpoint halaman tetap dilindungi login dan role admin.

## 7. Keamanan

- Jangan memakai variable `NEXT_PUBLIC_*` untuk `FONNTE_TOKEN` atau `WA_SERVICE_API_KEY`.
- Jangan commit `.env`, token, API key, atau folder sesi WhatsApp.
- Gunakan satu nomor resmi khusus notifikasi layanan.
- Hindari broadcast massal dan spam.
- Kedua provider bergantung pada koneksi WhatsApp dan dapat terdampak pembatasan WhatsApp.

## 8. File utama

- `lib/whatsapp.ts` — pemilih provider serta klien Fonnte dan Node.js.
- `lib/submission-notifications.ts` — mengirim WhatsApp dan tetap mengirim email.
- `app/api/admin/whatsapp/route.ts` — status dan kontrol provider untuk admin.
- `components/portal/WhatsAppManager.tsx` — tampilan admin sesuai provider.
- `whatsapp-service/server.js` — service Node.js `whatsapp-web.js`.
- `.env.example` — contoh konfigurasi kedua provider.

