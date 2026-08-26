# SI PARIK WhatsApp Service — Local + Railway

Satu source code ini dapat dijalankan dengan tiga cara:

1. langsung melalui Node.js di Windows, macOS, atau Linux;
2. melalui Docker Compose di komputer lokal;
3. sebagai service Docker di Railway.

Service menjalankan `whatsapp-web.js` melalui Chromium, menyimpan sesi dengan `LocalAuth`, dan melindungi seluruh endpoint operasional menggunakan Bearer API key. Portal Next.js tetap menampilkan QR pada halaman admin `/admin/whatsapp`.

## Struktur file

- `server.js` — service API, WhatsApp client, QR, reconnect, dan LocalAuth.
- `package.json` serta `package-lock.json` — dependensi terkunci.
- `.env.local.example` — contoh khusus local Node.js.
- `.env.railway.example` — contoh variables Railway.
- `.env.example` — konfigurasi universal.
- `Dockerfile` — Chromium untuk Railway dan Docker.
- `docker-compose.local.yml` — opsi menjalankan container di local.

## Opsi A — Local langsung dengan Node.js

Prasyarat: Node.js 20 atau lebih baru.

### Windows PowerShell

```powershell
Copy-Item .env.local.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm ci
npm start
```

Masukkan hasil perintah pembuat kunci ke `WA_SERVICE_API_KEY` dalam `.env` sebelum menjalankan `npm start`.

### macOS/Linux

```bash
cp .env.local.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm ci
npm start
```

Konfigurasi local yang penting:

```env
PORT=3001
WA_SESSION_PATH=.wwebjs_auth
PUPPETEER_EXECUTABLE_PATH=
WA_PRINT_QR_TERMINAL=true
```

Biarkan `PUPPETEER_EXECUTABLE_PATH` kosong. Puppeteer akan menggunakan browser yang dipasang bersama dependensi. QR akan muncul di terminal dan juga tetap tersedia melalui API untuk halaman admin portal.

Sesi local tersimpan di `.wwebjs_auth`. Jangan hapus folder ini jika ingin tetap terhubung setelah komputer atau service direstart.

## Opsi B — Local menggunakan Docker

Prasyarat: Docker Desktop atau Docker Engine dengan Docker Compose.

```bash
cp .env.local.example .env
npm run docker:up
```

Pada Windows, salin file dengan:

```powershell
Copy-Item .env.local.example .env
npm run docker:up
```

Service dapat diakses melalui `http://127.0.0.1:3001`. Sesi disimpan pada named volume `whatsapp_session`, sehingga `docker:down` tidak menghapus login WhatsApp.

```bash
npm run docker:down
```

Jangan memakai `down -v` kecuali memang ingin menghapus volume sesi dan memindai QR kembali.

## Opsi C — Railway

1. Buat service Railway dari repository GitHub.
2. Jika service berada dalam monorepo portal SI PARIK, atur Root Directory menjadi `/whatsapp-service`.
3. Railway akan mendeteksi `Dockerfile`.
4. Salin isi `.env.railway.example` ke bagian Variables dan ganti API key.
5. Tambahkan Railway Volume dengan Mount Path tepat `/data`.
6. Gunakan health check path `/health`.
7. Gunakan satu replica saja.

Variables utama Railway:

```env
WA_SERVICE_API_KEY=KUNCI_RAHASIA_YANG_SAMA_DENGAN_PORTAL
WA_SESSION_PATH=/data/.wwebjs_auth
WA_CLIENT_ID=siparik-railway
WA_DEFAULT_COUNTRY_CODE=62
WA_AUTO_START=true
WA_PRINT_QR_TERMINAL=false
```

`PORT` disediakan otomatis oleh Railway dan Chromium sudah dikonfigurasi oleh Dockerfile. Ketika Railway Volume terpasang, service juga dapat mendeteksi mount path melalui `RAILWAY_VOLUME_MOUNT_PATH`.

## Berpindah antara local dan Railway

Tidak perlu mengubah source code. Cukup ubah `WA_SERVICE_URL` pada portal:

| Target aktif | `WA_SERVICE_URL` pada portal |
| --- | --- |
| Local Node/Docker | `http://127.0.0.1:3001` |
| Railway, satu project | `http://whatsapp-service.railway.internal:3000` |
| Railway, portal di luar Railway | `https://domain-service.up.railway.app` |

Pada ketiga pilihan, `WA_SERVICE_API_KEY` di portal harus sama dengan service. Setelah mengganti URL, restart atau deploy ulang portal agar environment baru dibaca.

Local dan Railway menyimpan sesi di tempat berbeda. Karena itu, pertama kali memakai masing-masing environment Anda perlu memindai QR satu kali. Setelah itu:

- local memulihkan sesi dari `.wwebjs_auth` atau Docker volume;
- Railway memulihkan sesi dari volume `/data`;
- pergantian URL tidak menghapus sesi pada environment lainnya.

Sebaiknya hanya satu service yang dijadikan target notifikasi pada satu waktu agar pesan tidak terkirim ganda.

## Konfigurasi portal Next.js

Untuk local:

```env
WA_SERVICE_URL=http://127.0.0.1:3001
WA_SERVICE_API_KEY=KUNCI_YANG_SAMA
DISABLE_WHATSAPP_NOTIFICATIONS=false
NOTIF_CHANNEL=whatsapp
```

Login sebagai admin dan buka:

```text
http://localhost:3000/admin/whatsapp
```

Pindai QR melalui **WhatsApp → Perangkat tertaut → Tautkan perangkat**.

## Endpoint

- `GET /health` — health check tanpa membuka QR atau identitas akun.
- `GET /api/status` — status, informasi akun, dan QR aktif.
- `POST /api/send` — kirim `{ "phone": "0812...", "message": "..." }`.
- `POST /api/restart` — mulai ulang koneksi tanpa menghapus sesi.
- `POST /api/session/reset` — hapus sesi dan buat QR baru; body wajib `{ "confirmation": "RESET" }`.

Semua endpoint `/api/*` memerlukan header:

```text
Authorization: Bearer WA_SERVICE_API_KEY
```

## Pemeriksaan cepat

```bash
npm run check
```

Setelah service aktif:

```bash
curl http://127.0.0.1:3001/health
```

## Pemecahan masalah

- **Chrome/Chromium tidak ditemukan di Windows:** pastikan `PUPPETEER_EXECUTABLE_PATH` kosong, hapus `node_modules`, lalu jalankan `npm ci` lagi.
- **QR selalu muncul setelah restart local:** pastikan `.wwebjs_auth` tidak dihapus dan `WA_CLIENT_ID` tidak berubah.
- **QR selalu muncul setelah deploy Railway:** pastikan volume benar-benar terpasang pada `/data` dan `WA_SESSION_PATH=/data/.wwebjs_auth`.
- **Portal gagal menghubungi local service:** pastikan service aktif di port 3001 dan `WA_SERVICE_URL=http://127.0.0.1:3001`.
- **Status 401:** API key portal dan service berbeda.
- **Status 503 saat mengirim:** WhatsApp belum mencapai status `ready`; buka halaman admin dan periksa status koneksi.

`whatsapp-web.js` merupakan klien WhatsApp tidak resmi. Hindari broadcast massal atau spam, dan gunakan nomor yang memang disiapkan untuk notifikasi transaksional.
