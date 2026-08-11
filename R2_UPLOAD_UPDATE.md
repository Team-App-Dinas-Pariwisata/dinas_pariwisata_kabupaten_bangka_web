# Update Upload Cloudflare R2

Versi ini mengalihkan seluruh upload aplikasi SI PARIK BANGKA ke Cloudflare R2.

## Yang sudah menggunakan R2

- Berita
- Acara
- Tempat Wisata
- Hotel
- Kuliner
- Satwa Endemik
- Pengajuan Pelaku Ekraf (gambar + PDF)
- Pengajuan SDM Pariwisata (gambar + PDF)
- Pengajuan Komunitas / Asosiasi / Lembaga (gambar + PDF)

ImgBB dan penyimpanan `public/uploads/pengajuan` tidak lagi digunakan untuk upload baru.

## Environment

Pastikan `.env.local` memiliki:

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCESS_KEY_ID=
CLOUDFLARE_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
R2_OBJECT_PREFIX=appekraf
R2_JURISDICTION=default
R2_MAX_IMAGE_MB=10
R2_MAX_SUBMISSION_FILE_MB=5
```

API token R2 harus memiliki izin Object Read & Write untuk bucket yang digunakan.

## Struktur object pengajuan

```text
appekraf/pengajuan/ekraf/user-{userId}/YYYY/MM/...
appekraf/pengajuan/sdm/user-{userId}/YYYY/MM/...
appekraf/pengajuan/komunitas/user-{userId}/YYYY/MM/...
```

Pengajuan melalui endpoint publik lama menggunakan scope `public`.

## Keamanan dokumen pengajuan

Dokumen pengajuan tidak diberikan URL bucket publik. Database menyimpan URL endpoint aplikasi:

```text
/api/uploads/r2/submission?key=...
```

Endpoint tersebut membutuhkan sesi login:

- admin/petugas dapat membaca semua file pengajuan;
- akun pengaju hanya dapat membaca file yang berada pada scope `user-{id}` miliknya;
- file scope `public` hanya dapat dibaca admin/petugas.

## Tes lokal

1. Isi `.env.local` dengan credential R2.
2. Restart Next.js.
3. Masuk ke akun pengaju Google.
4. Isi salah satu form dan unggah gambar/PDF.
5. Kirim pengajuan.
6. Buka Cloudflare R2 dan cek object baru pada `appekraf/pengajuan/...`.
7. Cek kolom file di MySQL. Nilainya harus diawali `/api/uploads/r2/submission?key=` dan tidak lagi berisi ImgBB atau `/uploads/pengajuan`.
