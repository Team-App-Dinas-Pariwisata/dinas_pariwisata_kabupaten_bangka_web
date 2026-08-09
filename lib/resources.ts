export type LookupName = "kategori-berita" | "kategori-acara";

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "email" | "url" | "number" | "date" | "datetime-local" | "textarea" | "select" | "checkbox" | "image";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  lookup?: LookupName;
};

export type ResourceConfig = {
  table: "berita" | "acara";
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
      { key: "aktif", label: "Aktif", type: "checkbox" },
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
      { key: "status_acara", label: "Status Acara", type: "select", options: [
        { label: "Dijadwalkan", value: "Dijadwalkan" }, { label: "Berlangsung", value: "Berlangsung" },
        { label: "Selesai", value: "Selesai" }, { label: "Ditunda", value: "Ditunda" }, { label: "Dibatalkan", value: "Dibatalkan" },
      ] },
      { key: "jenis_pelaksanaan", label: "Jenis Pelaksanaan", type: "select", options: [
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
      { key: "gratis", label: "Gratis", type: "checkbox" },
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
      { key: "aktif", label: "Aktif", type: "checkbox" },
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
};
