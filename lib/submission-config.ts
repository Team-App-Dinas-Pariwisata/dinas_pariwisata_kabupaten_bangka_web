export type SubmissionType = "ekraf" | "sdm" | "komunitas";
export type SubmissionLookup = "subsektor" | "kecamatan" | "kelurahan" | "komunitas";
export type SubmissionFieldType = "text" | "email" | "tel" | "number" | "date" | "year" | "textarea" | "select" | "checkbox" | "file";

export type SubmissionField = {
  key: string;
  label: string;
  type?: SubmissionFieldType;
  required?: boolean;
  placeholder?: string;
  lookup?: SubmissionLookup;
  dependsOn?: string;
  options?: { label: string; value: string }[];
  accept?: string;
  help?: string;
};

export type SubmissionStep = {
  title: string;
  shortTitle: string;
  description: string;
  fields: SubmissionField[];
};

export type SubmissionConfig = {
  type: SubmissionType;
  title: string;
  subtitle: string;
  registrationPrefix: string;
  table: string;
  steps: SubmissionStep[];
};

const genderOptions = [
  { label: "Laki-laki", value: "Laki-laki" },
  { label: "Perempuan", value: "Perempuan" },
];

export const submissionConfigs: Record<SubmissionType, SubmissionConfig> = {
  ekraf: {
    type: "ekraf",
    title: "Pengajuan Pelaku Ekraf",
    subtitle: "Lengkapi data pelaku dan usaha ekonomi kreatif dalam empat tahap.",
    registrationPrefix: "EKR",
    table: "pengajuan_ekraf",
    steps: [
      {
        title: "Identitas Pelaku",
        shortTitle: "Identitas",
        description: "Informasi dasar pemilik atau pelaku ekonomi kreatif.",
        fields: [
          { key: "nama_lengkap", label: "Nama Lengkap", required: true },
          { key: "nik", label: "NIK", required: true, placeholder: "16 digit NIK" },
          { key: "jenis_kelamin", label: "Jenis Kelamin", type: "select", options: genderOptions },
          { key: "tempat_lahir", label: "Tempat Lahir" },
          { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
          { key: "no_hp", label: "No. HP / WhatsApp", type: "tel", required: true },
          { key: "email", label: "Email", type: "email" },
          { key: "alamat", label: "Alamat Domisili", type: "textarea" },
          { key: "kecamatan_id", label: "Kecamatan", type: "select", lookup: "kecamatan" },
          { key: "kelurahan_id", label: "Desa / Kelurahan", type: "select", lookup: "kelurahan", dependsOn: "kecamatan_id" },
          { key: "kode_pos", label: "Kode Pos" },
          { key: "komunitas_id", label: "Komunitas / Asosiasi", type: "select", lookup: "komunitas", help: "Opsional jika Anda tergabung dalam komunitas." },
        ],
      },
      {
        title: "Profil Usaha",
        shortTitle: "Usaha",
        description: "Data usaha, subsektor, lokasi, dan skala aktivitas usaha.",
        fields: [
          { key: "nama_usaha", label: "Nama Usaha", required: true },
          { key: "nama_merek", label: "Nama Merek / Brand" },
          { key: "subsektor_id", label: "Subsektor Ekraf", type: "select", lookup: "subsektor", required: true },
          { key: "tahun_mulai_usaha", label: "Tahun Mulai Usaha", type: "year" },
          { key: "tahun_berdiri", label: "Tahun Berdiri", type: "year" },
          { key: "deskripsi_usaha", label: "Deskripsi Usaha", type: "textarea" },
          { key: "alamat_usaha", label: "Alamat Usaha", type: "textarea" },
          { key: "kecamatan_usaha_id", label: "Kecamatan Usaha", type: "select", lookup: "kecamatan" },
          { key: "kelurahan_usaha_id", label: "Desa / Kelurahan Usaha", type: "select", lookup: "kelurahan", dependsOn: "kecamatan_usaha_id" },
          { key: "latitude", label: "Latitude", type: "number", placeholder: "Contoh: -1.8742" },
          { key: "longitude", label: "Longitude", type: "number", placeholder: "Contoh: 106.1147" },
          { key: "jumlah_tenaga_kerja", label: "Jumlah Tenaga Kerja", type: "number" },
          { key: "omzet_per_tahun", label: "Omzet per Tahun (Rp)", type: "number" },
          { key: "media_sosial", label: "Media Sosial", placeholder: "Instagram / TikTok / Facebook" },
          { key: "website", label: "Website", placeholder: "https://..." },
        ],
      },
      {
        title: "Aktivitas & Pengembangan",
        shortTitle: "Pengembangan",
        description: "Ceritakan produk, pengalaman, kebutuhan, dan arah pengembangan usaha.",
        fields: [
          { key: "produk_jasa", label: "Produk / Jasa", type: "textarea" },
          { key: "visi_usaha", label: "Visi Usaha", type: "textarea" },
          { key: "misi_usaha", label: "Misi Usaha", type: "textarea" },
          { key: "prestasi", label: "Prestasi", type: "textarea" },
          { key: "pelatihan", label: "Pelatihan yang Pernah Diikuti", type: "textarea" },
          { key: "pameran", label: "Pameran / Kegiatan yang Pernah Diikuti", type: "textarea" },
          { key: "kendala_usaha", label: "Kendala Usaha", type: "textarea" },
          { key: "kebutuhan_pembinaan", label: "Kebutuhan Pembinaan", type: "textarea" },
        ],
      },
      {
        title: "Dokumen & Konfirmasi",
        shortTitle: "Dokumen",
        description: "Unggah dokumen pendukung. Dokumen yang tidak wajib dapat dikosongkan.",
        fields: [
          { key: "file_foto_diri", label: "Foto Diri", type: "file", accept: "image/*,.pdf" },
          { key: "file_logo_usaha", label: "Logo Usaha", type: "file", accept: "image/*,.pdf" },
          { key: "file_foto_dokumentasi", label: "Foto Dokumentasi", type: "file", accept: "image/*,.pdf" },
          { key: "file_sertifikat", label: "Sertifikat (Halal / PIRT / NIB / lainnya)", type: "file", accept: "image/*,.pdf" },
          { key: "file_sertifikat_pelatihan", label: "Sertifikat Pelatihan", type: "file", accept: "image/*,.pdf" },
          { key: "konfirmasi_kebenaran", label: "Saya menyatakan data yang diisi benar dan dapat diverifikasi oleh Dinas Pariwisata Kabupaten Bangka.", type: "checkbox", required: true },
        ],
      },
    ],
  },
  sdm: {
    type: "sdm",
    title: "Pengajuan Pelaku SDM Pariwisata",
    subtitle: "Pendataan sumber daya manusia pariwisata melalui empat tahap sederhana.",
    registrationPrefix: "SDM",
    table: "pengajuan_sdm_pariwisata",
    steps: [
      {
        title: "Identitas Pribadi",
        shortTitle: "Identitas",
        description: "Masukkan data diri pelaku SDM pariwisata.",
        fields: [
          { key: "nama_lengkap", label: "Nama Lengkap", required: true },
          { key: "nik", label: "NIK", required: true, placeholder: "16 digit NIK" },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "no_hp", label: "No. HP / WhatsApp", type: "tel", required: true },
          { key: "npwp", label: "NPWP" },
          { key: "alamat", label: "Alamat Domisili", type: "textarea", required: true },
        ],
      },
      {
        title: "Informasi Pekerjaan",
        shortTitle: "Pekerjaan",
        description: "Data jabatan dan tempat Anda bertugas di sektor pariwisata.",
        fields: [
          { key: "jabatan", label: "Jabatan / Posisi", required: true },
          { key: "tempat_bertugas", label: "Tempat Bertugas", required: true },
          { key: "alamat_bertugas", label: "Alamat Tempat Bertugas", type: "textarea", required: true },
          { key: "bulan_mulai_bertugas", label: "Bulan Mulai Bertugas", type: "select", required: true, options: [
            { label: "Januari", value: "1" }, { label: "Februari", value: "2" }, { label: "Maret", value: "3" },
            { label: "April", value: "4" }, { label: "Mei", value: "5" }, { label: "Juni", value: "6" },
            { label: "Juli", value: "7" }, { label: "Agustus", value: "8" }, { label: "September", value: "9" },
            { label: "Oktober", value: "10" }, { label: "November", value: "11" }, { label: "Desember", value: "12" },
          ] },
          { key: "tahun_mulai_bertugas", label: "Tahun Mulai Bertugas", type: "year", required: true },
        ],
      },
      {
        title: "Dokumen Pendukung",
        shortTitle: "Dokumen",
        description: "Tambahkan foto diri dan sertifikat pelatihan bila tersedia.",
        fields: [
          { key: "file_foto_diri", label: "Foto Diri", type: "file", accept: "image/*,.pdf" },
          { key: "file_sertifikat_pelatihan", label: "Sertifikat Pelatihan", type: "file", accept: "image/*,.pdf" },
        ],
      },
      {
        title: "Publikasi & Konfirmasi",
        shortTitle: "Konfirmasi",
        description: "Tentukan persetujuan publikasi dan konfirmasi kebenaran data.",
        fields: [
          { key: "persetujuan_publikasi", label: "Saya menyetujui data yang telah diverifikasi untuk dipublikasikan pada portal APPEKRAF Kabupaten Bangka.", type: "checkbox" },
          { key: "konfirmasi_kebenaran", label: "Saya menyatakan seluruh data yang saya kirim benar dan dapat diverifikasi.", type: "checkbox", required: true },
        ],
      },
    ],
  },
  komunitas: {
    type: "komunitas",
    title: "Pengajuan Komunitas / Asosiasi / Lembaga",
    subtitle: "Daftarkan organisasi kreatif Anda dengan alur empat tahap.",
    registrationPrefix: "KLA",
    table: "pengajuan_komunitas_asosiasi",
    steps: [
      {
        title: "Identitas Organisasi",
        shortTitle: "Organisasi",
        description: "Informasi dasar komunitas, asosiasi, lembaga, atau industri kreatif.",
        fields: [
          { key: "nama_organisasi", label: "Nama Organisasi", required: true },
          { key: "kategori", label: "Kategori", type: "select", required: true, options: [
            { label: "Komunitas", value: "Komunitas" }, { label: "Industri Kreatif", value: "Industri Kreatif" },
            { label: "Lembaga", value: "Lembaga" }, { label: "Asosiasi", value: "Asosiasi" },
          ] },
          { key: "email", label: "Email Organisasi", type: "email", required: true },
          { key: "tahun_berdiri", label: "Tahun Berdiri", type: "year", required: true },
          { key: "kecamatan_id", label: "Kecamatan", type: "select", lookup: "kecamatan", required: true },
          { key: "kelurahan_id", label: "Desa / Kelurahan", type: "select", lookup: "kelurahan", dependsOn: "kecamatan_id", required: true },
          { key: "alamat", label: "Alamat Organisasi", type: "textarea", required: true },
        ],
      },
      {
        title: "Profil & Kepengurusan",
        shortTitle: "Profil",
        description: "Lengkapi subsektor, profil badan hukum, dan data ketua organisasi.",
        fields: [
          { key: "subsektor_id", label: "Subsektor Ekraf", type: "select", lookup: "subsektor" },
          { key: "status_badan_hukum", label: "Status Badan Hukum", type: "select", required: true, options: [
            { label: "Tidak Ada", value: "Tidak Ada" }, { label: "Ada", value: "Ada" },
          ] },
          { key: "nomor_akta", label: "Nomor Akta" },
          { key: "rincian", label: "Rincian Kegiatan / Bidang", type: "textarea" },
          { key: "visi_misi", label: "Visi & Misi", type: "textarea" },
          { key: "nama_ketua", label: "Nama Ketua", required: true },
          { key: "no_hp_ketua", label: "No. HP Ketua", type: "tel", required: true },
        ],
      },
      {
        title: "Lokasi & Dokumen",
        shortTitle: "Dokumen",
        description: "Tambahkan koordinat dan dokumen pendukung organisasi.",
        fields: [
          { key: "latitude", label: "Latitude", type: "number" },
          { key: "longitude", label: "Longitude", type: "number" },
          { key: "file_logo_organisasi", label: "Logo Organisasi", type: "file", accept: "image/*,.pdf" },
          { key: "file_foto_dokumentasi", label: "Foto Dokumentasi", type: "file", accept: "image/*,.pdf" },
          { key: "file_akta_badan_hukum", label: "Akta Badan Hukum", type: "file", accept: "image/*,.pdf" },
        ],
      },
      {
        title: "Publikasi & Konfirmasi",
        shortTitle: "Konfirmasi",
        description: "Konfirmasi data sebelum pengajuan dikirim ke petugas verifikasi.",
        fields: [
          { key: "persetujuan_publikasi", label: "Saya menyetujui profil organisasi yang telah diverifikasi untuk dipublikasikan.", type: "checkbox" },
          { key: "konfirmasi_kebenaran", label: "Saya menyatakan seluruh data yang saya kirim benar dan dapat diverifikasi.", type: "checkbox", required: true },
        ],
      },
    ],
  },
};

export function allSubmissionFields(type: SubmissionType) {
  return submissionConfigs[type].steps.flatMap((step) => step.fields);
}
