# Global Preloader SI PARIK BANGKA

Preloader sekarang aktif secara global untuk:

- loading awal pada seluruh halaman, termasuk dashboard, admin, petugas, akun, dan login;
- perpindahan halaman melalui link internal/Next.js App Router;
- Back/Forward browser;
- navigasi query URL;
- submit form yang melakukan navigasi native;
- proses `fetch()` aplikasi yang membutuhkan waktu lebih dari 110 ms, termasuk simpan, ubah, hapus, upload, pencarian, dan pemuatan data API.

Polling latar belakang Chat Guest/Staff dan heartbeat presence dikecualikan agar preloader tidak muncul berulang setiap 2–20 detik tanpa aksi pengguna. Mutasi pengiriman pesan tetap dapat memunculkan indikator proses.

Tampilan menggunakan preloader SI PARIK yang sudah ada dengan label kontekstual:

- `Menyiapkan SI PARIK BANGKA...`
- `Memuat halaman...`
- `Memproses data...`

Terdapat safety timeout navigasi 15 detik agar overlay tidak terkunci jika perpindahan route dibatalkan atau gagal.
