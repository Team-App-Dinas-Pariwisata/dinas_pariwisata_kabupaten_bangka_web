# SI PARIK BANGKA Kabupaten Bangka — Portal V16 (Cloudflare R2 untuk seluruh upload)

## Perubahan V16 — seluruh upload menggunakan Cloudflare R2

Semua file yang diunggah aplikasi sekarang diarahkan ke **Cloudflare R2**. ImgBB dan penyimpanan file pengajuan di filesystem lokal tidak lagi digunakan.

- Media publik (Berita, Acara, Tempat Wisata, Hotel, Kuliner, Satwa Endemik) tetap menggunakan endpoint R2 yang sudah ada.
- Dokumen Pengajuan Pelaku Ekraf, SDM Pariwisata, dan Komunitas/Asosiasi/Lembaga — gambar maupun PDF — diunggah langsung ke bucket R2.
- File pengajuan disimpan di prefix `appekraf/pengajuan/...` dan database menyimpan URL proxy private aplikasi.
- File milik akun pengaju hanya dapat dibaca oleh pemilik akun tersebut atau petugas/admin yang sudah login. File pengajuan anonim lama/endpoint publik hanya dapat dibaca petugas/admin.
- Batas default file pengajuan 5 MB dapat diubah melalui `R2_MAX_SUBMISSION_FILE_MB`.
- `R2_PUBLIC_BASE_URL` hanya digunakan untuk media publik; dokumen pengajuan tetap melalui endpoint private `/api/uploads/r2/submission`.

---

## Perubahan V14 — CRUD data pariwisata pada akun Pengguna

Akun **Pengguna** sekarang memiliki halaman list + CRUD untuk:

- `/dashboard/wisata/tempat-wisata` — Tempat Wisata
- `/dashboard/wisata/hotel` — Hotel
- `/dashboard/wisata/kuliner` — Kuliner
- `/dashboard/wisata/satwa-endemik` — Satwa Endemik

Fitur yang ditambahkan mencakup pencarian daftar, tambah, edit, hapus, upload foto utama ke Cloudflare R2, lookup kategori/jenis/lokasi/status konservasi, koordinat untuk data wisata/hotel/kuliner, serta pengaturan unggulan, aktif, dan publikasi. Struktur tabel database yang sudah ada tetap digunakan dan **tidak membutuhkan migration baru**.

---

## Riwayat V13 — Dashboard Database Fix

## Perubahan V13 — perbaikan ringkasan dashboard

- Query **Pengajuan terbaru** tidak lagi memakai `UNION ALL` antar tiga tabel pengajuan.
- `dinpar.sql` memiliki collation berbeda antara `pengajuan_ekraf` dan tabel SDM/Komunitas; pada MySQL tertentu `UNION` dapat gagal dengan error *Illegal mix of collations*.
- V13 membaca delapan data terbaru dari masing-masing tabel, kemudian menggabungkan dan mengurutkannya di Next.js. Struktur database asli tidak perlu diubah.
- Nilai statistik memakai `COALESCE(..., 0)` sehingga tabel kosong tetap menghasilkan angka `0`, bukan nilai kosong.
- Pada mode development, pesan error database asli ikut ditampilkan agar masalah konfigurasi/tabel lebih mudah didiagnosis.
- Tidak membutuhkan migration database.


Website publik dan portal pengelolaan SI PARIK BANGKA Kabupaten Bangka berbasis **Next.js 16 + MySQL**. Versi ini menggunakan struktur tabel yang sudah tersedia pada `dinpar.sql` yang diberikan, tanpa menambah tabel pengajuan baru.




## Riwayat V12 — penyimpanan ImgBB (sudah tidak digunakan)

Versi lama pernah menggunakan ImgBB. Mulai V16 seluruh upload telah dipindahkan ke Cloudflare R2 dan kode/runtime ImgBB dihapus dari project.

## Perubahan V8

### Menu akun Pengguna

Menu portal pengguna sekarang hanya:

- Dashboard
- Pengajuan
  - Pengajuan Pelaku Ekraf
  - Pengajuan Pelaku SDM Pariwisata
  - Pengajuan Komunitas/Asosiasi/Lembaga
- Berita
- Acara
- Laporan
- Pengaturan

Menu **Pengajuan** berupa dropdown pada sidebar. Menu lama Data Pelaku, Kategori Ekraf, Produk Ekraf, dan Event & Kegiatan sudah tidak digunakan pada navigasi utama.

### Hak akses

#### Admin

Admin hanya dapat CRUD akun petugas/pengguna melalui **Kelola Pengguna**. Admin tidak diberi akses ke data pengajuan, berita, acara, atau laporan operasional.

#### Pengguna

Pengguna/petugas dapat:

