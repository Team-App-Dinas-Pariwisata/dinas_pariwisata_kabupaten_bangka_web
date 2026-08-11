# Uji Sign Up Google — Akun Pengaju SI PARIK BANGKA

Versi ini menambahkan akun **pengaju** terpisah dari akun **admin** dan **pengguna/petugas**. Pengaju tidak mempunyai akses ke dashboard petugas. Akun pengaju dibuat otomatis ketika pengguna pertama kali berhasil masuk menggunakan Google.

## 1. Jalankan migration database

Untuk database lokal yang sudah pernah Anda import sebelumnya:

```bash
mysql -u root -p dinas_pariwisata < database/migrations/2026-08-11_google_pengaju.sql
```

Migration menambahkan:

- role `pengaju` pada tabel `pengguna`;
- `auth_provider`;
- `google_sub` sebagai ID unik akun Google;
- `email_verified`.

Untuk instalasi database dari nol, file `database/dinpar.sql` dan `dinpar.sql` sudah berisi struktur terbaru sehingga migration terpisah tidak perlu dijalankan.

## 2. Buat OAuth Client di Google Cloud

Di Google Cloud Console buat OAuth 2.0 Client ID dengan tipe **Web application**.

Untuk uji lokal gunakan nilai berikut secara persis:

```text
Authorized JavaScript origin:
http://localhost:3000

Authorized redirect URI:
http://localhost:3000/api/auth/google/callback
```

Redirect URI harus sama persis dengan `GOOGLE_REDIRECT_URI` pada `.env.local`. Untuk pengujian, jalankan Next.js di port 3000 dan akses menggunakan `localhost`, bukan menggantinya menjadi `127.0.0.1`.

Jika OAuth consent screen masih dalam mode Testing/External, tambahkan akun Google yang akan digunakan sebagai test user sesuai pengaturan Google Cloud Anda.

Dokumentasi resmi:
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/identity/openid-connect/openid-connect

## 3. Buat `.env.local`

Salin `.env.example` menjadi `.env.local`, lalu isi Client ID dan Client Secret dari Google Cloud:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dinas_pariwisata
DB_USER=root
DB_PASSWORD=PASSWORD_MYSQL_ANDA
DB_CONNECTION_LIMIT=10

SESSION_SECRET=buat-random-secret-panjang-minimal-32-karakter

GOOGLE_CLIENT_ID=CLIENT_ID_DARI_GOOGLE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=CLIENT_SECRET_DARI_GOOGLE
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

CLOUDFLARE_ACCOUNT_ID=ACCOUNT_ID_CLOUDFLARE
CLOUDFLARE_ACCESS_KEY_ID=ACCESS_KEY_ID_R2
CLOUDFLARE_SECRET_ACCESS_KEY=SECRET_ACCESS_KEY_R2
R2_BUCKET_NAME=NAMA_BUCKET_R2
R2_PUBLIC_BASE_URL=
R2_OBJECT_PREFIX=appekraf
R2_JURISDICTION=default
R2_MAX_IMAGE_MB=10
R2_MAX_SUBMISSION_FILE_MB=5
```

`GOOGLE_CLIENT_SECRET` hanya dibaca pada server dan jangan diletakkan di kode frontend.

## 4. Jalankan project lokal

```bash
npm install
npm run dev -- -p 3000
```

Buka:

```text
http://localhost:3000/akun/masuk
```

Klik **Lanjutkan dengan Google**. Untuk login pertama, akun `pengaju` akan otomatis dibuat di tabel `pengguna`. Login berikutnya menggunakan record yang sama berdasarkan `google_sub`/email terverifikasi.

## 5. Alur akun pengaju

Setelah berhasil masuk, pengguna diarahkan ke:

```text
/akun
```

Di akun tersedia tiga form:

```text
/akun/pengajuan/pelaku-ekraf
/akun/pengajuan/sdm-pariwisata
/akun/pengajuan/komunitas
```

Nama dan email dari Google otomatis menjadi nilai awal pada field yang relevan. Setiap pengajuan yang dibuat dari akun ini menyimpan `created_by = id akun pengaju`, sehingga dashboard akun hanya menampilkan riwayat milik pengguna tersebut.

Status yang ditampilkan:

- Menunggu
- Perlu Perbaikan
- Disetujui
- Ditolak

## 6. Pemisahan hak akses

- `/akun/*` → khusus role `pengaju`.
- `/dashboard/*` → khusus role `pengguna`/petugas.
- `/admin/*` → khusus role `admin`.
- `/login` → login password untuk admin/petugas tetap dipertahankan.
- `/akun/masuk` → sign up/login Google khusus masyarakat/pengaju.

Email yang sudah terdaftar sebagai admin/petugas tidak dapat dipakai untuk membuat akun pengaju Google. Ini mencegah perubahan jalur autentikasi pada akun internal.

## 7. Troubleshooting cepat

### `redirect_uri_mismatch`
Pastikan Google Cloud dan `.env.local` sama persis:

```text
http://localhost:3000/api/auth/google/callback
```

### Google OAuth belum dikonfigurasi
Pastikan dua variabel ini terisi dan restart server Next.js:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

### Error kolom `google_sub` / `auth_provider`
Database lama belum dimigration. Jalankan:

```bash
mysql -u root -p dinas_pariwisata < database/migrations/2026-08-11_google_pengaju.sql
```

### Port 3000 sedang digunakan
Matikan proses yang memakai port 3000. Untuk OAuth lokal ini jangan membiarkan Next.js berpindah otomatis ke 3001 kecuali redirect URI Google dan `.env.local` juga diubah ke port 3001.


## Upload file pengajuan ke Cloudflare R2

Mulai versi ini, seluruh gambar dan PDF pada form akun pengaju disimpan ke Cloudflare R2. Tidak ada lagi upload ImgBB atau penyimpanan ke `public/uploads`. Pastikan API Token R2 memiliki izin **Object Read & Write** pada bucket yang digunakan.

Struktur object pengajuan akun:

```text
appekraf/pengajuan/ekraf/user-{id}/YYYY/MM/...
appekraf/pengajuan/sdm/user-{id}/YYYY/MM/...
appekraf/pengajuan/komunitas/user-{id}/YYYY/MM/...
```

Dokumen pengajuan tidak memakai `R2_PUBLIC_BASE_URL`; file dibaca melalui endpoint private aplikasi dan memerlukan sesi akun yang berhak.
