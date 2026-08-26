# Migrasi Notifikasi SI PARIK ke whatsapp-web.js

Implementasi ini mengganti Fonnte dengan dua bagian:

1. Portal Next.js mengirim pesan ke service WhatsApp melalui API privat dan menampilkan QR hanya pada akun admin di `/admin/whatsapp`.
2. Folder `whatsapp-service` adalah service Node.js/Express yang menjalankan `whatsapp-web.js` dan Chromium di Railway.

Sesi menggunakan `LocalAuth`. Di Railway, direktori sesi harus berada pada volume persisten `/data`; tanpa volume, sesi hilang ketika deploy atau restart dan QR harus dipindai lagi.

## 1. Buat API key

Buat string acak minimal 32 karakter. Contoh melalui terminal:

```bash
openssl rand -hex 32
```

Simpan hasil yang sama pada service portal dan service WhatsApp. Jangan menaruh nilai asli di source code atau commit Git.

## 2. Deploy service WhatsApp ke Railway

1. Push proyek ini ke repository GitHub.
2. Di project Railway, pilih **New Service → GitHub Repo**, lalu pilih repository yang sama.
3. Beri nama service `whatsapp-service`.
4. Pada **Settings → Source**, atur **Root Directory** menjadi `/whatsapp-service`.
5. Railway akan menemukan `whatsapp-service/Dockerfile` secara otomatis.
6. Tambahkan variables berikut pada service:

```env
WA_SERVICE_API_KEY=PASTE_KUNCI_ACAK_DI_SINI
WA_SESSION_PATH=/data/.wwebjs_auth
WA_CLIENT_ID=siparik
WA_DEFAULT_COUNTRY_CODE=62
```

`PORT` disediakan Railway secara otomatis. Dockerfile sudah menetapkan lokasi Chromium.

7. Di service yang sama, buka **Volumes → Add Volume** dan isi **Mount Path** dengan tepat:

```text
/data
```

8. Gunakan `/health` sebagai health check path. Endpoint ini tetap sehat ketika QR belum dipindai, sehingga deployment tidak menunggu tindakan admin.
9. Gunakan hanya **satu replica**. Satu sesi WhatsApp Web tidak boleh dijalankan serentak oleh beberapa instance.

## 3. Hubungkan portal Next.js

Tambahkan variables berikut pada service tempat portal SI PARIK berjalan:

```env
WA_SERVICE_URL=http://whatsapp-service.railway.internal:3000
WA_SERVICE_API_KEY=PASTE_KUNCI_YANG_SAMA
DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

Alamat `railway.internal` hanya dapat digunakan jika portal dan service WhatsApp berada dalam project serta environment Railway yang sama. Lalu lintas ini tidak perlu domain publik.

Jika portal berjalan di Vercel atau server lain:

1. Buat domain publik untuk service WhatsApp di **Settings → Networking → Generate Domain**.
2. Isi `WA_SERVICE_URL` pada portal dengan domain HTTPS tersebut, misalnya `https://nama-service.up.railway.app`.
3. API tetap dilindungi Bearer API key; QR tidak dapat diambil tanpa key.

Setelah variables tersimpan, deploy ulang portal.

## 4. Pindai QR pertama kali

1. Login ke SI PARIK sebagai **Admin**.
2. Buka menu **Koneksi WhatsApp** atau URL `/admin/whatsapp`.
3. Tunggu status **Menunggu pemindaian QR**.
4. Di ponsel, buka **WhatsApp → Perangkat tertaut → Tautkan perangkat**.
5. Pindai QR pada halaman admin.
6. Tunggu status berubah menjadi **Terhubung**.

Setelah berhasil, sesi disimpan pada volume Railway. Restart maupun deployment berikutnya akan memulihkan sesi dan tidak meminta QR lagi.

QR perlu dipindai ulang hanya jika salah satu kondisi ini terjadi:

- admin menekan **Hapus Sesi & Buat QR Baru**;
- perangkat Railway dihapus dari menu **Perangkat tertaut** di ponsel;
- volume `/data` dilepas atau dihapus;
- WhatsApp membatalkan sesi karena alasan keamanan.

Tombol **Mulai Ulang Koneksi** tidak menghapus sesi dan aman digunakan ketika koneksi macet.

## 5. Alur notifikasi

Saat petugas menyetujui atau menolak pengajuan:

1. transaksi database diselesaikan lebih dahulu;
2. portal memanggil `POST /api/send` pada service WhatsApp;
3. nomor Indonesia dinormalisasi otomatis (`0812...` menjadi `62812...`);
4. jika WhatsApp belum siap atau pengiriman gagal, sistem mencoba fallback email;
5. kegagalan notifikasi tidak membatalkan hasil verifikasi yang sudah tersimpan.

## 6. Uji cepat

Health check tidak memerlukan API key:

```bash
curl https://DOMAIN-SERVICE/health
```

Status service memerlukan API key:

```bash
curl https://DOMAIN-SERVICE/api/status \
  -H "Authorization: Bearer KUNCI_ANDA"
```

Pengujian pesan:

```bash
curl -X POST https://DOMAIN-SERVICE/api/send \
  -H "Authorization: Bearer KUNCI_ANDA" \
  -H "Content-Type: application/json" \
  -d '{"phone":"081234567890","message":"Tes notifikasi SI PARIK"}'
```

## Catatan keamanan dan operasional

- Jangan pernah menampilkan `WA_SERVICE_API_KEY` di browser atau memasukkannya ke variable berawalan `NEXT_PUBLIC_`.
- Batasi penggunaan nomor untuk notifikasi transaksional kepada pengguna yang memang memberikan nomor WhatsApp.
- Jangan gunakan service untuk broadcast massal atau spam.
- `whatsapp-web.js` adalah klien tidak resmi yang mengendalikan WhatsApp Web melalui Chromium. Perubahan di WhatsApp Web dapat sewaktu-waktu memerlukan pembaruan package, dan penggunaan klien tidak resmi memiliki risiko pembatasan akun.
- Untuk sistem yang bersifat kritis atau membutuhkan kepatuhan resmi, pertimbangkan WhatsApp Business Platform/Cloud API.

## File utama yang berubah

- `lib/whatsapp.ts` — klien server-to-server pengganti Fonnte.
- `lib/submission-notifications.ts` — memakai service WhatsApp baru dan tetap memiliki fallback email.
- `app/api/admin/whatsapp/route.ts` — proxy admin yang memvalidasi sesi/role.
- `app/admin/whatsapp/page.tsx` — halaman khusus admin.
- `components/portal/WhatsAppManager.tsx` — tampilan status, QR, restart, dan reset sesi.
- `whatsapp-service/server.js` — service Node.js untuk Railway.
- `whatsapp-service/Dockerfile` — image Chromium untuk deployment.
