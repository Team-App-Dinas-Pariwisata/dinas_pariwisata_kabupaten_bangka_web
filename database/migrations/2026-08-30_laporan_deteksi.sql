-- SI PARIK BANGKA
-- Laporan deteksi sampah dari aplikasi mobile MySQL + foto hasil deteksi di Cloudflare R2.
-- Aman dijalankan berulang karena memakai CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS `laporan_deteksi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nama_pelapor` varchar(150) NOT NULL,
  `lokasi_id` varchar(40) NOT NULL,
  `lokasi_jenis` varchar(40) NOT NULL,
  `lokasi_nama` varchar(255) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `catatan` text,
  `image_url` varchar(1000) DEFAULT NULL,
  `image_key` varchar(700) DEFAULT NULL,
  `image_kind` varchar(40) NOT NULL DEFAULT 'hasil_deteksi',
  `deteksi_utama` varchar(120) DEFAULT NULL,
  `confidence` decimal(8,7) DEFAULT NULL,
  `jumlah_objek` int unsigned NOT NULL DEFAULT '0',
  `deteksi_jenis` json DEFAULT NULL,
  `detections` json DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'baru',
  `source` varchar(80) NOT NULL DEFAULT 'flutter-mysql-r2',
  `reporter_user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_laporan_deteksi_created_at` (`created_at`),
  KEY `idx_laporan_deteksi_lokasi` (`lokasi_jenis`,`lokasi_id`),
  KEY `idx_laporan_deteksi_status` (`status`),
  KEY `idx_laporan_deteksi_reporter_user` (`reporter_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
