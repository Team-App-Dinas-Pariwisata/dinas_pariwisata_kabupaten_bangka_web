# Fasilitas Petugas – MySQL

Perubahan ini menambahkan input multi-checkbox fasilitas pada CRUD:
- Tempat Wisata → `tempat_wisata_fasilitas`
- Hotel → `hotel_fasilitas`
- Kuliner → `kuliner_fasilitas`

Pilihan fasilitas diambil dari `master_fasilitas` yang aktif dan difilter menurut kategori objek.
Saat edit, fasilitas tersimpan otomatis dicentang kembali.

Tidak ada perubahan struktur tabel yang diperlukan karena tabel relasi fasilitas sudah ada di `database/dinpar.sql`.

Jalankan lokal:

```bash
npm install
npm run dev
```

Pastikan `.env.local` mengarah ke database MySQL lokal Anda.
