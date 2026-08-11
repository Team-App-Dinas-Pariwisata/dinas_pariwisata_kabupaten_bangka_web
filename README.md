# SI PARIK BANGKA Kabupaten Bangka — Portal V14 (CRUD Data Pariwisata)

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




## Perubahan V12 — database menyimpan URL halaman ImgBB

Sesuai kebutuhan terbaru, setiap upload gambar sekarang menyimpan **URL viewer akun ImgBB** ke database menggunakan ID dari response API, dengan format:

```text
https://ibb.co.com/0p828D7Z
```

API ImgBB sendiri mengembalikan `url_viewer` seperti `https://ibb.co/{id}`. Project V12 mengambil `id` tersebut lalu menyimpan format akun `https://ibb.co.com/{id}` seperti link yang terlihat pada akun ImgBB. Direct CDN URL `https://i.ibb.co/.../nama-file.jpg` tidak lagi disimpan ke kolom gambar.

- Parameter custom `name` tidak lagi dikirim ke API ImgBB, sehingga aplikasi tidak membuat nama `berita-foto-utama-...`.
- Berita dan Acara menyimpan `https://ibb.co.com/{id}` pada `foto_utama`.
- File gambar pada tiga formulir pengajuan publik juga menyimpan format `https://ibb.co.com/{id}`.
- Direct URL tetap dibaca dari response API hanya sebagai metadata internal, tidak digunakan sebagai nilai database.
- Karena URL viewer adalah halaman HTML, portal menampilkannya sebagai link **Buka gambar di ImgBB**, bukan sebagai `<img src>`. Untuk file baru yang belum disimpan, preview lokal tetap tampil.
- PDF pengajuan tetap disimpan lokal seperti versi sebelumnya.
- Tidak ada perubahan struktur database / migration.

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

## Alur pengajuan publik 4 tahap

Pengajuan baru dilakukan dari website publik, bukan dari akun pengguna internal.

- `/pengajuan/pelaku-ekraf`
- `/pengajuan/sdm-pariwisata`
- `/pengajuan/komunitas`

Masing-masing menggunakan form wizard **4 tahap** yang dipetakan langsung ke kolom tabel pada `dinpar.sql`:

- `pengajuan_ekraf`
- `pengajuan_sdm_pariwisata`
- `pengajuan_komunitas_asosiasi`

Setelah dikirim, data masuk sebagai pengajuan menunggu verifikasi. Untuk `pengajuan_ekraf`, struktur SQL asli hanya memiliki status `Disetujui`/`Ditolak`, sehingga nilai `NULL` diperlakukan oleh aplikasi sebagai **Menunggu**. Untuk SDM dan Komunitas, aplikasi memakai `status_pengajuan = 'Menunggu'` yang memang sudah tersedia di tabel asli.

Dokumen pengajuan menerima **gambar atau PDF**, maksimal **5 MB per file**. Semua gambar diunggah ke ImgBB dan database menyimpan URL viewer `https://ibb.co.com/{id}`; PDF tetap disimpan ke `public/uploads/pengajuan/...`.

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
IMGBB_API_KEY=API_KEY_IMGBB_ANDA
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
- Karena database saat ini menyimpan URL viewer ImgBB (`ibb.co.com/...`), viewer URL tidak dipakai sebagai `<img>`/background. Homepage memakai fallback visual lokal untuk record yang tidak memiliki direct image URL, sementara judul, kategori, tanggal, dan ringkasan tetap berasal dari database.


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