- melihat dashboard dan laporan;
- meninjau pengajuan Pelaku Ekraf, SDM Pariwisata, serta Komunitas/Asosiasi/Lembaga;
- **hanya memverifikasi pengajuan** dengan aksi Setujui atau Tolak, tanpa tombol tambah/edit/hapus pengajuan di portal pengguna;
- CRUD Berita;
- CRUD Acara;
- mengubah profil dan kata sandi sendiri.

Pemeriksaan role dilakukan kembali di API/server, bukan hanya melalui penyembunyian menu.

## Alur pengajuan 4 tahap

Mulai V15, pengajuan masyarakat dilakukan melalui **akun pengaju Google**, bukan secara anonim. URL publik lama tetap tersedia sebagai redirect ke halaman akun.

- `/akun/pengajuan/pelaku-ekraf`
- `/akun/pengajuan/sdm-pariwisata`
- `/akun/pengajuan/komunitas`

Masing-masing menggunakan form wizard **4 tahap** dan menyimpan `created_by` sesuai akun pengaju yang dipetakan langsung ke kolom tabel pada `dinpar.sql`:

- `pengajuan_ekraf`
- `pengajuan_sdm_pariwisata`
- `pengajuan_komunitas_asosiasi`

Setelah dikirim, data masuk sebagai pengajuan menunggu verifikasi. Untuk `pengajuan_ekraf`, struktur SQL asli hanya memiliki status `Disetujui`/`Ditolak`, sehingga nilai `NULL` diperlakukan oleh aplikasi sebagai **Menunggu**. Untuk SDM dan Komunitas, aplikasi memakai `status_pengajuan = 'Menunggu'` yang memang sudah tersedia di tabel asli.

Dokumen pengajuan menerima **gambar atau PDF**. Seluruh file diunggah ke **Cloudflare R2**. Batas default adalah **5 MB per file** dan dapat diubah melalui `R2_MAX_SUBMISSION_FILE_MB`. Database menyimpan URL endpoint private aplikasi yang memerlukan sesi login untuk membuka file.

## Berita dan Acara dipisah

Pengelolaan konten sekarang berada pada dua halaman terpisah:

- `/dashboard/berita` → tabel `berita`
- `/dashboard/acara` → tabel `acara`

Kategori diambil dari tabel master yang sudah ada:

- `master_kategori_berita`
- `master_kategori_acara`

## Database

File yang disertakan:

```text
database/dinpar_original.sql   # salinan SQL terbaru yang diberikan (berisi struktur + data)
database/dinpar.sql            # SQL utama terbaru untuk instalasi database
database/dinpar_with_data.sql  # alias eksplisit dump yang berisi data
database/seed_admin.sql        # seed admin tambahan bila diperlukan
database/migrate_portal_auth.sql # alias seed admin untuk database yang sudah ada
```

Project ini tetap kompatibel dengan role asli `super_admin/admin/operator/verifikator`; pada UI, `admin/super_admin` dinormalisasi menjadi Admin dan `operator/verifikator` menjadi Pengguna.

### Instalasi database baru

```bash
mysql -u root -p < database/dinpar.sql
```

> `database/dinpar.sql` pada versi ini adalah dump terbaru yang berisi data dummy/pengujian. Import dump tersebut jika ingin hasil chatbot dan pencarian SPK langsung mempunyai alternatif untuk dirangking.

### Database lama yang sudah ada

Tidak perlu import ulang seluruh dump. Cukup jalankan seed admin:

```bash
mysql -u root -p dinas_pariwisata < database/seed_admin.sql
```

atau:

```bash
mysql -u root -p dinas_pariwisata < database/migrate_portal_auth.sql
```

### Akun admin awal

```text
Email    : admin@appekraf.bangka.go.id
Password : Admin123!
Role     : admin
```

Password tersimpan dalam bentuk hash `scrypt`, bukan plaintext. Sebaiknya ganti password awal setelah instalasi.

## Environment

Salin `.env.example` menjadi `.env.local`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dinas_pariwisata
DB_USER=root
DB_PASSWORD=PASSWORD_MYSQL_ANDA
DB_CONNECTION_LIMIT=10
SESSION_SECRET=ganti-dengan-random-secret-panjang

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

## Menjalankan project

```bash
npm install
npm run dev
```

Kemudian buka:

```text
Website publik : http://localhost:3000
Login portal   : http://localhost:3000/login
```

Jika setelah mengganti versi project CSS masih memakai cache lama, hentikan dev server dan hapus `.next`.

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

macOS/Linux:

```bash
rm -rf .next
npm run dev
```

## Keamanan yang diterapkan

- Password memakai `scrypt` + random salt.
- Cookie sesi `HttpOnly`, `SameSite=Lax`, dan `Secure` pada production.
- Token sesi ditandatangani HMAC SHA-256 dengan `SESSION_SECRET`.
- Role/status akun diverifikasi kembali ke database.
- Query data memakai parameterized values dan resource whitelist.
- Endpoint pengajuan internal tidak menyediakan POST/DELETE; petugas hanya dapat Setujui/Tolak.
- Upload publik dibatasi tipe MIME dan ukuran 5 MB per file.

