export type LookupName =
  | "kategori-berita"
  | "kategori-acara"
  | "kategori-wisata"
  | "kategori-kuliner"
  | "jenis-hotel"
  | "kecamatan"
  | "kelurahan"
  | "status-konservasi"
  | "fasilitas-hotel"
  | "fasilitas-kuliner"
  | "fasilitas-wisata";

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "email" | "url" | "number" | "date" | "time" | "datetime-local" | "textarea" | "select" | "checkbox" | "multicheck" | "image";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  lookup?: LookupName;
  dependsOn?: string;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number | "any";
};

export type ResourceConfig = {
  table: "berita" | "acara" | "tempat_wisata" | "hotel" | "kuliner" | "satwa_endemik";
  label: string;
  select: string[];
  writable: string[];
  required: string[];
  searchFields: string[];
  orderBy: string;
  fields: ResourceField[];
  columns: { key: string; label: string }[];
};

export const resourceConfigs: Record<string, ResourceConfig> = {
  berita: {
    table: "berita",
    label: "Berita",
    select: [
      "id", "kategori_berita_id", "slug", "judul", "subjudul", "ringkasan", "isi", "penulis_tampil",
      "sumber_nama", "sumber_url", "foto_utama", "foto_alt", "kata_kunci", "headline", "urutan_tampil",
      "dipublikasikan", "tanggal_publikasi", "aktif", "created_at", "updated_at",
    ],
    writable: [
      "kategori_berita_id", "judul", "subjudul", "ringkasan", "isi", "penulis_tampil", "sumber_nama", "sumber_url",
      "foto_utama", "foto_alt", "kata_kunci", "headline", "urutan_tampil", "dipublikasikan", "tanggal_publikasi", "aktif",
    ],
    required: ["kategori_berita_id", "judul", "isi"],
    searchFields: ["judul", "subjudul", "ringkasan", "isi", "penulis_tampil", "kata_kunci"],
    orderBy: "created_at DESC",
    fields: [
      { key: "kategori_berita_id", label: "Kategori Berita", type: "select", required: true, lookup: "kategori-berita" },
      { key: "judul", label: "Judul", required: true, placeholder: "Judul berita" },
      { key: "subjudul", label: "Subjudul", placeholder: "Subjudul opsional" },
      { key: "ringkasan", label: "Ringkasan", type: "textarea", placeholder: "Ringkasan singkat berita" },
      { key: "isi", label: "Isi Berita", type: "textarea", required: true, placeholder: "Isi lengkap berita" },
      { key: "penulis_tampil", label: "Nama Penulis" },
      { key: "sumber_nama", label: "Nama Sumber" },
      { key: "sumber_url", label: "Tautan Sumber", type: "url", placeholder: "https://..." },
      { key: "foto_utama", label: "Foto Utama", type: "image", placeholder: "Unggah gambar ke Cloudflare R2" },
      { key: "foto_alt", label: "Teks Alternatif Foto" },
      { key: "kata_kunci", label: "Kata Kunci", placeholder: "ekraf, bangka, pariwisata" },
      { key: "headline", label: "Jadikan Headline", type: "checkbox" },
      { key: "urutan_tampil", label: "Urutan Tampil", type: "number" },
      { key: "dipublikasikan", label: "Dipublikasikan", type: "checkbox" },
      { key: "tanggal_publikasi", label: "Tanggal Publikasi", type: "datetime-local" },
      { key: "aktif", label: "Aktif", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "foto_utama", label: "Gambar" },
      { key: "judul", label: "Judul" },
      { key: "penulis_tampil", label: "Penulis" },
      { key: "dipublikasikan", label: "Publik" },
      { key: "headline", label: "Headline" },
      { key: "created_at", label: "Dibuat" },
    ],
  },
  acara: {
    table: "acara",
    label: "Acara",
    select: [
      "id", "kategori_acara_id", "slug", "nama_acara", "ringkasan", "deskripsi", "tanggal_mulai", "tanggal_selesai",
      "sepanjang_hari", "status_acara", "jenis_pelaksanaan", "nama_lokasi", "alamat", "tautan_daring", "penyelenggara",
      "narahubung_nama", "narahubung_telepon", "narahubung_email", "memerlukan_pendaftaran", "tautan_pendaftaran",
      "tanggal_buka_pendaftaran", "tanggal_tutup_pendaftaran", "kuota", "gratis", "harga_mulai", "harga_sampai",
      "syarat_ketentuan", "foto_utama", "foto_alt", "video_url", "kata_kunci", "unggulan", "urutan_tampil",
      "dipublikasikan", "tanggal_publikasi", "aktif", "created_at", "updated_at",
    ],
    writable: [
      "kategori_acara_id", "nama_acara", "ringkasan", "deskripsi", "tanggal_mulai", "tanggal_selesai", "sepanjang_hari",
      "status_acara", "jenis_pelaksanaan", "nama_lokasi", "alamat", "tautan_daring", "penyelenggara", "narahubung_nama",
      "narahubung_telepon", "narahubung_email", "memerlukan_pendaftaran", "tautan_pendaftaran", "tanggal_buka_pendaftaran",
      "tanggal_tutup_pendaftaran", "kuota", "gratis", "harga_mulai", "harga_sampai", "syarat_ketentuan", "foto_utama",
      "foto_alt", "video_url", "kata_kunci", "unggulan", "urutan_tampil", "dipublikasikan", "tanggal_publikasi", "aktif",
    ],
    required: ["kategori_acara_id", "nama_acara", "deskripsi", "tanggal_mulai", "tanggal_selesai"],
    searchFields: ["nama_acara", "ringkasan", "deskripsi", "nama_lokasi", "penyelenggara", "kata_kunci"],
    orderBy: "tanggal_mulai DESC",
    fields: [
      { key: "kategori_acara_id", label: "Kategori Acara", type: "select", required: true, lookup: "kategori-acara" },
      { key: "nama_acara", label: "Nama Acara", required: true },
      { key: "ringkasan", label: "Ringkasan", type: "textarea" },
      { key: "deskripsi", label: "Deskripsi", type: "textarea", required: true },
      { key: "tanggal_mulai", label: "Tanggal Mulai", type: "datetime-local", required: true },
      { key: "tanggal_selesai", label: "Tanggal Selesai", type: "datetime-local", required: true },
      { key: "sepanjang_hari", label: "Sepanjang Hari", type: "checkbox" },
      { key: "status_acara", label: "Status Acara", type: "select", defaultValue: "Dijadwalkan", options: [
        { label: "Dijadwalkan", value: "Dijadwalkan" }, { label: "Berlangsung", value: "Berlangsung" },
        { label: "Selesai", value: "Selesai" }, { label: "Ditunda", value: "Ditunda" }, { label: "Dibatalkan", value: "Dibatalkan" },
      ] },
      { key: "jenis_pelaksanaan", label: "Jenis Pelaksanaan", type: "select", defaultValue: "Luring", options: [
        { label: "Luring", value: "Luring" }, { label: "Daring", value: "Daring" }, { label: "Hibrida", value: "Hibrida" },
      ] },
      { key: "nama_lokasi", label: "Nama Lokasi" },
      { key: "alamat", label: "Alamat", type: "textarea" },
      { key: "tautan_daring", label: "Tautan Daring", type: "url", placeholder: "https://..." },
      { key: "penyelenggara", label: "Penyelenggara" },
      { key: "narahubung_nama", label: "Nama Narahubung" },
      { key: "narahubung_telepon", label: "Telepon Narahubung" },
      { key: "narahubung_email", label: "Email Narahubung", type: "email" },
      { key: "memerlukan_pendaftaran", label: "Memerlukan Pendaftaran", type: "checkbox" },
      { key: "tautan_pendaftaran", label: "Tautan Pendaftaran", type: "url", placeholder: "https://..." },
      { key: "tanggal_buka_pendaftaran", label: "Buka Pendaftaran", type: "datetime-local" },
      { key: "tanggal_tutup_pendaftaran", label: "Tutup Pendaftaran", type: "datetime-local" },
      { key: "kuota", label: "Kuota", type: "number" },
      { key: "gratis", label: "Gratis", type: "checkbox", defaultValue: true },
      { key: "harga_mulai", label: "Harga Mulai", type: "number" },
      { key: "harga_sampai", label: "Harga Sampai", type: "number" },
      { key: "syarat_ketentuan", label: "Syarat & Ketentuan", type: "textarea" },
      { key: "foto_utama", label: "Foto Utama", type: "image", placeholder: "Unggah gambar ke Cloudflare R2" },
      { key: "foto_alt", label: "Teks Alternatif Foto" },
      { key: "video_url", label: "URL Video", type: "url", placeholder: "https://..." },
      { key: "kata_kunci", label: "Kata Kunci" },
      { key: "unggulan", label: "Acara Unggulan", type: "checkbox" },
      { key: "urutan_tampil", label: "Urutan Tampil", type: "number" },
      { key: "dipublikasikan", label: "Dipublikasikan", type: "checkbox" },
      { key: "tanggal_publikasi", label: "Tanggal Publikasi", type: "datetime-local" },
      { key: "aktif", label: "Aktif", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "foto_utama", label: "Gambar" },
      { key: "nama_acara", label: "Acara" },
      { key: "tanggal_mulai", label: "Mulai" },
      { key: "status_acara", label: "Status" },
      { key: "jenis_pelaksanaan", label: "Pelaksanaan" },
      { key: "nama_lokasi", label: "Lokasi" },
    ],
  },
  "tempat-wisata": {
    table: "tempat_wisata",
    label: "Tempat Wisata",
    select: [
      "id", "slug", "nama_tempat", "kategori_wisata_id",
      "(SELECT nama_kategori FROM master_kategori_wisata WHERE id = kategori_wisata_id) AS kategori_wisata",
      "nama_pengelola", "jenis_pengelola", "deskripsi_singkat", "deskripsi", "sejarah", "daya_tarik_utama",
      "alamat", "kecamatan_id", "(SELECT nama_kecamatan FROM master_kecamatan WHERE id = kecamatan_id) AS kecamatan",
      "kelurahan_id", "kode_pos", "latitude", "longitude", "telepon", "whatsapp", "email", "website", "instagram", "facebook", "tiktok",
      "harga_tiket_domestik_dewasa", "harga_tiket_domestik_anak", "harga_tiket_mancanegara", "biaya_parkir",
      "waktu_kunjungan_terbaik", "durasi_kunjungan", "durasi_kunjungan_menit", "cocok_anak", "cocok_keluarga", "ramah_lansia",
      "tingkat_kesulitan_akses", "akses_transportasi", "aksesibilitas", "peraturan_pengunjung", "informasi_keselamatan", "kontak_darurat",
      "foto_utama", "video_url", "virtual_tour_url", "unggulan", "urutan_tampil", "dipublikasikan", "tanggal_publikasi", "aktif", "created_at", "updated_at",
    ],
    writable: [
      "kategori_wisata_id", "nama_tempat", "nama_pengelola", "jenis_pengelola", "deskripsi_singkat", "deskripsi", "sejarah", "daya_tarik_utama",
      "alamat", "kecamatan_id", "kelurahan_id", "kode_pos", "latitude", "longitude", "telepon", "whatsapp", "email", "website", "instagram", "facebook", "tiktok",
      "harga_tiket_domestik_dewasa", "harga_tiket_domestik_anak", "harga_tiket_mancanegara", "biaya_parkir", "waktu_kunjungan_terbaik",
      "durasi_kunjungan", "durasi_kunjungan_menit", "cocok_anak", "cocok_keluarga", "ramah_lansia", "tingkat_kesulitan_akses",
      "akses_transportasi", "aksesibilitas", "peraturan_pengunjung", "informasi_keselamatan", "kontak_darurat", "foto_utama", "video_url", "virtual_tour_url",
      "unggulan", "urutan_tampil", "dipublikasikan", "tanggal_publikasi", "aktif",
    ],
    required: ["kategori_wisata_id", "nama_tempat", "alamat"],
    searchFields: ["nama_tempat", "nama_pengelola", "deskripsi_singkat", "deskripsi", "alamat", "daya_tarik_utama"],
    orderBy: "created_at DESC",
    fields: [
      { key: "nama_tempat", label: "Nama Tempat Wisata", required: true, placeholder: "Contoh: Pantai Matras" },
      { key: "kategori_wisata_id", label: "Kategori Wisata", type: "select", required: true, lookup: "kategori-wisata" },
      { key: "nama_pengelola", label: "Nama Pengelola" },
      { key: "jenis_pengelola", label: "Jenis Pengelola", type: "select", defaultValue: "Masyarakat", options: [
        { label: "Pemerintah", value: "Pemerintah" }, { label: "BUMN/BUMD", value: "BUMN/BUMD" }, { label: "Swasta", value: "Swasta" },
        { label: "Komunitas", value: "Komunitas" }, { label: "Masyarakat", value: "Masyarakat" }, { label: "Perorangan", value: "Perorangan" }, { label: "Lainnya", value: "Lainnya" },
      ] },
      { key: "deskripsi_singkat", label: "Deskripsi Singkat", type: "textarea" },
      { key: "deskripsi", label: "Deskripsi Lengkap", type: "textarea" },
      { key: "sejarah", label: "Sejarah", type: "textarea" },
      { key: "daya_tarik_utama", label: "Daya Tarik Utama", type: "textarea" },
      { key: "alamat", label: "Alamat", type: "textarea", required: true },
      { key: "fasilitas_ids", label: "Fasilitas Wisata", type: "multicheck", lookup: "fasilitas-wisata" },
      { key: "kecamatan_id", label: "Kecamatan", type: "select", lookup: "kecamatan" },
      { key: "kelurahan_id", label: "Desa/Kelurahan", type: "select", lookup: "kelurahan", dependsOn: "kecamatan_id" },
      { key: "kode_pos", label: "Kode Pos" },
      { key: "latitude", label: "Latitude", type: "number", min: -90, max: 90, step: "any", placeholder: "-1.8648000" },
      { key: "longitude", label: "Longitude", type: "number", min: -180, max: 180, step: "any", placeholder: "106.1149000" },
      { key: "telepon", label: "Telepon" }, { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "Email", type: "email" },
      { key: "website", label: "Website", type: "url", placeholder: "https://..." }, { key: "instagram", label: "Instagram" }, { key: "facebook", label: "Facebook" }, { key: "tiktok", label: "TikTok" },
      { key: "harga_tiket_domestik_dewasa", label: "Tiket Domestik Dewasa", type: "number", min: 0 },
      { key: "harga_tiket_domestik_anak", label: "Tiket Domestik Anak", type: "number", min: 0 },
      { key: "harga_tiket_mancanegara", label: "Tiket Mancanegara", type: "number", min: 0 },
      { key: "biaya_parkir", label: "Biaya Parkir" },
      { key: "waktu_kunjungan_terbaik", label: "Waktu Kunjungan Terbaik" }, { key: "durasi_kunjungan", label: "Durasi Kunjungan" },
      { key: "durasi_kunjungan_menit", label: "Durasi (menit)", type: "number", min: 0 },
      { key: "cocok_anak", label: "Cocok untuk Anak", type: "checkbox" }, { key: "cocok_keluarga", label: "Cocok untuk Keluarga", type: "checkbox", defaultValue: true },
      { key: "ramah_lansia", label: "Ramah Lansia", type: "checkbox" },
      { key: "tingkat_kesulitan_akses", label: "Tingkat Kesulitan Akses", type: "select", defaultValue: "Sedang", options: [
        { label: "Sangat Mudah", value: "Sangat Mudah" }, { label: "Mudah", value: "Mudah" }, { label: "Sedang", value: "Sedang" }, { label: "Sulit", value: "Sulit" }, { label: "Sangat Sulit", value: "Sangat Sulit" },
      ] },
      { key: "akses_transportasi", label: "Akses Transportasi", type: "textarea" }, { key: "aksesibilitas", label: "Aksesibilitas", type: "textarea" },
      { key: "peraturan_pengunjung", label: "Peraturan Pengunjung", type: "textarea" }, { key: "informasi_keselamatan", label: "Informasi Keselamatan", type: "textarea" },
      { key: "kontak_darurat", label: "Kontak Darurat" },
      { key: "foto_utama", label: "Foto Utama", type: "image" }, { key: "video_url", label: "URL Video", type: "url", placeholder: "https://..." },
      { key: "virtual_tour_url", label: "URL Virtual Tour", type: "url", placeholder: "https://..." },
      { key: "unggulan", label: "Destinasi Unggulan", type: "checkbox" }, { key: "urutan_tampil", label: "Urutan Tampil", type: "number", min: 0, defaultValue: 0 },
      { key: "dipublikasikan", label: "Dipublikasikan", type: "checkbox" }, { key: "tanggal_publikasi", label: "Tanggal Publikasi", type: "datetime-local" },
      { key: "aktif", label: "Aktif", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "foto_utama", label: "Gambar" }, { key: "nama_tempat", label: "Tempat Wisata" }, { key: "kategori_wisata", label: "Kategori" },
      { key: "kecamatan", label: "Kecamatan" }, { key: "dipublikasikan", label: "Publik" }, { key: "aktif", label: "Aktif" },
    ],
  },
  hotel: {
    table: "hotel",
    label: "Hotel",
    select: [
      "id", "slug", "nama_hotel", "jenis_hotel_id", "(SELECT nama_jenis FROM master_jenis_hotel WHERE id = jenis_hotel_id) AS jenis_hotel",
      "klasifikasi_bintang", "nama_pengelola", "deskripsi_singkat", "deskripsi", "alamat", "kecamatan_id",
      "(SELECT nama_kecamatan FROM master_kecamatan WHERE id = kecamatan_id) AS kecamatan", "kelurahan_id", "kode_pos", "latitude", "longitude",
      "telepon", "whatsapp", "email", "website", "instagram", "facebook", "jam_check_in", "jam_check_out", "jumlah_kamar", "harga_mulai", "harga_sampai",
      "informasi_reservasi", "kebijakan_hotel", "aksesibilitas", "nomor_izin_usaha", "nomor_sertifikat_chse", "foto_utama", "video_url",
      "unggulan", "urutan_tampil", "dipublikasikan", "tanggal_publikasi", "aktif", "created_at", "updated_at",
    ],
    writable: [
      "nama_hotel", "jenis_hotel_id", "klasifikasi_bintang", "nama_pengelola", "deskripsi_singkat", "deskripsi", "alamat", "kecamatan_id", "kelurahan_id", "kode_pos",
      "latitude", "longitude", "telepon", "whatsapp", "email", "website", "instagram", "facebook", "jam_check_in", "jam_check_out", "jumlah_kamar", "harga_mulai", "harga_sampai",
      "informasi_reservasi", "kebijakan_hotel", "aksesibilitas", "nomor_izin_usaha", "nomor_sertifikat_chse", "foto_utama", "video_url", "unggulan", "urutan_tampil",
      "dipublikasikan", "tanggal_publikasi", "aktif",
    ],
    required: ["nama_hotel", "jenis_hotel_id", "alamat"],
    searchFields: ["nama_hotel", "nama_pengelola", "deskripsi_singkat", "deskripsi", "alamat"],
    orderBy: "created_at DESC",
    fields: [
      { key: "nama_hotel", label: "Nama Hotel", required: true }, { key: "jenis_hotel_id", label: "Jenis Hotel", type: "select", required: true, lookup: "jenis-hotel" },
      { key: "klasifikasi_bintang", label: "Klasifikasi Bintang", type: "number", min: 0, max: 5 }, { key: "nama_pengelola", label: "Nama Pengelola" },
      { key: "deskripsi_singkat", label: "Deskripsi Singkat", type: "textarea" }, { key: "deskripsi", label: "Deskripsi Lengkap", type: "textarea" },
      { key: "alamat", label: "Alamat", type: "textarea", required: true }, { key: "kecamatan_id", label: "Kecamatan", type: "select", lookup: "kecamatan" },
      { key: "fasilitas_ids", label: "Fasilitas Hotel", type: "multicheck", lookup: "fasilitas-hotel" },
      { key: "kelurahan_id", label: "Desa/Kelurahan", type: "select", lookup: "kelurahan", dependsOn: "kecamatan_id" }, { key: "kode_pos", label: "Kode Pos" },
      { key: "latitude", label: "Latitude", type: "number", min: -90, max: 90, step: "any" }, { key: "longitude", label: "Longitude", type: "number", min: -180, max: 180, step: "any" },
      { key: "telepon", label: "Telepon" }, { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "Email", type: "email" }, { key: "website", label: "Website", type: "url", placeholder: "https://..." },
      { key: "instagram", label: "Instagram" }, { key: "facebook", label: "Facebook" }, { key: "jam_check_in", label: "Jam Check-in", type: "time" }, { key: "jam_check_out", label: "Jam Check-out", type: "time" },
      { key: "jumlah_kamar", label: "Jumlah Kamar", type: "number", min: 0 }, { key: "harga_mulai", label: "Harga Mulai", type: "number", min: 0 }, { key: "harga_sampai", label: "Harga Sampai", type: "number", min: 0 },
      { key: "informasi_reservasi", label: "Informasi Reservasi", type: "textarea" }, { key: "kebijakan_hotel", label: "Kebijakan Hotel", type: "textarea" }, { key: "aksesibilitas", label: "Aksesibilitas", type: "textarea" },
      { key: "nomor_izin_usaha", label: "Nomor Izin Usaha" }, { key: "nomor_sertifikat_chse", label: "Nomor Sertifikat CHSE" },
      { key: "foto_utama", label: "Foto Utama", type: "image" }, { key: "video_url", label: "URL Video", type: "url", placeholder: "https://..." },
      { key: "unggulan", label: "Hotel Unggulan", type: "checkbox" }, { key: "urutan_tampil", label: "Urutan Tampil", type: "number", min: 0, defaultValue: 0 },
      { key: "dipublikasikan", label: "Dipublikasikan", type: "checkbox" }, { key: "tanggal_publikasi", label: "Tanggal Publikasi", type: "datetime-local" }, { key: "aktif", label: "Aktif", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "foto_utama", label: "Gambar" }, { key: "nama_hotel", label: "Hotel" }, { key: "jenis_hotel", label: "Jenis" }, { key: "klasifikasi_bintang", label: "Bintang" },
      { key: "kecamatan", label: "Kecamatan" }, { key: "dipublikasikan", label: "Publik" },
    ],
  },
  kuliner: {
    table: "kuliner",
    label: "Kuliner",
    select: [
      "id", "slug", "nama_usaha", "kategori_kuliner_id", "(SELECT nama_kategori FROM master_kategori_kuliner WHERE id = kategori_kuliner_id) AS kategori_kuliner",
      "nama_pemilik", "deskripsi_singkat", "deskripsi", "menu_unggulan", "cita_rasa_khas", "alamat", "kecamatan_id",
      "(SELECT nama_kecamatan FROM master_kecamatan WHERE id = kecamatan_id) AS kecamatan", "kelurahan_id", "kode_pos", "latitude", "longitude", "telepon", "whatsapp", "email",
      "website", "instagram", "facebook", "tiktok", "harga_mulai", "harga_sampai", "kapasitas_pengunjung", "tersedia_dine_in", "tersedia_takeaway", "tersedia_delivery",
      "menerima_reservasi", "status_halal", "nomor_sertifikat_halal", "nomor_pirt", "nomor_nib", "metode_pembayaran", "foto_utama", "video_url", "unggulan", "urutan_tampil",
      "dipublikasikan", "tanggal_publikasi", "aktif", "created_at", "updated_at",
    ],
    writable: [
      "nama_usaha", "kategori_kuliner_id", "nama_pemilik", "deskripsi_singkat", "deskripsi", "menu_unggulan", "cita_rasa_khas", "alamat", "kecamatan_id", "kelurahan_id", "kode_pos",
      "latitude", "longitude", "telepon", "whatsapp", "email", "website", "instagram", "facebook", "tiktok", "harga_mulai", "harga_sampai", "kapasitas_pengunjung",
      "tersedia_dine_in", "tersedia_takeaway", "tersedia_delivery", "menerima_reservasi", "status_halal", "nomor_sertifikat_halal", "nomor_pirt", "nomor_nib", "metode_pembayaran",
      "foto_utama", "video_url", "unggulan", "urutan_tampil", "dipublikasikan", "tanggal_publikasi", "aktif",
    ],
    required: ["nama_usaha", "kategori_kuliner_id", "alamat"],
    searchFields: ["nama_usaha", "nama_pemilik", "deskripsi_singkat", "deskripsi", "menu_unggulan", "alamat"],
    orderBy: "created_at DESC",
    fields: [
      { key: "nama_usaha", label: "Nama Usaha Kuliner", required: true }, { key: "kategori_kuliner_id", label: "Kategori Kuliner", type: "select", required: true, lookup: "kategori-kuliner" },
      { key: "nama_pemilik", label: "Nama Pemilik/Pengelola" }, { key: "deskripsi_singkat", label: "Deskripsi Singkat", type: "textarea" }, { key: "deskripsi", label: "Deskripsi Lengkap", type: "textarea" },
      { key: "menu_unggulan", label: "Menu Unggulan", type: "textarea" }, { key: "cita_rasa_khas", label: "Cita Rasa Khas", type: "textarea" },
      { key: "alamat", label: "Alamat", type: "textarea", required: true }, { key: "kecamatan_id", label: "Kecamatan", type: "select", lookup: "kecamatan" },
      { key: "fasilitas_ids", label: "Fasilitas Kuliner", type: "multicheck", lookup: "fasilitas-kuliner" },
      { key: "kelurahan_id", label: "Desa/Kelurahan", type: "select", lookup: "kelurahan", dependsOn: "kecamatan_id" }, { key: "kode_pos", label: "Kode Pos" },
      { key: "latitude", label: "Latitude", type: "number", min: -90, max: 90, step: "any" }, { key: "longitude", label: "Longitude", type: "number", min: -180, max: 180, step: "any" },
      { key: "telepon", label: "Telepon" }, { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "Email", type: "email" }, { key: "website", label: "Website", type: "url", placeholder: "https://..." },
      { key: "instagram", label: "Instagram" }, { key: "facebook", label: "Facebook" }, { key: "tiktok", label: "TikTok" },
      { key: "harga_mulai", label: "Harga Mulai", type: "number", min: 0 }, { key: "harga_sampai", label: "Harga Sampai", type: "number", min: 0 }, { key: "kapasitas_pengunjung", label: "Kapasitas Pengunjung", type: "number", min: 0 },
      { key: "tersedia_dine_in", label: "Dine-in", type: "checkbox", defaultValue: true }, { key: "tersedia_takeaway", label: "Takeaway", type: "checkbox", defaultValue: true },
      { key: "tersedia_delivery", label: "Delivery", type: "checkbox" }, { key: "menerima_reservasi", label: "Menerima Reservasi", type: "checkbox" },
      { key: "status_halal", label: "Status Halal", type: "select", defaultValue: "Belum Diketahui", options: [
        { label: "Belum Diketahui", value: "Belum Diketahui" }, { label: "Halal Bersertifikat", value: "Halal Bersertifikat" }, { label: "Klaim Halal", value: "Klaim Halal" },
        { label: "Tidak Halal", value: "Tidak Halal" }, { label: "Proses Sertifikasi", value: "Proses Sertifikasi" },
      ] },
      { key: "nomor_sertifikat_halal", label: "Nomor Sertifikat Halal" }, { key: "nomor_pirt", label: "Nomor PIRT" }, { key: "nomor_nib", label: "Nomor NIB" },
      { key: "metode_pembayaran", label: "Metode Pembayaran", type: "textarea" }, { key: "foto_utama", label: "Foto Utama", type: "image" }, { key: "video_url", label: "URL Video", type: "url", placeholder: "https://..." },
      { key: "unggulan", label: "Kuliner Unggulan", type: "checkbox" }, { key: "urutan_tampil", label: "Urutan Tampil", type: "number", min: 0, defaultValue: 0 },
      { key: "dipublikasikan", label: "Dipublikasikan", type: "checkbox" }, { key: "tanggal_publikasi", label: "Tanggal Publikasi", type: "datetime-local" }, { key: "aktif", label: "Aktif", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "foto_utama", label: "Gambar" }, { key: "nama_usaha", label: "Kuliner" }, { key: "kategori_kuliner", label: "Kategori" }, { key: "status_halal", label: "Status Halal" },
      { key: "kecamatan", label: "Kecamatan" }, { key: "dipublikasikan", label: "Publik" },
    ],
  },
  "satwa-endemik": {
    table: "satwa_endemik",
    label: "Satwa Endemik",
    select: [
      "id", "slug", "nama_umum", "nama_lokal", "nama_ilmiah", "kingdom", "filum", "kelas", "ordo", "famili", "genus", "status_endemisitas", "wilayah_endemik",
      "status_konservasi_id", "(SELECT CONCAT(kode, ' - ', nama_status) FROM master_status_konservasi WHERE id = status_konservasi_id) AS status_konservasi",
      "status_perlindungan_indonesia", "nomor_peraturan_perlindungan", "deskripsi_singkat", "deskripsi", "ciri_fisik", "habitat", "persebaran", "makanan", "perilaku", "reproduksi",
      "ancaman", "upaya_konservasi", "fakta_unik", "panduan_pengamatan", "peringatan_interaksi", "foto_utama", "audio_url", "video_url", "sumber_ringkas", "unggulan", "urutan_tampil",
      "dipublikasikan", "tanggal_publikasi", "aktif", "created_at", "updated_at",
    ],
    writable: [
      "nama_umum", "nama_lokal", "nama_ilmiah", "kingdom", "filum", "kelas", "ordo", "famili", "genus", "status_endemisitas", "wilayah_endemik", "status_konservasi_id",
      "status_perlindungan_indonesia", "nomor_peraturan_perlindungan", "deskripsi_singkat", "deskripsi", "ciri_fisik", "habitat", "persebaran", "makanan", "perilaku", "reproduksi", "ancaman",
      "upaya_konservasi", "fakta_unik", "panduan_pengamatan", "peringatan_interaksi", "foto_utama", "audio_url", "video_url", "sumber_ringkas", "unggulan", "urutan_tampil", "dipublikasikan",
      "tanggal_publikasi", "aktif",
    ],
    required: ["nama_umum", "nama_ilmiah"],
    searchFields: ["nama_umum", "nama_lokal", "nama_ilmiah", "wilayah_endemik", "deskripsi_singkat", "habitat", "persebaran"],
    orderBy: "created_at DESC",
    fields: [
      { key: "nama_umum", label: "Nama Umum", required: true }, { key: "nama_lokal", label: "Nama Lokal" }, { key: "nama_ilmiah", label: "Nama Ilmiah", required: true },
      { key: "kingdom", label: "Kingdom", defaultValue: "Animalia" }, { key: "filum", label: "Filum" }, { key: "kelas", label: "Kelas" }, { key: "ordo", label: "Ordo" }, { key: "famili", label: "Famili" }, { key: "genus", label: "Genus" },
      { key: "status_endemisitas", label: "Status Endemisitas", type: "select", defaultValue: "Endemik Regional", options: [
        { label: "Endemik Lokal", value: "Endemik Lokal" }, { label: "Endemik Regional", value: "Endemik Regional" }, { label: "Asli/Native", value: "Asli/Native" },
        { label: "Migran", value: "Migran" }, { label: "Introduksi", value: "Introduksi" },
      ] },
      { key: "wilayah_endemik", label: "Wilayah Endemik" }, { key: "status_konservasi_id", label: "Status Konservasi", type: "select", lookup: "status-konservasi" },
      { key: "status_perlindungan_indonesia", label: "Status Perlindungan Indonesia" }, { key: "nomor_peraturan_perlindungan", label: "Nomor/Peraturan Perlindungan" },
      { key: "deskripsi_singkat", label: "Deskripsi Singkat", type: "textarea" }, { key: "deskripsi", label: "Deskripsi Lengkap", type: "textarea" },
      { key: "ciri_fisik", label: "Ciri Fisik", type: "textarea" }, { key: "habitat", label: "Habitat", type: "textarea" }, { key: "persebaran", label: "Persebaran", type: "textarea" },
      { key: "makanan", label: "Makanan", type: "textarea" }, { key: "perilaku", label: "Perilaku", type: "textarea" }, { key: "reproduksi", label: "Reproduksi", type: "textarea" },
      { key: "ancaman", label: "Ancaman", type: "textarea" }, { key: "upaya_konservasi", label: "Upaya Konservasi", type: "textarea" }, { key: "fakta_unik", label: "Fakta Unik", type: "textarea" },
      { key: "panduan_pengamatan", label: "Panduan Pengamatan", type: "textarea" }, { key: "peringatan_interaksi", label: "Peringatan Interaksi", type: "textarea" },
      { key: "foto_utama", label: "Foto Utama", type: "image" }, { key: "audio_url", label: "URL Audio", type: "url", placeholder: "https://..." }, { key: "video_url", label: "URL Video", type: "url", placeholder: "https://..." },
      { key: "sumber_ringkas", label: "Sumber Ringkas", type: "textarea" }, { key: "unggulan", label: "Satwa Unggulan", type: "checkbox" }, { key: "urutan_tampil", label: "Urutan Tampil", type: "number", min: 0, defaultValue: 0 },
      { key: "dipublikasikan", label: "Dipublikasikan", type: "checkbox" }, { key: "tanggal_publikasi", label: "Tanggal Publikasi", type: "datetime-local" }, { key: "aktif", label: "Aktif", type: "checkbox", defaultValue: true },
    ],
    columns: [
      { key: "foto_utama", label: "Gambar" }, { key: "nama_umum", label: "Nama Umum" }, { key: "nama_ilmiah", label: "Nama Ilmiah" }, { key: "status_endemisitas", label: "Endemisitas" },
      { key: "status_konservasi", label: "Konservasi" }, { key: "dipublikasikan", label: "Publik" },
    ],
  },

};
