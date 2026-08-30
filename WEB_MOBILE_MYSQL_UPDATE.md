# Update Web untuk mobile_mysql

Paket web ini sudah dilengkapi agar kompatibel dengan fitur terbaru pada `mobile_mysql_updated` tanpa mengubah database utama dari MySQL.

## Endpoint baru / dilengkapi

- `POST /api/mobile/detections`
  - menerima laporan deteksi publik dari Flutter;
  - memvalidasi lokasi ke tabel MySQL SI PARIK;
  - menyimpan seluruh hasil deteksi YOLO dan rekap jenis ke MySQL;
  - mengunggah foto hasil deteksi yang sudah diberi bounding box ke Cloudflare R2.
- `GET /api/mobile/detections`
  - khusus petugas/admin;
  - menyediakan data Monitoring Deteksi.
- `DELETE /api/mobile/detections`
  - khusus petugas/admin;
  - menghapus record MySQL dan membersihkan foto R2.
- `DELETE /api/mobile/submissions`
  - khusus petugas/admin;
  - menghapus pengajuan Ekraf/SDM/Komunitas dan file pengajuan R2 terkait.
- `DELETE /api/submissions`
  - endpoint web/staff setara untuk penghapusan pengajuan.

## Database

Jalankan migration berikut pada database produksi yang sudah ada:

`database/migrations/2026-08-30_laporan_deteksi.sql`

Migration membuat tabel `laporan_deteksi` dan aman dijalankan berulang. Definisi tabel yang sama juga sudah dimasukkan ke `database/dinpar.sql` untuk instalasi database baru.

## Cloudflare R2

Resource gambar terkelola sekarang mencakup folder `deteksi`, sehingga foto laporan dapat dibaca melalui proxy `/api/uploads/r2` dan dihapus server-side tanpa mengekspos credential R2 ke APK.

Variabel environment R2 yang sudah dipakai web tetap digunakan:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ACCESS_KEY_ID`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- opsional: `R2_PUBLIC_BASE_URL`, `R2_OBJECT_PREFIX`, `R2_MAX_IMAGE_MB`

## Perbaikan kompatibilitas lokasi mobile

`/api/mobile/public/tourism` sekarang dapat mengembalikan hingga 500 item per kategori saat mobile meminta `pageSize=500`. Endpoint web publik biasa tetap mempertahankan limit kecil bawaannya.

## Catatan deployment

1. Jalankan migration MySQL di atas.
2. Pastikan environment database, session, dan Cloudflare R2 pada deployment masih terisi.
3. Deploy source web ini.
4. Gunakan `mobile_mysql_updated` yang mengarah ke base URL deployment web ini.
