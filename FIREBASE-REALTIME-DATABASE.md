# Migrasi Si Parik ke Firebase Realtime Database

Aplikasi ini sudah diubah agar seluruh database runtime menggunakan **Firebase Realtime Database** melalui **Firebase Realtime Database REST API** dengan autentikasi service account di server Next.js. Cloudflare R2, Google OAuth, email, dan service NLP tetap menggunakan konfigurasi sebelumnya. Notifikasi WhatsApp sekarang menggunakan FlazHost WhatsApp Gateway melalui REST API server-side.

## 1. Buat Realtime Database

1. Buka Firebase Console dan pilih/buat project.
2. Aktifkan **Realtime Database**. Untuk Indonesia, pilih region yang paling sesuai (misalnya Asia Tenggara jika tersedia untuk project Anda).
3. Salin URL database ke `FIREBASE_DATABASE_URL`.
4. Buka **Project settings > Service accounts**, buat private key service account, lalu isi:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

`FIREBASE_PRIVATE_KEY` pada environment variable dapat disimpan satu baris dengan karakter `\n`.

## 2. Security Rules

Runtime aplikasi mengakses REST API Firebase dari server menggunakan service account, sehingga akses client langsung tidak diperlukan. File `database.rules.json` disiapkan dengan `.read=false` dan `.write=false` untuk mencegah akses publik langsung.

Deploy rules dengan Firebase CLI bila diperlukan:

```bash
firebase deploy --only database
```

## 3. Struktur data

Nama tabel MySQL lama dipertahankan sebagai node tingkat atas agar perubahan frontend/API minimal. Contoh:

```text
/
  pengguna/
    1/...
    2/...
  berita/
  acara/
  tempat_wisata/
  hotel/
  kuliner/
  pengajuan_ekraf/
  pengajuan_sdm_pariwisata/
  pengajuan_komunitas_asosiasi/
  chat_conversations/
  chat_messages/
  __meta/
    counters/
```

Relasi SQL/JOIN kini diselesaikan oleh helper TypeScript di server (`lib/realtime-db.ts`, `lib/data-helpers.ts`, dan helper domain terkait).

## 4. Migrasi data MySQL lama

Nilai `DB_*` lama pada `.env.local` telah dipindahkan menjadi `LEGACY_DB_*`. Isi kredensial Firebase, lalu ubah:

```env
MIGRATION_CONFIRM=YES
```

Jalankan sekali:

```bash
npm install
npm run migrate:firebase

> Catatan: perintah `npm run migrate:firebase` sekarang otomatis membaca `.env.local` melalui `node --env-file=.env.local`. Pastikan `MIGRATION_CONFIRM=YES` berada di `.env.local` sebelum menjalankan migrasi.
```

Skrip akan membaca seluruh **base table** MySQL, menyalinnya ke node Firebase dengan nama tabel yang sama, mempertahankan numeric ID, membuat composite key untuk tabel dengan primary key gabungan, dan mengisi `__meta/counters` agar ID baru tidak bentrok.

> Skrip menggunakan `set()` per node tabel dan akan mengganti isi node tujuan dengan data hasil migrasi. Pastikan project Firebase tujuan benar sebelum mengaktifkan `MIGRATION_CONFIRM=YES`.

Setelah migrasi selesai, kembalikan `MIGRATION_CONFIRM=NO`. MySQL tidak diperlukan lagi untuk runtime aplikasi.

## 5. Menjalankan aplikasi

```bash
npm install
npm run dev
```

Untuk deployment, set seluruh `FIREBASE_*` pada environment server/hosting. Jangan mengekspos service-account private key sebagai `NEXT_PUBLIC_*`.
