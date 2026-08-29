# Perubahan Integrasi FlazHost

Versi ini merupakan kelanjutan dari proyek Firebase Realtime Database.

Perubahan utama:

- `lib/whatsapp.ts` diganti menjadi client FlazHost REST API server-side.
- Seluruh notifikasi bisnis yang memakai `sendWhatsAppMessage(...)` otomatis menggunakan FlazHost.
- Provider lama Fonnte dan `whatsapp-web.js` dihapus dari runtime.
- `lib/fonnte.ts` dihapus.
- `/api/admin/whatsapp` sekarang membaca status device FlazHost dan menyediakan test-send khusus admin.
- Halaman `/admin/whatsapp` disesuaikan untuk FlazHost dan memiliki form kirim pesan tes.
- Nomor Indonesia dinormalisasi ke format `62...` tanpa tanda `+`.
- Retry exponential diterapkan untuk HTTP 429 dan 500.
- `.env.local` dan `.env.example` memakai `FLAZHOST_WA_BASE_URL`, `FLAZHOST_WA_KEY`, dan `FLAZHOST_WA_DEVICE_ID`.
- Dokumentasi deployment tersedia di `WHATSAPP-FLAZHOST.md`.

Sebelum menjalankan, isi:

```env
FLAZHOST_WA_KEY=fcwa_xxxxxxxxxxxxxxxx
FLAZHOST_WA_DEVICE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Kemudian restart aplikasi.
