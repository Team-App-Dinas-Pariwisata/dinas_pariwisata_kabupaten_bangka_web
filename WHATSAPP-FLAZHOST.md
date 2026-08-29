# Integrasi WhatsApp FlazHost — SI PARIK

Proyek ini menggunakan **FlazHost WhatsApp Gateway** sebagai satu-satunya provider notifikasi WhatsApp.
Implementasi berada di `lib/whatsapp.ts` dan seluruh notifikasi pengajuan tetap memanggil
`sendWhatsAppMessage(...)`, sehingga alur bisnis lama tidak perlu diubah.

## 1. Environment

Tambahkan ke `.env.local` pada development dan ke Environment Variables pada hosting production:

```env
FLAZHOST_WA_BASE_URL=https://flazhost.com/api/wa/v1
FLAZHOST_WA_KEY=fcwa_xxxxxxxxxxxxxxxx
FLAZHOST_WA_DEVICE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

`FLAZHOST_WA_KEY` dan `FLAZHOST_WA_DEVICE_ID` tidak boleh memakai prefix `NEXT_PUBLIC_`.
API key harus memiliki scope **send** agar dapat memakai endpoint pengiriman pesan. Untuk halaman
status admin, key juga perlu akses **devices.read**.

## 2. Endpoint yang digunakan aplikasi

Pengiriman teks:

```text
POST https://flazhost.com/api/wa/v1/messages/send
Authorization: Bearer <FLAZHOST_WA_KEY>
Content-Type: application/json
```

Body:

```json
{
  "device_id": "<uuid>",
  "to": "628123456789",
  "text": "Isi notifikasi"
}
```

Pengecekan status device:

```text
GET https://flazhost.com/api/wa/v1/devices/<device-id>/status
Authorization: Bearer <FLAZHOST_WA_KEY>
```

Status yang dikenali aplikasi: `connected`, `disconnected`, `qr_pending`, dan `banned`.

## 3. Normalisasi nomor

Aplikasi mengubah nomor Indonesia ke format internasional tanpa tanda `+`:

- `081234567890` -> `6281234567890`
- `81234567890` -> `6281234567890`
- `+62 812-3456-7890` -> `6281234567890`

Nomor yang tidak dapat dinormalisasi akan ditolak sebelum request dikirim ke FlazHost.

## 4. Error dan retry

Format error FlazHost dibaca dari field `error` dan `message`.
Implementasi melakukan exponential backoff hanya untuk HTTP **429** dan **500**.
Error seperti 401, 403, 404, 409, 422, dan 423 langsung dikembalikan tanpa retry berulang.

Kegagalan WhatsApp tidak membatalkan transaksi utama pengajuan. Pengajuan tetap tersimpan di
Firebase Realtime Database, sementara kegagalan WhatsApp dicatat di log server dan email tetap
dicoba oleh `lib/submission-notifications.ts`.

## 5. Pengujian dari portal admin

Masuk sebagai admin lalu buka:

```text
/admin/whatsapp
```

Halaman tersebut menampilkan status device FlazHost dan menyediakan form **Kirim Pesan Tes**.
Masukkan nomor tujuan, misalnya `081234567890`, lalu kirim.

## 6. Rate limit penting

FlazHost menerapkan rate limit API dan limit anti-ban per device. Hindari loop pengiriman massal
secara paralel. Notifikasi SI PARIK sebaiknya tetap bersifat transaksional dan dikirim satu per satu.

## 7. Migrasi dari provider lama

Provider Fonnte dan service `whatsapp-web.js` sudah dikeluarkan dari source runtime. Environment lama
berikut tidak lagi digunakan dan boleh dihapus dari deployment:

```text
WHATSAPP_PROVIDER
WA_SERVICE_URL
WA_SERVICE_API_KEY
FONNTE_TOKEN
FONNTE_API_BASE_URL
FONNTE_COUNTRY_CODE
```

Setelah mengubah environment, restart `npm run dev` atau redeploy aplikasi.