## File utama V8

```text
app/pengajuan/
app/dashboard/pengajuan/
app/dashboard/berita/
app/dashboard/acara/
app/api/public/submissions/route.ts
app/api/submissions/route.ts
app/api/crud/route.ts
components/public/PublicSubmissionForm.tsx
components/portal/SubmissionManager.tsx
components/portal/PortalShell.tsx
lib/submission-config.ts
lib/resources.ts
database/
```

## Update V14

- Headline hero disederhanakan menjadi “Pelaku kreatif Bangka.”
- Dropdown pengajuan dinaikkan stacking layer agar tidak tertutup kartu sorotan/tab.
- Kartu “Portal Digital” dinaikkan pada desktop agar komposisi hero lebih rapi.
- Tab Berita pada homepage mengambil maksimal 6 berita aktif dan sudah dipublikasikan langsung dari tabel `berita` + `master_kategori_berita`, lalu menampilkan 2 berita per tampilan dan dapat digeser dengan tombol panah.
- Endpoint publik baru: `GET /api/public/berita`.
- Media baru disimpan di Cloudflare R2. Record lama yang masih berisi URL eksternal tetap dapat dibaca sebagai data legacy, sedangkan upload baru tidak lagi menggunakan ImgBB.


## Pencarian Rekomendasi Wisata (SPK SAW)

Menu **Wisata → Pencarian Rekomendasi** membuka `/pencarian`. Pengguna dapat memilih Tempat Wisata, Kuliner, Hotel, atau Satwa Endemik; menentukan kata kunci, lokasi, batas jarak, budget, kebutuhan khusus, dan prioritas setiap kriteria. Backend memakai view `vw_spk_*`, tabel `spk_kriteria`/`spk_bobot`, serta metode Simple Additive Weighting (SAW). Detail implementasi database ada di `database/README_SPK_SAW.md`.

## Font Montserrat

Seluruh antarmuka menggunakan **Montserrat** melalui `next/font/google` pada `app/layout.tsx`. Next.js mengoptimalkan font tersebut menjadi aset **self-hosted** pada saat proses build, sehingga browser pengguna tidak mengambil font langsung dari Google Fonts saat aplikasi berjalan. Seluruh deklarasi font publik, portal/admin, form, dan angka statistik diarahkan ke variabel global `--app-font` di `app/globals.css`.

## NLP Chatbot -> Pencarian SPK

Homepage **Tanya AI Bangka** sekarang dapat mengubah pertanyaan bahasa alami menjadi kriteria SPK. Frontend mengirim pertanyaan ke `app/api/ai/chat/route.ts`, kemudian route tersebut meneruskan permintaan ke backend FastAPI `chatbot_pariwisata_spk.py` melalui endpoint `/web-intent`.

Hasil NLP dipetakan menjadi kategori, budget, jarak, fasilitas wajib, preferensi halal, minimal bintang, kebutuhan keluarga/lansia, kebutuhan pengamatan satwa, dan prioritas kriteria. Browser kemudian diarahkan ke `/pencarian` dengan state form pada query string. Halaman pencarian mengisi form secara otomatis dan menjalankan ranking SAW menggunakan endpoint Next.js yang sudah ada.

Jalankan backend Python dengan:

```bash
pip install -r python/requirements.txt
python chatbot_pariwisata_spk.py
```

Default URL NLP adalah `http://127.0.0.1:8000`. Jika berbeda, set `NLP_API_URL` pada `.env.local`. Panduan rinci ada di `python/README_NLP_SPK.md`.

### Perbaikan kompatibilitas chatbot NLP (v13)
Jika backend Python yang aktif masih versi awal dan belum memiliki endpoint `/web-intent`, proxy `/api/ai/chat` sekarang otomatis fallback ke `/kriteria`. Pesan mentah `Not Found` tidak lagi ditampilkan kepada pengguna.

---

## Update V15 — Akun Pengaju + Sign Up Google

Versi ini menambahkan alur akun masyarakat/pengaju tanpa mengubah hak akses admin dan petugas yang sudah berjalan.

- Halaman sign up/login Google: `/akun/masuk`
- Dashboard pengaju: `/akun`
- Form akun: `/akun/pengajuan/pelaku-ekraf`, `/akun/pengajuan/sdm-pariwisata`, `/akun/pengajuan/komunitas`
- Pengajuan dari akun otomatis menyimpan `created_by` agar riwayat dapat dipisahkan per pemilik akun.
- Login password `/login` tetap khusus admin/petugas.
- Panduan Google OAuth lokal lengkap: `README_GOOGLE_SIGNUP_LOCAL.md`
- Migration database lama: `database/migrations/2026-08-11_google_pengaju.sql`
