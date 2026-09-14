-- Migration: Tabel pengaturan sistem portal
-- Jalankan di database dinas_pariwisata

CREATE TABLE IF NOT EXISTS pengaturan_sistem (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  keterangan VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inisialisasi default flag mass delete pengajuan oleh petugas (1 = aktif, 0 = nonaktif)
INSERT INTO pengaturan_sistem (setting_key, setting_value, keterangan)
VALUES ('petugas_mass_delete_enabled', '1', 'Mengaktifkan fitur hapus massal pengajuan untuk akun petugas')
ON DUPLICATE KEY UPDATE keterangan = VALUES(keterangan);
