# SI PARIK BANGKA — Figma Theme Adaptation

Perubahan ini sengaja bersifat **visual/theme-only** pada halaman publik agar struktur yang sudah ada tetap aman.

## Yang dipertahankan
- Struktur JSX/komponen homepage.
- Grid dan jumlah card subsektor.
- Container sorotan Event/Berita/Pelaku Unggulan.
- Card berita dan acara.
- Container CTA pengajuan/dokumen.
- Container kontak dan footer.
- Routing, API, database, login, dropdown, dan fungsi aplikasi.

## Yang disesuaikan mengikuti arah Figma
- Palet teal menjadi navy + slate blue + pale blue.
- Navbar menjadi frosted/glass yang lebih dekat dengan mockup Figma.
- Hero dibuat lebih terang dan memakai nuansa foto pantai `/hero-bangka.jpg`.
- Overlay hero disederhanakan; decorative grid/orb disembunyikan.
- Tombol hero: putih dan navy.
- Semua card yang sudah ada hanya di-retheme warnanya; ukuran, radius, padding, dan struktur tidak diubah oleh override V34.
- Section subsektor/editorial/contact menggunakan background biru sangat muda.
- CTA dokumen dan footer menggunakan navy/slate.

Seluruh override berada di bagian paling bawah `app/globals.css` dengan heading **V34 — FIGMA THEME ADAPTATION**. File `FIGMA_THEME_OVERRIDE.css` disertakan bila ingin menerapkan patch secara manual pada versi project lain.
