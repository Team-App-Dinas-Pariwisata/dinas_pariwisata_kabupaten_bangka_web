-- Migration: Tabel notifikasi internal untuk petugas dan admin
-- Jalankan di database dinas_pariwisata

CREATE TABLE IF NOT EXISTS notifikasi (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_role ENUM('admin','petugas','pengaju') NOT NULL COMMENT 'Role penerima notifikasi',
  target_user_id INT UNSIGNED NULL COMMENT 'NULL = broadcast ke semua user role tsb, atau ID user spesifik (misal akun pengaju)',
  judul VARCHAR(255) NOT NULL,
  pesan TEXT NOT NULL,
  jenis ENUM('pengajuan_baru','pengajuan_diperbaiki','verifikasi') NOT NULL,
  referensi_tipe ENUM('ekraf','sdm','komunitas') NULL,
  referensi_id INT UNSIGNED NULL COMMENT 'ID pengajuan terkait',
  pengirim_nama VARCHAR(255) NULL COMMENT 'Nama pengirim (pengaju/petugas)',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_unread (target_role, target_user_id, is_read, created_at DESC),
  INDEX idx_ref (referensi_tipe, referensi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jika tabel notifikasi sebelumnya sudah ada tanpa role pengaju, jalankan:
-- ALTER TABLE notifikasi MODIFY COLUMN target_role ENUM('admin','petugas','pengaju') NOT NULL;
