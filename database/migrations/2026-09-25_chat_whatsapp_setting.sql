-- Migration: Pengaturan Tautan WhatsApp Kotak Chat Pengunjung
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

-- Inisialisasi default nomor dan pesan WhatsApp untuk chat pengunjung
INSERT INTO pengaturan_sistem (setting_key, setting_value, keterangan)
VALUES 
  ('chat_whatsapp_number', '081200002026', 'Nomor WhatsApp petugas untuk tautan chat pengunjung'),
  ('chat_whatsapp_message', 'Halo Petugas SI PARIK Dinas Pariwisata Kabupaten Bangka, saya ingin bertanya seputar layanan SI PARIK.', 'Teks pesan pembuka WhatsApp pengunjung'),
  ('chat_whatsapp_enabled', '1', 'Status aktif tombol WhatsApp di kotak chat pengunjung')
ON DUPLICATE KEY UPDATE keterangan = VALUES(keterangan);
