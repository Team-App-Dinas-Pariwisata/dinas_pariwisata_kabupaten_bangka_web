-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for dinas_pariwisata
DROP DATABASE IF EXISTS `dinas_pariwisata`;
CREATE DATABASE IF NOT EXISTS `dinas_pariwisata` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dinas_pariwisata`;

-- Dumping structure for table dinas_pariwisata.acara
DROP TABLE IF EXISTS `acara`;
CREATE TABLE IF NOT EXISTS `acara` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kategori_acara_id` int unsigned NOT NULL,
  `slug` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_acara` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ringkasan` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_mulai` datetime NOT NULL,
  `tanggal_selesai` datetime NOT NULL,
  `sepanjang_hari` tinyint(1) NOT NULL DEFAULT '0',
  `zona_waktu` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Jakarta',
  `status_acara` enum('Dijadwalkan','Berlangsung','Selesai','Ditunda','Dibatalkan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Dijadwalkan',
  `jenis_pelaksanaan` enum('Luring','Daring','Hibrida') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Luring',
  `nama_lokasi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `kecamatan_id` int unsigned DEFAULT NULL,
  `kelurahan_id` int unsigned DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `tautan_daring` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `penyelenggara` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `narahubung_nama` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `narahubung_telepon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `narahubung_email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `memerlukan_pendaftaran` tinyint(1) NOT NULL DEFAULT '0',
  `tautan_pendaftaran` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_buka_pendaftaran` datetime DEFAULT NULL,
  `tanggal_tutup_pendaftaran` datetime DEFAULT NULL,
  `kuota` int unsigned DEFAULT NULL,
  `gratis` tinyint(1) NOT NULL DEFAULT '1',
  `harga_mulai` decimal(14,2) DEFAULT NULL,
  `harga_sampai` decimal(14,2) DEFAULT NULL,
  `syarat_ketentuan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `foto_utama` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_alt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kata_kunci` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_deskripsi` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `urutan_tampil` int unsigned NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_acara_slug` (`slug`),
  KEY `idx_acara_kategori` (`kategori_acara_id`),
  KEY `idx_acara_tanggal` (`tanggal_mulai`,`tanggal_selesai`),
  KEY `idx_acara_publik` (`dipublikasikan`,`aktif`,`tanggal_publikasi`),
  KEY `idx_acara_status` (`status_acara`,`tanggal_mulai`),
  KEY `idx_acara_unggulan` (`unggulan`,`urutan_tampil`,`tanggal_mulai`),
  KEY `idx_acara_lokasi` (`kecamatan_id`,`kelurahan_id`),
  KEY `idx_acara_koordinat` (`latitude`,`longitude`),
  KEY `fk_acara_kelurahan` (`kelurahan_id`),
  KEY `fk_acara_created_by` (`created_by`),
  KEY `fk_acara_updated_by` (`updated_by`),
  FULLTEXT KEY `ft_acara_pencarian` (`nama_acara`,`ringkasan`,`deskripsi`,`penyelenggara`,`kata_kunci`),
  CONSTRAINT `fk_acara_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_acara_kategori` FOREIGN KEY (`kategori_acara_id`) REFERENCES `master_kategori_acara` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_acara_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `master_kecamatan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_acara_kelurahan` FOREIGN KEY (`kelurahan_id`) REFERENCES `master_kelurahan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_acara_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_acara_harga` CHECK (((`harga_mulai` is null) or (`harga_sampai` is null) or (`harga_sampai` >= `harga_mulai`))),
  CONSTRAINT `chk_acara_pendaftaran` CHECK (((`tanggal_buka_pendaftaran` is null) or (`tanggal_tutup_pendaftaran` is null) or (`tanggal_tutup_pendaftaran` >= `tanggal_buka_pendaftaran`))),
  CONSTRAINT `chk_acara_publikasi` CHECK (((`dipublikasikan` = 0) or (`tanggal_publikasi` is not null))),
  CONSTRAINT `chk_acara_tanggal` CHECK ((`tanggal_selesai` >= `tanggal_mulai`))
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.acara: ~30 rows (approximately)
DELETE FROM `acara`;
INSERT INTO `acara` (`id`, `kategori_acara_id`, `slug`, `nama_acara`, `ringkasan`, `deskripsi`, `tanggal_mulai`, `tanggal_selesai`, `sepanjang_hari`, `zona_waktu`, `status_acara`, `jenis_pelaksanaan`, `nama_lokasi`, `alamat`, `kecamatan_id`, `kelurahan_id`, `latitude`, `longitude`, `tautan_daring`, `penyelenggara`, `narahubung_nama`, `narahubung_telepon`, `narahubung_email`, `memerlukan_pendaftaran`, `tautan_pendaftaran`, `tanggal_buka_pendaftaran`, `tanggal_tutup_pendaftaran`, `kuota`, `gratis`, `harga_mulai`, `harga_sampai`, `syarat_ketentuan`, `foto_utama`, `foto_alt`, `video_url`, `kata_kunci`, `meta_judul`, `meta_deskripsi`, `unggulan`, `urutan_tampil`, `dipublikasikan`, `tanggal_publikasi`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 1, 'festival-ekonomi-kreatif-bangka-2026', 'Festival Ekonomi Kreatif Bangka 2026', 'Agenda dummy ke-1 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Festival Ekonomi Kreatif Bangka 2026 merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-12 08:30:00', '2026-08-12 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Taman Sari Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8568000, 106.1108000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-08-11 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Festival Ekonomi Kreatif Bangka 2026', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 1, 1, 1, '2026-08-07 07:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(2, 3, 'workshop-branding-produk-lokal', 'Workshop Branding Produk Lokal', 'Agenda dummy ke-2 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Workshop Branding Produk Lokal merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-15 08:30:00', '2026-08-15 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Gedung Sepintu Sedulang', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8643000, 106.1219000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-08-14 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Workshop Branding Produk Lokal', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 1, 2, 1, '2026-08-07 06:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(3, 2, 'bangka-creative-market-weekend', 'Bangka Creative Market Weekend', 'Agenda dummy ke-3 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Bangka Creative Market Weekend merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-18 08:30:00', '2026-08-18 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Alun-Alun Taman Merdeka', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8845000, 106.1547000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Bangka Creative Market Weekend', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 1, 3, 1, '2026-08-07 05:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(4, 10, 'forum-kolaborasi-komunitas-kreatif', 'Forum Kolaborasi Komunitas Kreatif', 'Agenda dummy ke-4 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Forum Kolaborasi Komunitas Kreatif merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-21 08:30:00', '2026-08-21 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -1.8452000, 106.1072000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-08-20 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Forum Kolaborasi Komunitas Kreatif', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 1, 4, 1, '2026-08-07 04:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(5, 3, 'pelatihan-fotografi-produk-umkm', 'Pelatihan Fotografi Produk UMKM', 'Agenda dummy ke-5 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pelatihan Fotografi Produk UMKM merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-24 08:30:00', '2026-08-25 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Hotel Manunggal Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.9012000, 106.1602000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-08-23 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Pelatihan Fotografi Produk UMKM', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 5, 1, '2026-08-07 03:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(6, 2, 'pameran-kriya-dan-fesyen-bangka', 'Pameran Kriya dan Fesyen Bangka', 'Agenda dummy ke-6 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pameran Kriya dan Fesyen Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-27 08:30:00', '2026-08-27 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Pantai Matras', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.6378000, 105.9888000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Pameran Kriya dan Fesyen Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 6, 1, '2026-08-07 02:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(7, 3, 'kelas-pemasaran-digital-untuk-pelaku-ekraf', 'Kelas Pemasaran Digital untuk Pelaku Ekraf', 'Agenda dummy ke-7 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Kelas Pemasaran Digital untuk Pelaku Ekraf merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-08-30 08:30:00', '2026-08-30 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Aula Dinas Pariwisata', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -2.0941000, 105.9032000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-08-29 18:00:00', 150, 0, 50000.00, 100000.00, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Kelas Pemasaran Digital untuk Pelaku Ekraf', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 7, 1, '2026-08-07 01:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(8, 10, 'temu-kreatif-kuliner-khas-bangka', 'Temu Kreatif Kuliner Khas Bangka', 'Agenda dummy ke-8 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Temu Kreatif Kuliner Khas Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-02 08:30:00', '2026-09-02 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -2.1379000, 105.9894000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-01 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Temu Kreatif Kuliner Khas Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 8, 1, '2026-08-07 00:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(9, 1, 'festival-musik-pesisir-bangka', 'Festival Musik Pesisir Bangka', 'Agenda dummy ke-9 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Festival Musik Pesisir Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-05 08:30:00', '2026-09-05 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Taman Sari Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8735000, 106.1416000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Festival Musik Pesisir Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 9, 1, '2026-08-07 23:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(10, 3, 'workshop-desain-kemasan-produk', 'Workshop Desain Kemasan Produk', 'Agenda dummy ke-10 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Workshop Desain Kemasan Produk merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-08 08:30:00', '2026-09-09 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Gedung Sepintu Sedulang', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8015000, 106.1162000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-07 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Workshop Desain Kemasan Produk', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 10, 1, '2026-08-07 22:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(11, 2, 'pameran-produk-unggulan-desa-kreatif', 'Pameran Produk Unggulan Desa Kreatif', 'Agenda dummy ke-11 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pameran Produk Unggulan Desa Kreatif merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-11 08:30:00', '2026-09-11 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Alun-Alun Taman Merdeka', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8555000, 106.1119000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-10 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Pameran Produk Unggulan Desa Kreatif', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 11, 1, '2026-08-07 21:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(12, 10, 'forum-pelaku-ekraf-perempuan-bangka', 'Forum Pelaku Ekraf Perempuan Bangka', 'Agenda dummy ke-12 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Forum Pelaku Ekraf Perempuan Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-14 08:30:00', '2026-09-14 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -1.8630000, 106.1230000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Forum Pelaku Ekraf Perempuan Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 12, 1, '2026-08-07 20:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(13, 3, 'kelas-konten-kreatif-untuk-pariwisata', 'Kelas Konten Kreatif untuk Pariwisata', 'Agenda dummy ke-13 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Kelas Konten Kreatif untuk Pariwisata merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-17 08:30:00', '2026-09-17 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Hotel Manunggal Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8832000, 106.1558000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-16 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Kelas Konten Kreatif untuk Pariwisata', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 13, 1, '2026-08-07 19:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(14, 10, 'bangka-youth-creative-meetup', 'Bangka Youth Creative Meetup', 'Agenda dummy ke-14 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Bangka Youth Creative Meetup merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-20 08:30:00', '2026-09-20 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Pantai Matras', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8439000, 106.1083000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-19 18:00:00', 150, 0, 50000.00, 100000.00, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Bangka Youth Creative Meetup', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 14, 1, '2026-08-07 18:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(15, 3, 'pelatihan-manajemen-usaha-kreatif', 'Pelatihan Manajemen Usaha Kreatif', 'Agenda dummy ke-15 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pelatihan Manajemen Usaha Kreatif merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-23 08:30:00', '2026-09-24 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Aula Dinas Pariwisata', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8999000, 106.1613000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Pelatihan Manajemen Usaha Kreatif', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 15, 1, '2026-08-07 17:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(16, 1, 'pekan-kuliner-dan-produk-lokal', 'Pekan Kuliner dan Produk Lokal', 'Agenda dummy ke-16 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pekan Kuliner dan Produk Lokal merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-26 08:30:00', '2026-09-26 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -1.6365000, 105.9899000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-25 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Pekan Kuliner dan Produk Lokal', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 16, 1, '2026-08-07 16:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(17, 3, 'workshop-video-pendek-untuk-promosi', 'Workshop Video Pendek untuk Promosi', 'Agenda dummy ke-17 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Workshop Video Pendek untuk Promosi merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-09-29 08:30:00', '2026-09-29 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Taman Sari Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -2.0928000, 105.9043000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-09-28 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Workshop Video Pendek untuk Promosi', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 17, 1, '2026-08-07 15:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(18, 10, 'forum-ekonomi-kreatif-dan-pariwisata', 'Forum Ekonomi Kreatif dan Pariwisata', 'Agenda dummy ke-18 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Forum Ekonomi Kreatif dan Pariwisata merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-02 08:30:00', '2026-10-02 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Gedung Sepintu Sedulang', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -2.1366000, 105.9905000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Forum Ekonomi Kreatif dan Pariwisata', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 18, 1, '2026-08-07 14:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(19, 2, 'pameran-fotografi-pesona-bangka', 'Pameran Fotografi Pesona Bangka', 'Agenda dummy ke-19 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pameran Fotografi Pesona Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-05 08:30:00', '2026-10-05 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Alun-Alun Taman Merdeka', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8722000, 106.1427000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-04 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Pameran Fotografi Pesona Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 19, 1, '2026-08-07 13:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(20, 3, 'kelas-dasar-marketplace-untuk-umkm', 'Kelas Dasar Marketplace untuk UMKM', 'Agenda dummy ke-20 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Kelas Dasar Marketplace untuk UMKM merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-08 08:30:00', '2026-10-09 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -1.8002000, 106.1173000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-07 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Kelas Dasar Marketplace untuk UMKM', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 20, 1, '2026-08-07 12:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(21, 1, 'festival-seni-pertunjukan-bangka', 'Festival Seni Pertunjukan Bangka', 'Agenda dummy ke-21 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Festival Seni Pertunjukan Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-11 08:30:00', '2026-10-11 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Hotel Manunggal Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8542000, 106.1130000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 0, 50000.00, 100000.00, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Festival Seni Pertunjukan Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 21, 1, '2026-08-07 11:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:38'),
	(22, 3, 'workshop-pengembangan-identitas-merek', 'Workshop Pengembangan Identitas Merek', 'Agenda dummy ke-22 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Workshop Pengembangan Identitas Merek merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-14 08:30:00', '2026-10-14 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Pantai Matras', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8617000, 106.1241000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-13 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Workshop Pengembangan Identitas Merek', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 22, 1, '2026-08-07 10:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:39'),
	(23, 10, 'temu-bisnis-pelaku-ekonomi-kreatif', 'Temu Bisnis Pelaku Ekonomi Kreatif', 'Agenda dummy ke-23 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Temu Bisnis Pelaku Ekonomi Kreatif merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-17 08:30:00', '2026-10-17 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Aula Dinas Pariwisata', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8819000, 106.1569000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-16 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Temu Bisnis Pelaku Ekonomi Kreatif', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 23, 1, '2026-08-07 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:39'),
	(24, 2, 'pameran-fesyen-lokal-bangka', 'Pameran Fesyen Lokal Bangka', 'Agenda dummy ke-24 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pameran Fesyen Lokal Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-20 08:30:00', '2026-10-20 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -1.8426000, 106.1094000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Pameran Fesyen Lokal Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 24, 1, '2026-08-07 08:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:39'),
	(25, 3, 'kelas-copywriting-untuk-produk-kreatif', 'Kelas Copywriting untuk Produk Kreatif', 'Agenda dummy ke-25 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Kelas Copywriting untuk Produk Kreatif merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-23 08:30:00', '2026-10-24 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Taman Sari Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8986000, 106.1624000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-22 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Kelas Copywriting untuk Produk Kreatif', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 25, 1, '2026-08-07 07:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 07:47:39'),
	(26, 10, 'forum-desa-kreatif-kabupaten-bangka', 'Forum Desa Kreatif Kabupaten Bangka', 'Agenda dummy ke-26 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Forum Desa Kreatif Kabupaten Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-26 08:30:00', '2026-10-26 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Gedung Sepintu Sedulang', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.6352000, 105.9910000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-25 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Forum Desa Kreatif Kabupaten Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 26, 1, '2026-08-07 06:00:00', 1, NULL, NULL, '2026-08-08 06:30:33', '2026-08-08 07:47:39'),
	(27, 3, 'workshop-perencanaan-konten-media-sosial', 'Workshop Perencanaan Konten Media Sosial', 'Agenda dummy ke-27 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Workshop Perencanaan Konten Media Sosial merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-10-29 08:30:00', '2026-10-29 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Hibrida', 'Alun-Alun Taman Merdeka', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -2.0915000, 105.9054000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kriya-bangka.jpg', 'Workshop Perencanaan Konten Media Sosial', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 27, 1, '2026-08-07 05:00:00', 1, NULL, NULL, '2026-08-08 06:30:33', '2026-08-08 07:47:39'),
	(28, 10, 'bangka-creative-community-day', 'Bangka Creative Community Day', 'Agenda dummy ke-28 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Bangka Creative Community Day merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-11-01 08:30:00', '2026-11-01 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Daring', 'Daring melalui konferensi video', NULL, NULL, NULL, -2.1353000, 105.9916000, 'https://example.com/acara-dummy', 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-10-31 18:00:00', 150, 0, 50000.00, 100000.00, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/kuliner-bangka.png', 'Bangka Creative Community Day', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 28, 1, '2026-08-07 04:00:00', 1, NULL, NULL, '2026-08-08 06:30:33', '2026-08-08 07:47:39'),
	(29, 2, 'pameran-oleh-oleh-kreatif-bangka', 'Pameran Oleh-Oleh Kreatif Bangka', 'Agenda dummy ke-29 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Pameran Oleh-Oleh Kreatif Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-11-04 08:30:00', '2026-11-04 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Hotel Manunggal Sungailiat', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.8709000, 106.1438000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 1, 'https://example.com/daftar-acara', '2026-08-08 08:00:00', '2026-11-03 18:00:00', 150, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-bangka.jpg', 'Pameran Oleh-Oleh Kreatif Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 29, 1, '2026-08-07 03:00:00', 1, NULL, NULL, '2026-08-08 06:30:33', '2026-08-08 07:47:39'),
	(30, 1, 'malam-apresiasi-pelaku-ekonomi-kreatif-bangka', 'Malam Apresiasi Pelaku Ekonomi Kreatif Bangka', 'Agenda dummy ke-30 untuk menguji halaman acara APPEKRAF, menampilkan kolaborasi, pembelajaran, promosi, dan jejaring ekonomi kreatif Kabupaten Bangka.', 'Malam Apresiasi Pelaku Ekonomi Kreatif Bangka merupakan agenda yang dirancang sebagai ruang pertemuan bagi pelaku ekonomi kreatif, komunitas, masyarakat, dan mitra di Kabupaten Bangka. Kegiatan ini menghadirkan sesi berbagi pengetahuan, promosi karya, serta peluang kolaborasi.\r\n\r\nPeserta dapat memperoleh informasi terbaru, memperluas jaringan, dan mengenal potensi kreatif lokal. Susunan kegiatan dapat berubah sesuai kebutuhan penyelenggara. Data acara ini merupakan dummy untuk pengujian sistem APPEKRAF dan dapat diedit atau dihapus melalui dashboard admin.', '2026-11-07 08:30:00', '2026-11-08 14:30:00', 0, 'Asia/Jakarta', 'Dijadwalkan', 'Luring', 'Pantai Matras', 'Kabupaten Bangka, Kepulauan Bangka Belitung', NULL, NULL, -1.7989000, 106.1184000, NULL, 'APPEKRAF Kabupaten Bangka', 'Sekretariat APPEKRAF', '0812-0000-2026', 'appekraf@example.com', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'Peserta mengikuti ketentuan penyelenggara dan menjaga ketertiban selama kegiatan.', '/hero-home-v15.jpg', 'Malam Apresiasi Pelaku Ekonomi Kreatif Bangka', NULL, 'Bangka, acara kreatif, APPEKRAF', NULL, NULL, 0, 30, 1, '2026-08-07 02:00:00', 1, NULL, NULL, '2026-08-08 06:30:33', '2026-08-08 07:47:39');

-- Dumping structure for table dinas_pariwisata.acara_galeri
DROP TABLE IF EXISTS `acara_galeri`;
CREATE TABLE IF NOT EXISTS `acara_galeri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `acara_id` bigint unsigned NOT NULL,
  `jenis_media` enum('Foto','Video','Dokumen') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Foto',
  `file_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teks_alternatif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_acara_galeri_acara_urutan` (`acara_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_acara_galeri_acara` FOREIGN KEY (`acara_id`) REFERENCES `acara` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.acara_galeri: ~0 rows (approximately)
DELETE FROM `acara_galeri`;

-- Dumping structure for table dinas_pariwisata.acara_jadwal
DROP TABLE IF EXISTS `acara_jadwal`;
CREATE TABLE IF NOT EXISTS `acara_jadwal` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `acara_id` bigint unsigned NOT NULL,
  `judul_sesi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_mulai` datetime NOT NULL,
  `tanggal_selesai` datetime DEFAULT NULL,
  `lokasi_sesi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `narasumber` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_acara_jadwal_acara` (`acara_id`,`aktif`,`tanggal_mulai`,`urutan`),
  CONSTRAINT `fk_acara_jadwal_acara` FOREIGN KEY (`acara_id`) REFERENCES `acara` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_acara_jadwal_tanggal` CHECK (((`tanggal_selesai` is null) or (`tanggal_selesai` >= `tanggal_mulai`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.acara_jadwal: ~0 rows (approximately)
DELETE FROM `acara_jadwal`;

-- Dumping structure for table dinas_pariwisata.berita
DROP TABLE IF EXISTS `berita`;
CREATE TABLE IF NOT EXISTS `berita` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kategori_berita_id` int unsigned NOT NULL,
  `slug` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subjudul` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ringkasan` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `penulis_tampil` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sumber_nama` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sumber_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_utama` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_keterangan` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_alt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kata_kunci` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_judul` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_deskripsi` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headline` tinyint(1) NOT NULL DEFAULT '0',
  `urutan_tampil` int unsigned NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_berita_slug` (`slug`),
  KEY `idx_berita_kategori` (`kategori_berita_id`),
  KEY `idx_berita_publik` (`dipublikasikan`,`aktif`,`tanggal_publikasi`),
  KEY `idx_berita_headline` (`headline`,`urutan_tampil`,`tanggal_publikasi`),
  KEY `idx_berita_created_by` (`created_by`),
  KEY `fk_berita_updated_by` (`updated_by`),
  FULLTEXT KEY `ft_berita_pencarian` (`judul`,`subjudul`,`ringkasan`,`isi`,`kata_kunci`),
  CONSTRAINT `fk_berita_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_berita_kategori` FOREIGN KEY (`kategori_berita_id`) REFERENCES `master_kategori_berita` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_berita_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_berita_publikasi` CHECK (((`dipublikasikan` = 0) or (`tanggal_publikasi` is not null)))
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.berita: ~33 rows (approximately)
DELETE FROM `berita`;
INSERT INTO `berita` (`id`, `kategori_berita_id`, `slug`, `judul`, `subjudul`, `ringkasan`, `isi`, `penulis_tampil`, `sumber_nama`, `sumber_url`, `foto_utama`, `foto_keterangan`, `foto_alt`, `kata_kunci`, `meta_judul`, `meta_deskripsi`, `headline`, `urutan_tampil`, `dipublikasikan`, `tanggal_publikasi`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(5, 9, 'appekraf-bangka-perkuat-kolaborasi-pelaku-ekonomi-kreatif', 'APPEKRAF Bangka Perkuat Kolaborasi Pelaku Ekonomi Kreatif', 'Sorotan perkembangan program & kebijakan dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-1 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. APPEKRAF Bangka Perkuat Kolaborasi Pelaku Ekonomi Kreatif menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/api/uploads/r2?key=appekraf%2Fberita%2F2026%2F08%2Fa7948d42-c97a-461f-81b6-58b2dcbbaf9d.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'APPEKRAF Bangka Perkuat Kolaborasi Pelaku Ekonomi Kreatif', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 1, 1, 1, '2026-08-07 23:00:00', 1, NULL, 2, '2026-08-08 06:30:32', '2026-08-16 11:42:39'),
	(6, 3, 'produk-kriya-bangka-tampil-lebih-modern-dan-siap-pasar', 'Produk Kriya Bangka Tampil Lebih Modern dan Siap Pasar', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-2 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Produk Kriya Bangka Tampil Lebih Modern dan Siap Pasar menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Produk Kriya Bangka Tampil Lebih Modern dan Siap Pasar', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 1, 2, 1, '2026-08-07 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(7, 3, 'pelaku-kuliner-lokal-dorong-identitas-rasa-khas-bangka', 'Pelaku Kuliner Lokal Dorong Identitas Rasa Khas Bangka', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-3 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pelaku Kuliner Lokal Dorong Identitas Rasa Khas Bangka menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pelaku Kuliner Lokal Dorong Identitas Rasa Khas Bangka', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 1, 3, 1, '2026-08-06 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(8, 2, 'fotografi-kreatif-menjadi-ruang-promosi-destinasi-bangka', 'Fotografi Kreatif Menjadi Ruang Promosi Destinasi Bangka', 'Sorotan perkembangan pariwisata dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-4 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Fotografi Kreatif Menjadi Ruang Promosi Destinasi Bangka menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Fotografi Kreatif Menjadi Ruang Promosi Destinasi Bangka', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-08-05 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(9, 8, 'komunitas-kreatif-sungailiat-gelar-diskusi-pengembangan-ekosistem', 'Komunitas Kreatif Sungailiat Gelar Diskusi Pengembangan Ekosistem', 'Sorotan perkembangan komunitas dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-5 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Komunitas Kreatif Sungailiat Gelar Diskusi Pengembangan Ekosistem menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Komunitas Kreatif Sungailiat Gelar Diskusi Pengembangan Ekosistem', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-08-04 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(10, 3, 'umkm-kreatif-bangka-mulai-memperluas-pemasaran-digital', 'UMKM Kreatif Bangka Mulai Memperluas Pemasaran Digital', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-6 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. UMKM Kreatif Bangka Mulai Memperluas Pemasaran Digital menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'UMKM Kreatif Bangka Mulai Memperluas Pemasaran Digital', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-08-03 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(11, 3, 'festival-kreatif-bangka-hadirkan-kolaborasi-lintas-subsektor', 'Festival Kreatif Bangka Hadirkan Kolaborasi Lintas Subsektor', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-7 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Festival Kreatif Bangka Hadirkan Kolaborasi Lintas Subsektor menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Festival Kreatif Bangka Hadirkan Kolaborasi Lintas Subsektor', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-08-02 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(12, 3, 'pemuda-bangka-kembangkan-produk-fesyen-berbasis-identitas-lokal', 'Pemuda Bangka Kembangkan Produk Fesyen Berbasis Identitas Lokal', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-8 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pemuda Bangka Kembangkan Produk Fesyen Berbasis Identitas Lokal menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pemuda Bangka Kembangkan Produk Fesyen Berbasis Identitas Lokal', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-08-01 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(13, 3, 'pelaku-musik-lokal-bangka-bangun-ruang-kolaborasi-baru', 'Pelaku Musik Lokal Bangka Bangun Ruang Kolaborasi Baru', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-9 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pelaku Musik Lokal Bangka Bangun Ruang Kolaborasi Baru menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pelaku Musik Lokal Bangka Bangun Ruang Kolaborasi Baru', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-31 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(14, 2, 'konten-digital-membantu-promosi-wisata-pesisir-kabupaten-bangka', 'Konten Digital Membantu Promosi Wisata Pesisir Kabupaten Bangka', 'Sorotan perkembangan pariwisata dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-10 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Konten Digital Membantu Promosi Wisata Pesisir Kabupaten Bangka menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Konten Digital Membantu Promosi Wisata Pesisir Kabupaten Bangka', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-30 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(15, 3, 'kriya-berbahan-alam-bangka-semakin-diminati-pasar', 'Kriya Berbahan Alam Bangka Semakin Diminati Pasar', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-11 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Kriya Berbahan Alam Bangka Semakin Diminati Pasar menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Kriya Berbahan Alam Bangka Semakin Diminati Pasar', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-29 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(16, 2, 'ekonomi-kreatif-didorong-menjadi-penguat-sektor-pariwisata', 'Ekonomi Kreatif Didorong Menjadi Penguat Sektor Pariwisata', 'Sorotan perkembangan pariwisata dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-12 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Ekonomi Kreatif Didorong Menjadi Penguat Sektor Pariwisata menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Ekonomi Kreatif Didorong Menjadi Penguat Sektor Pariwisata', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-28 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(17, 3, 'pelatihan-branding-membantu-pelaku-usaha-menata-identitas-produk', 'Pelatihan Branding Membantu Pelaku Usaha Menata Identitas Produk', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-13 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pelatihan Branding Membantu Pelaku Usaha Menata Identitas Produk menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pelatihan Branding Membantu Pelaku Usaha Menata Identitas Produk', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-27 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(18, 8, 'komunitas-film-bangka-dorong-produksi-cerita-lokal-berkualitas', 'Komunitas Film Bangka Dorong Produksi Cerita Lokal Berkualitas', 'Sorotan perkembangan komunitas dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-14 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Komunitas Film Bangka Dorong Produksi Cerita Lokal Berkualitas menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Komunitas Film Bangka Dorong Produksi Cerita Lokal Berkualitas', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-26 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(19, 3, 'pelaku-kuliner-ikuti-pendampingan-kemasan-produk-yang-lebih-menarik', 'Pelaku Kuliner Ikuti Pendampingan Kemasan Produk yang Lebih Menarik', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-15 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pelaku Kuliner Ikuti Pendampingan Kemasan Produk yang Lebih Menarik menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pelaku Kuliner Ikuti Pendampingan Kemasan Produk yang Lebih Menarik', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-25 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(20, 3, 'desain-produk-lokal-bangka-mulai-mengadopsi-tren-berkelanjutan', 'Desain Produk Lokal Bangka Mulai Mengadopsi Tren Berkelanjutan', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-16 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Desain Produk Lokal Bangka Mulai Mengadopsi Tren Berkelanjutan menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Desain Produk Lokal Bangka Mulai Mengadopsi Tren Berkelanjutan', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-24 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(21, 8, 'ruang-publik-kreatif-menjadi-titik-temu-komunitas-dan-pelaku-usaha', 'Ruang Publik Kreatif Menjadi Titik Temu Komunitas dan Pelaku Usaha', 'Sorotan perkembangan komunitas dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-17 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Ruang Publik Kreatif Menjadi Titik Temu Komunitas dan Pelaku Usaha menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Ruang Publik Kreatif Menjadi Titik Temu Komunitas dan Pelaku Usaha', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-23 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(22, 2, 'promosi-digital-destinasi-bangka-diperkuat-melalui-konten-kreatif', 'Promosi Digital Destinasi Bangka Diperkuat Melalui Konten Kreatif', 'Sorotan perkembangan pariwisata dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-18 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Promosi Digital Destinasi Bangka Diperkuat Melalui Konten Kreatif menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Promosi Digital Destinasi Bangka Diperkuat Melalui Konten Kreatif', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-22 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(23, 9, 'pelaku-ekraf-bangka-didorong-memanfaatkan-data-untuk-pengembangan-usaha', 'Pelaku Ekraf Bangka Didorong Memanfaatkan Data untuk Pengembangan Usaha', 'Sorotan perkembangan program & kebijakan dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-19 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pelaku Ekraf Bangka Didorong Memanfaatkan Data untuk Pengembangan Usaha menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pelaku Ekraf Bangka Didorong Memanfaatkan Data untuk Pengembangan Usaha', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-21 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(24, 8, 'kolaborasi-pemerintah-dan-komunitas-perluas-akses-promosi-produk-lokal', 'Kolaborasi Pemerintah dan Komunitas Perluas Akses Promosi Produk Lokal', 'Sorotan perkembangan komunitas dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-20 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Kolaborasi Pemerintah dan Komunitas Perluas Akses Promosi Produk Lokal menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Kolaborasi Pemerintah dan Komunitas Perluas Akses Promosi Produk Lokal', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-20 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(25, 3, 'produk-oleh-oleh-bangka-dikembangkan-dengan-pendekatan-desain-modern', 'Produk Oleh-Oleh Bangka Dikembangkan dengan Pendekatan Desain Modern', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-21 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Produk Oleh-Oleh Bangka Dikembangkan dengan Pendekatan Desain Modern menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Produk Oleh-Oleh Bangka Dikembangkan dengan Pendekatan Desain Modern', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-19 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(26, 3, 'workshop-foto-produk-tingkatkan-kualitas-materi-promosi-umkm', 'Workshop Foto Produk Tingkatkan Kualitas Materi Promosi UMKM', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-22 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Workshop Foto Produk Tingkatkan Kualitas Materi Promosi UMKM menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Workshop Foto Produk Tingkatkan Kualitas Materi Promosi UMKM', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-18 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(27, 3, 'subsektor-gim-dan-aplikasi-mulai-tumbuh-di-kalangan-kreator-muda-bangka', 'Subsektor Gim dan Aplikasi Mulai Tumbuh di Kalangan Kreator Muda Bangka', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-23 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Subsektor Gim dan Aplikasi Mulai Tumbuh di Kalangan Kreator Muda Bangka menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Subsektor Gim dan Aplikasi Mulai Tumbuh di Kalangan Kreator Muda Bangka', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-17 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(28, 2, 'seni-pertunjukan-lokal-didorong-hadir-dalam-agenda-wisata-daerah', 'Seni Pertunjukan Lokal Didorong Hadir dalam Agenda Wisata Daerah', 'Sorotan perkembangan pariwisata dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-24 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Seni Pertunjukan Lokal Didorong Hadir dalam Agenda Wisata Daerah menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Seni Pertunjukan Lokal Didorong Hadir dalam Agenda Wisata Daerah', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-16 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(29, 3, 'pameran-produk-kreatif-membuka-peluang-pertemuan-dengan-pasar-baru', 'Pameran Produk Kreatif Membuka Peluang Pertemuan dengan Pasar Baru', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-25 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pameran Produk Kreatif Membuka Peluang Pertemuan dengan Pasar Baru menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pameran Produk Kreatif Membuka Peluang Pertemuan dengan Pasar Baru', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-15 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(30, 8, 'pelaku-ekraf-perempuan-bangka-perkuat-jejaring-dan-kolaborasi-usaha', 'Pelaku Ekraf Perempuan Bangka Perkuat Jejaring dan Kolaborasi Usaha', 'Sorotan perkembangan komunitas dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-26 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pelaku Ekraf Perempuan Bangka Perkuat Jejaring dan Kolaborasi Usaha menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pelaku Ekraf Perempuan Bangka Perkuat Jejaring dan Kolaborasi Usaha', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-14 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(31, 3, 'pengembangan-desa-kreatif-mengangkat-potensi-produk-dan-cerita-lokal', 'Pengembangan Desa Kreatif Mengangkat Potensi Produk dan Cerita Lokal', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-27 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Pengembangan Desa Kreatif Mengangkat Potensi Produk dan Cerita Lokal menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kuliner-bangka.png', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Pengembangan Desa Kreatif Mengangkat Potensi Produk dan Cerita Lokal', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-13 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(32, 3, 'literasi-digital-menjadi-bekal-penting-bagi-pelaku-ekonomi-kreatif', 'Literasi Digital Menjadi Bekal Penting bagi Pelaku Ekonomi Kreatif', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-28 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Literasi Digital Menjadi Bekal Penting bagi Pelaku Ekonomi Kreatif menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Literasi Digital Menjadi Bekal Penting bagi Pelaku Ekonomi Kreatif', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-12 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(33, 3, 'bangka-dorong-ekosistem-kreatif-yang-inklusif-dan-berkelanjutan', 'Bangka Dorong Ekosistem Kreatif yang Inklusif dan Berkelanjutan', 'Sorotan perkembangan ekonomi kreatif dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-29 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. Bangka Dorong Ekosistem Kreatif yang Inklusif dan Berkelanjutan menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/hero-home-v15.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'Bangka Dorong Ekosistem Kreatif yang Inklusif dan Berkelanjutan', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-11 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(34, 9, 'appekraf-siapkan-kanal-informasi-terpadu-untuk-berita-dan-agenda-kreatif', 'APPEKRAF Siapkan Kanal Informasi Terpadu untuk Berita dan Agenda Kreatif', 'Sorotan perkembangan program & kebijakan dan aktivitas pelaku kreatif di Kabupaten Bangka.', 'Berita dummy ke-30 untuk pengujian halaman publik APPEKRAF. Informasi ini menggambarkan kegiatan, kolaborasi, promosi, dan pengembangan ekonomi kreatif Kabupaten Bangka.', 'Kabupaten Bangka terus mendorong pertumbuhan ekosistem ekonomi kreatif melalui kolaborasi antara pemerintah, komunitas, pelaku usaha, dan masyarakat. APPEKRAF Siapkan Kanal Informasi Terpadu untuk Berita dan Agenda Kreatif menjadi salah satu contoh narasi yang dapat ditampilkan pada portal informasi APPEKRAF.\r\n\r\nKegiatan dan inisiatif yang dikembangkan diarahkan untuk memperkuat kualitas produk, meningkatkan kemampuan promosi, memperluas jejaring, serta membuka peluang pasar baru bagi pelaku kreatif. Pendataan yang terstruktur juga membantu program pembinaan menjadi lebih tepat sasaran.\r\n\r\nMelalui portal APPEKRAF, masyarakat dapat mengikuti perkembangan terbaru, menemukan agenda kegiatan, dan mengenal potensi kreatif Kabupaten Bangka secara lebih mudah. Data pada berita ini merupakan dummy untuk kebutuhan pengujian sistem dan dapat diganti melalui dashboard admin.', 'Tim APPEKRAF Bangka', 'APPEKRAF Kabupaten Bangka', NULL, '/kriya-bangka.jpg', 'Dokumentasi kegiatan kreatif Kabupaten Bangka', 'APPEKRAF Siapkan Kanal Informasi Terpadu untuk Berita dan Agenda Kreatif', 'Bangka, ekonomi kreatif, pariwisata, APPEKRAF', NULL, NULL, 0, 0, 1, '2026-07-10 09:00:00', 1, NULL, NULL, '2026-08-08 06:30:32', '2026-08-08 06:30:32');

-- Dumping structure for table dinas_pariwisata.berita_galeri
DROP TABLE IF EXISTS `berita_galeri`;
CREATE TABLE IF NOT EXISTS `berita_galeri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `berita_id` bigint unsigned NOT NULL,
  `jenis_media` enum('Foto','Video','Dokumen') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Foto',
  `file_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teks_alternatif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_berita_galeri_berita_urutan` (`berita_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_berita_galeri_berita` FOREIGN KEY (`berita_id`) REFERENCES `berita` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.berita_galeri: ~0 rows (approximately)
DELETE FROM `berita_galeri`;

-- Dumping structure for table dinas_pariwisata.chat_conversations
DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `guest_identifier` varchar(80) NOT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `last_message_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_conversations_guest_identifier` (`guest_identifier`),
  KEY `idx_chat_conversations_last_message` (`last_message_at`),
  KEY `idx_chat_conversations_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.chat_conversations: ~2 rows (approximately)
DELETE FROM `chat_conversations`;
INSERT INTO `chat_conversations` (`id`, `guest_identifier`, `status`, `last_message_at`, `created_at`, `updated_at`) VALUES
	(1, 'guest_7ad6d4cbee0642cd8d52a39cbe9a6c15', 'open', '2026-08-15 11:29:27', '2026-08-15 10:10:17', '2026-08-15 11:29:27'),
	(3, 'guest_5af30fd222584f10a5a7ff0966c13da6', 'open', '2026-08-19 03:04:47', '2026-08-19 03:04:29', '2026-08-19 03:04:47');

-- Dumping structure for table dinas_pariwisata.chat_messages
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `sender_type` enum('guest','staff') NOT NULL,
  `sender_user_id` bigint unsigned DEFAULT NULL,
  `sender_name_snapshot` varchar(150) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_conversation_id` (`conversation_id`,`id`),
  KEY `idx_chat_messages_sender_user` (`sender_user_id`),
  CONSTRAINT `fk_chat_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_messages_sender_user` FOREIGN KEY (`sender_user_id`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.chat_messages: ~7 rows (approximately)
DELETE FROM `chat_messages`;
INSERT INTO `chat_messages` (`id`, `conversation_id`, `sender_type`, `sender_user_id`, `sender_name_snapshot`, `message`, `created_at`) VALUES
	(1, 1, 'guest', NULL, NULL, 'tes', '2026-08-15 10:10:17'),
	(2, 1, 'staff', 2, 'Brad', 'halo ada yang bisa saya bantu?', '2026-08-15 10:10:50'),
	(3, 1, 'guest', NULL, NULL, 'tes2', '2026-08-15 11:29:01'),
	(4, 1, 'staff', 2, 'Brad', 'bantu2', '2026-08-15 11:29:16'),
	(5, 1, 'staff', 2, 'Brad', 'tes3', '2026-08-15 11:29:27'),
	(6, 3, 'guest', NULL, NULL, 'tes', '2026-08-19 03:04:29'),
	(7, 3, 'staff', 2, 'Brad', 'tes', '2026-08-19 03:04:47');

-- Dumping structure for table dinas_pariwisata.chat_staff_reads
DROP TABLE IF EXISTS `chat_staff_reads`;
CREATE TABLE IF NOT EXISTS `chat_staff_reads` (
  `conversation_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `last_read_message_id` bigint unsigned NOT NULL DEFAULT '0',
  `last_read_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`,`user_id`),
  KEY `idx_chat_staff_reads_user` (`user_id`,`last_read_at`),
  CONSTRAINT `fk_chat_staff_reads_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_staff_reads_user` FOREIGN KEY (`user_id`) REFERENCES `pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.chat_staff_reads: ~2 rows (approximately)
DELETE FROM `chat_staff_reads`;
INSERT INTO `chat_staff_reads` (`conversation_id`, `user_id`, `last_read_message_id`, `last_read_at`, `created_at`, `updated_at`) VALUES
	(1, 2, 5, '2026-08-15 11:29:27', '2026-08-15 11:28:47', '2026-08-15 11:29:27'),
	(3, 2, 7, '2026-08-19 03:04:47', '2026-08-19 03:04:44', '2026-08-19 03:04:47');

-- Dumping structure for table dinas_pariwisata.hotel
DROP TABLE IF EXISTS `hotel`;
CREATE TABLE IF NOT EXISTS `hotel` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_hotel` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_hotel_id` int unsigned NOT NULL,
  `klasifikasi_bintang` tinyint unsigned DEFAULT NULL COMMENT '0 sampai 5; NULL jika belum/tidak diklasifikasikan',
  `nama_pengelola` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_singkat` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan_id` int unsigned DEFAULT NULL,
  `kelurahan_id` int unsigned DEFAULT NULL,
  `kode_pos` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `telepon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jam_check_in` time DEFAULT NULL,
  `jam_check_out` time DEFAULT NULL,
  `jumlah_kamar` smallint unsigned DEFAULT NULL,
  `harga_mulai` decimal(14,2) DEFAULT NULL,
  `harga_sampai` decimal(14,2) DEFAULT NULL,
  `informasi_reservasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `kebijakan_hotel` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aksesibilitas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nomor_izin_usaha` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomor_sertifikat_chse` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_utama` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `urutan_tampil` int unsigned NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_hotel_slug` (`slug`),
  KEY `idx_hotel_jenis` (`jenis_hotel_id`),
  KEY `idx_hotel_lokasi` (`kecamatan_id`,`kelurahan_id`),
  KEY `idx_hotel_publik` (`dipublikasikan`,`aktif`,`unggulan`),
  KEY `idx_hotel_nama` (`nama_hotel`),
  KEY `idx_hotel_koordinat` (`latitude`,`longitude`),
  KEY `fk_hotel_kelurahan` (`kelurahan_id`),
  KEY `fk_hotel_created_by` (`created_by`),
  KEY `fk_hotel_updated_by` (`updated_by`),
  CONSTRAINT `fk_hotel_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_jenis` FOREIGN KEY (`jenis_hotel_id`) REFERENCES `master_jenis_hotel` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `master_kecamatan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_kelurahan` FOREIGN KEY (`kelurahan_id`) REFERENCES `master_kelurahan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_hotel_bintang` CHECK (((`klasifikasi_bintang` is null) or (`klasifikasi_bintang` <= 5))),
  CONSTRAINT `chk_hotel_harga` CHECK (((`harga_mulai` is null) or (`harga_sampai` is null) or (`harga_sampai` >= `harga_mulai`)))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.hotel: ~10 rows (approximately)
DELETE FROM `hotel`;
INSERT INTO `hotel` (`id`, `slug`, `nama_hotel`, `jenis_hotel_id`, `klasifikasi_bintang`, `nama_pengelola`, `deskripsi_singkat`, `deskripsi`, `alamat`, `kecamatan_id`, `kelurahan_id`, `kode_pos`, `latitude`, `longitude`, `telepon`, `whatsapp`, `email`, `website`, `instagram`, `facebook`, `jam_check_in`, `jam_check_out`, `jumlah_kamar`, `harga_mulai`, `harga_sampai`, `informasi_reservasi`, `kebijakan_hotel`, `aksesibilitas`, `nomor_izin_usaha`, `nomor_sertifikat_chse`, `foto_utama`, `video_url`, `unggulan`, `urutan_tampil`, `dipublikasikan`, `tanggal_publikasi`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'bangka-seaside-hotel-dummy', 'Bangka Seaside Hotel', 1, 4, 'PT Bangka Hospitality', 'Hotel modern dekat kawasan pesisir dengan kamar nyaman untuk wisata dan bisnis.', 'Hotel modern dekat kawasan pesisir dengan kamar nyaman untuk wisata dan bisnis. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8648000, 106.1149000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 78, 650000.00, 1250000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=82', NULL, 1, 1, 1, '2026-08-03 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(2, 'matras-bay-resort-dummy', 'Matras Bay Resort', 2, 4, 'Matras Leisure Group', 'Resort bernuansa tropis dengan akses mudah menuju kawasan pantai.', 'Resort bernuansa tropis dengan akses mudah menuju kawasan pantai. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8905000, 106.1531000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 56, 850000.00, 1750000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=82', NULL, 1, 2, 1, '2026-08-02 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(3, 'sungailiat-city-hotel-dummy', 'Sungailiat City Hotel', 1, 3, 'Sungailiat Stay', 'Akomodasi praktis di area kota dengan fasilitas dasar untuk perjalanan singkat.', 'Akomodasi praktis di area kota dengan fasilitas dasar untuk perjalanan singkat. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8554000, 106.1082000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 64, 450000.00, 850000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=82', NULL, 1, 3, 1, '2026-08-01 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(4, 'rebo-hill-guest-house-dummy', 'Rebo Hill Guest House', 4, NULL, 'Keluarga Rebo', 'Guest house tenang dengan suasana hijau dan layanan sederhana.', 'Guest house tenang dengan suasana hijau dan layanan sederhana. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Rebo, Kabupaten Bangka', NULL, NULL, NULL, -1.8368000, 106.1125000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 18, 300000.00, 550000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=82', NULL, 0, 4, 1, '2026-07-31 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(5, 'belinyu-heritage-stay-dummy', 'Belinyu Heritage Stay', 4, NULL, 'Belinyu Heritage', 'Akomodasi bergaya lokal untuk wisatawan yang ingin mengeksplorasi Bangka bagian utara.', 'Akomodasi bergaya lokal untuk wisatawan yang ingin mengeksplorasi Bangka bagian utara. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Belinyu, Kabupaten Bangka', NULL, NULL, NULL, -1.6385000, 105.9879000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 22, 325000.00, 650000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=82', NULL, 0, 5, 1, '2026-07-30 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(6, 'pesisir-bangka-resort-dummy', 'Pesisir Bangka Resort', 2, 5, 'Pesisir Bangka Group', 'Resort ilustratif dengan fasilitas rekreasi keluarga dan panorama laut.', 'Resort ilustratif dengan fasilitas rekreasi keluarga dan panorama laut. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Kabupaten Bangka', NULL, NULL, NULL, -1.9017000, 106.1608000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 92, 1200000.00, 2500000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=82', NULL, 0, 6, 1, '2026-07-29 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(7, 'sepintu-sedulang-hotel-dummy', 'Sepintu Sedulang Hotel', 1, 3, 'Bangka Urban Stay', 'Hotel kota dengan ruang pertemuan dan akses ke pusat aktivitas Sungailiat.', 'Hotel kota dengan ruang pertemuan dan akses ke pusat aktivitas Sungailiat. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8589000, 106.1044000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 70, 500000.00, 950000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=82', NULL, 0, 7, 1, '2026-07-28 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(8, 'kampung-bangka-homestay-dummy', 'Kampung Bangka Homestay', 5, NULL, 'Komunitas Lokal', 'Homestay sederhana dengan pendekatan pengalaman lokal dan suasana kekeluargaan.', 'Homestay sederhana dengan pendekatan pengalaman lokal dan suasana kekeluargaan. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Kabupaten Bangka', NULL, NULL, NULL, -1.8742000, 106.0957000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 12, 200000.00, 400000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=82', NULL, 0, 8, 1, '2026-07-27 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(9, 'tanjung-pesona-inn-dummy', 'Tanjung Pesona Inn', 4, 2, 'Tanjung Stay', 'Penginapan ringkas dekat pesisir untuk wisatawan individu dan keluarga kecil.', 'Penginapan ringkas dekat pesisir untuk wisatawan individu dan keluarga kecil. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8863000, 106.1495000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 24, 275000.00, 500000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=82', NULL, 0, 9, 1, '2026-07-26 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(10, 'north-bangka-lodge-dummy', 'North Bangka Lodge', 5, NULL, 'North Bangka Community', 'Akomodasi bernuansa alam untuk perjalanan eksplorasi kawasan utara Bangka.', 'Akomodasi bernuansa alam untuk perjalanan eksplorasi kawasan utara Bangka. Data akomodasi ini merupakan dummy pengembangan. Harga, klasifikasi, fasilitas, kebijakan, dan ketersediaan kamar harus dikonfirmasi sebelum portal digunakan pada produksi.', 'Belinyu, Kabupaten Bangka', NULL, NULL, NULL, -1.5932000, 105.9728000, NULL, NULL, NULL, NULL, NULL, NULL, '14:00:00', '12:00:00', 14, 250000.00, 475000.00, 'Reservasi dapat dilakukan melalui kontak pengelola. Data kontak pada seed ini bersifat dummy.', 'Check-in memerlukan identitas. Kebijakan pembatalan dan tambahan tamu mengikuti ketentuan pengelola.', 'Akses kendaraan tersedia; kebutuhan aksesibilitas khusus perlu dikonfirmasi kepada pengelola.', NULL, NULL, 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1400&q=82', NULL, 0, 10, 1, '2026-07-25 10:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38');

-- Dumping structure for table dinas_pariwisata.hotel_fasilitas
DROP TABLE IF EXISTS `hotel_fasilitas`;
CREATE TABLE IF NOT EXISTS `hotel_fasilitas` (
  `hotel_id` bigint unsigned NOT NULL,
  `fasilitas_id` int unsigned NOT NULL,
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`hotel_id`,`fasilitas_id`),
  KEY `idx_hotel_fasilitas_fasilitas` (`fasilitas_id`),
  CONSTRAINT `fk_hotel_fasilitas_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hotel_fasilitas_master` FOREIGN KEY (`fasilitas_id`) REFERENCES `master_fasilitas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.hotel_fasilitas: ~0 rows (approximately)
DELETE FROM `hotel_fasilitas`;

-- Dumping structure for table dinas_pariwisata.hotel_galeri
DROP TABLE IF EXISTS `hotel_galeri`;
CREATE TABLE IF NOT EXISTS `hotel_galeri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hotel_id` bigint unsigned NOT NULL,
  `jenis_media` enum('Foto','Video','Virtual Tour') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Foto',
  `file_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teks_alternatif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hotel_galeri_hotel_urutan` (`hotel_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_hotel_galeri_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.hotel_galeri: ~0 rows (approximately)
DELETE FROM `hotel_galeri`;

-- Dumping structure for table dinas_pariwisata.kuliner
DROP TABLE IF EXISTS `kuliner`;
CREATE TABLE IF NOT EXISTS `kuliner` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_usaha` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori_kuliner_id` int unsigned NOT NULL,
  `nama_pemilik` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_singkat` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `menu_unggulan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cita_rasa_khas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan_id` int unsigned DEFAULT NULL,
  `kelurahan_id` int unsigned DEFAULT NULL,
  `kode_pos` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `telepon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiktok` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jam_operasional` json DEFAULT NULL COMMENT 'Contoh: {"senin":{"buka":"08:00","tutup":"21:00"}}',
  `harga_mulai` decimal(14,2) DEFAULT NULL,
  `harga_sampai` decimal(14,2) DEFAULT NULL,
  `kapasitas_pengunjung` smallint unsigned DEFAULT NULL,
  `tersedia_dine_in` tinyint(1) NOT NULL DEFAULT '1',
  `tersedia_takeaway` tinyint(1) NOT NULL DEFAULT '1',
  `tersedia_delivery` tinyint(1) NOT NULL DEFAULT '0',
  `menerima_reservasi` tinyint(1) NOT NULL DEFAULT '0',
  `status_halal` enum('Belum Diketahui','Halal Bersertifikat','Klaim Halal','Tidak Halal','Proses Sertifikasi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Belum Diketahui',
  `nomor_sertifikat_halal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomor_pirt` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomor_nib` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metode_pembayaran` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_utama` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `urutan_tampil` int unsigned NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kuliner_slug` (`slug`),
  KEY `idx_kuliner_kategori` (`kategori_kuliner_id`),
  KEY `idx_kuliner_lokasi` (`kecamatan_id`,`kelurahan_id`),
  KEY `idx_kuliner_publik` (`dipublikasikan`,`aktif`,`unggulan`),
  KEY `idx_kuliner_nama` (`nama_usaha`),
  KEY `idx_kuliner_koordinat` (`latitude`,`longitude`),
  KEY `fk_kuliner_kelurahan` (`kelurahan_id`),
  KEY `fk_kuliner_created_by` (`created_by`),
  KEY `fk_kuliner_updated_by` (`updated_by`),
  CONSTRAINT `fk_kuliner_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_kuliner_kategori` FOREIGN KEY (`kategori_kuliner_id`) REFERENCES `master_kategori_kuliner` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_kuliner_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `master_kecamatan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_kuliner_kelurahan` FOREIGN KEY (`kelurahan_id`) REFERENCES `master_kelurahan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_kuliner_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_kuliner_harga` CHECK (((`harga_mulai` is null) or (`harga_sampai` is null) or (`harga_sampai` >= `harga_mulai`)))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.kuliner: ~10 rows (approximately)
DELETE FROM `kuliner`;
INSERT INTO `kuliner` (`id`, `slug`, `nama_usaha`, `kategori_kuliner_id`, `nama_pemilik`, `deskripsi_singkat`, `deskripsi`, `menu_unggulan`, `cita_rasa_khas`, `alamat`, `kecamatan_id`, `kelurahan_id`, `kode_pos`, `latitude`, `longitude`, `telepon`, `whatsapp`, `email`, `website`, `instagram`, `facebook`, `tiktok`, `jam_operasional`, `harga_mulai`, `harga_sampai`, `kapasitas_pengunjung`, `tersedia_dine_in`, `tersedia_takeaway`, `tersedia_delivery`, `menerima_reservasi`, `status_halal`, `nomor_sertifikat_halal`, `nomor_pirt`, `nomor_nib`, `metode_pembayaran`, `foto_utama`, `video_url`, `unggulan`, `urutan_tampil`, `dipublikasikan`, `tanggal_publikasi`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'dapur-lempah-bangka-dummy', 'Dapur Lempah Bangka', 1, 'Maya', 'Sajian rumahan dengan fokus pada lempah dan menu laut khas Bangka.', 'Sajian rumahan dengan fokus pada lempah dan menu laut khas Bangka. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Lempah kuning ikan, sambal lokal, nasi hangat', 'Asam segar, rempah aromatik, dan karakter gurih pedas', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8572000, 106.1118000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 25000.00, 85000.00, NULL, 1, 1, 1, 1, 'Klaim Halal', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=82', NULL, 1, 1, 1, '2026-08-02 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(2, 'kedai-otak-otak-pesisir-dummy', 'Kedai Otak-Otak Pesisir', 4, 'Rudi', 'Kedai santai dengan otak-otak ikan dan camilan laut sebagai menu utama.', 'Kedai santai dengan otak-otak ikan dan camilan laut sebagai menu utama. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Otak-otak ikan, pempek, es jeruk kunci', 'Gurih ikan, aroma panggang, dan saus pendamping segar', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8641000, 106.1216000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 15000.00, 50000.00, NULL, 1, 1, 0, 0, 'Klaim Halal', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=82', NULL, 1, 2, 1, '2026-08-01 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(3, 'kopi-sungailiat-dummy', 'Kopi Sungailiat', 3, 'Dina', 'Kedai kopi modern dengan suasana minimalis dan pilihan kopi Nusantara.', 'Kedai kopi modern dengan suasana minimalis dan pilihan kopi Nusantara. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Manual brew, kopi susu, roti panggang', 'Kopi seimbang, pilihan light hingga medium roast', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8533000, 106.1087000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 18000.00, 55000.00, NULL, 1, 1, 0, 1, 'Halal Bersertifikat', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=82', NULL, 1, 3, 1, '2026-07-31 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(4, 'warung-rusip-pesisir-dummy', 'Warung Rusip Pesisir', 4, 'Nadia', 'Warung lokal yang mengangkat olahan fermentasi ikan dan masakan rumahan.', 'Warung lokal yang mengangkat olahan fermentasi ikan dan masakan rumahan. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Rusip, lalapan, ikan goreng, sayur lokal', 'Asin, gurih, fermentatif, dan segar', 'Belinyu, Kabupaten Bangka', NULL, NULL, NULL, -1.8879000, 106.1514000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 20000.00, 65000.00, NULL, 1, 1, 1, 0, 'Klaim Halal', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=82', NULL, 0, 4, 1, '2026-07-30 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(5, 'mie-koba-corner-dummy', 'Mie Koba Corner', 1, 'Ari', 'Restoran keluarga dengan inspirasi mie kuah khas Bangka.', 'Restoran keluarga dengan inspirasi mie kuah khas Bangka. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Mie kuah ikan, pangsit, es teh jeruk', 'Kuah ikan gurih dengan sentuhan manis dan segar', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.9108000, 106.1211000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 22000.00, 60000.00, NULL, 1, 1, 0, 1, 'Klaim Halal', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=82', NULL, 0, 5, 1, '2026-07-29 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(6, 'martabak-bangka-heritage-dummy', 'Martabak Bangka Heritage', 25, 'Budi', 'Gerai martabak dan kudapan yang cocok sebagai buah tangan.', 'Gerai martabak dan kudapan yang cocok sebagai buah tangan. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Martabak klasik, cokelat kacang, keju', 'Manis, buttery, tekstur lembut dan renyah', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8561000, 106.1059000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 30000.00, 95000.00, NULL, 1, 1, 0, 0, 'Halal Bersertifikat', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=82', NULL, 0, 6, 1, '2026-07-28 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(7, 'seafood-rebo-dummy', 'Seafood Rebo', 1, 'Lina', 'Rumah makan seafood dengan menu ikan, udang, dan cumi berdasarkan hasil laut harian.', 'Rumah makan seafood dengan menu ikan, udang, dan cumi berdasarkan hasil laut harian. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Ikan bakar, cumi lada garam, udang saus', 'Segar, gurih, dan dominan cita rasa laut', 'Rebo, Kabupaten Bangka', NULL, NULL, NULL, -1.8387000, 106.1164000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 35000.00, 150000.00, NULL, 1, 1, 1, 1, 'Klaim Halal', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1400&q=82', NULL, 0, 7, 1, '2026-07-27 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(8, 'kafe-tanjung-dummy', 'Kafe Tanjung', 3, 'Rio', 'Kafe kasual dengan minuman dingin, kopi, dan makanan ringan.', 'Kafe kasual dengan minuman dingin, kopi, dan makanan ringan. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Kopi susu, mocktail tropis, pasta, snack', 'Ringan, modern, dan mudah dinikmati keluarga', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8780000, 106.1483000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 20000.00, 85000.00, NULL, 1, 1, 0, 0, 'Halal Bersertifikat', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=82', NULL, 0, 8, 1, '2026-07-26 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(9, 'pempek-bangka-rasa-dummy', 'Pempek Bangka Rasa', 4, 'Yuni', 'Kedai pempek dan olahan ikan dengan pilihan saus khas.', 'Kedai pempek dan olahan ikan dengan pilihan saus khas. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Pempek lenjer, kapal selam, otak-otak', 'Gurih ikan dengan saus asam, manis, dan pedas', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8519000, 106.1142000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 15000.00, 65000.00, NULL, 1, 1, 0, 1, 'Klaim Halal', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=82', NULL, 0, 9, 1, '2026-07-25 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38'),
	(10, 'oleh-oleh-sepintu-sedulang-dummy', 'Oleh-Oleh Sepintu Sedulang', 25, 'Sari', 'Pusat oleh-oleh yang menghadirkan kerupuk, kemplang, kue, dan produk UMKM.', 'Pusat oleh-oleh yang menghadirkan kerupuk, kemplang, kue, dan produk UMKM. Informasi ini adalah data dummy untuk pengujian antarmuka. Menu, harga, status halal, dan alamat harus diverifikasi sebelum digunakan sebagai data publik resmi.', 'Kemplang, kerupuk ikan, kue kering, sirup lokal', 'Beragam rasa khas produk rumahan Bangka', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8605000, 106.1017000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "09:00", "tutup": "21:00"}, "minggu": {"buka": "09:00", "tutup": "22:00"}}', 10000.00, 120000.00, NULL, 1, 1, 1, 0, 'Halal Bersertifikat', NULL, NULL, NULL, 'Tunai, QRIS, transfer bank', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=1400&q=82', NULL, 0, 10, 1, '2026-07-24 09:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:47:38');

-- Dumping structure for table dinas_pariwisata.kuliner_fasilitas
DROP TABLE IF EXISTS `kuliner_fasilitas`;
CREATE TABLE IF NOT EXISTS `kuliner_fasilitas` (
  `kuliner_id` bigint unsigned NOT NULL,
  `fasilitas_id` int unsigned NOT NULL,
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`kuliner_id`,`fasilitas_id`),
  KEY `idx_kuliner_fasilitas_fasilitas` (`fasilitas_id`),
  CONSTRAINT `fk_kuliner_fasilitas_kuliner` FOREIGN KEY (`kuliner_id`) REFERENCES `kuliner` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kuliner_fasilitas_master` FOREIGN KEY (`fasilitas_id`) REFERENCES `master_fasilitas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.kuliner_fasilitas: ~0 rows (approximately)
DELETE FROM `kuliner_fasilitas`;

-- Dumping structure for table dinas_pariwisata.kuliner_galeri
DROP TABLE IF EXISTS `kuliner_galeri`;
CREATE TABLE IF NOT EXISTS `kuliner_galeri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kuliner_id` bigint unsigned NOT NULL,
  `jenis_media` enum('Foto','Video','Virtual Tour') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Foto',
  `file_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teks_alternatif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kuliner_galeri_usaha_urutan` (`kuliner_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_kuliner_galeri_usaha` FOREIGN KEY (`kuliner_id`) REFERENCES `kuliner` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.kuliner_galeri: ~0 rows (approximately)
DELETE FROM `kuliner_galeri`;

-- Dumping structure for table dinas_pariwisata.kuliner_menu
DROP TABLE IF EXISTS `kuliner_menu`;
CREATE TABLE IF NOT EXISTS `kuliner_menu` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kuliner_id` bigint unsigned NOT NULL,
  `kategori_menu` enum('Makanan','Minuman','Paket','Oleh-oleh','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Makanan',
  `nama_menu` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `harga` decimal(14,2) DEFAULT NULL,
  `foto_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tersedia` tinyint(1) NOT NULL DEFAULT '1',
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kuliner_menu_usaha` (`kuliner_id`,`tersedia`,`unggulan`,`urutan`),
  CONSTRAINT `fk_kuliner_menu_usaha` FOREIGN KEY (`kuliner_id`) REFERENCES `kuliner` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.kuliner_menu: ~0 rows (approximately)
DELETE FROM `kuliner_menu`;

-- Dumping structure for table dinas_pariwisata.master_fasilitas
DROP TABLE IF EXISTS `master_fasilitas`;
CREATE TABLE IF NOT EXISTS `master_fasilitas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_fasilitas` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori` enum('Umum','Hotel','Kuliner','Wisata','Aksesibilitas','Keamanan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Umum',
  `ikon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_fasilitas_kode` (`kode`),
  UNIQUE KEY `uk_master_fasilitas_nama` (`nama_fasilitas`),
  KEY `idx_master_fasilitas_kategori_aktif` (`kategori`,`aktif`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_fasilitas: ~26 rows (approximately)
DELETE FROM `master_fasilitas`;
INSERT INTO `master_fasilitas` (`id`, `kode`, `nama_fasilitas`, `kategori`, `ikon`, `deskripsi`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'PARKIR', 'Area Parkir', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(2, 'TOILET', 'Toilet', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(3, 'MUSALA', 'Musala / Tempat Ibadah', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(4, 'WIFI', 'Wi-Fi', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(5, 'NON_TUNAI', 'Pembayaran Non Tunai', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(6, 'DIFABEL', 'Akses Ramah Difabel', 'Aksesibilitas', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(7, 'KURSI_RODA', 'Kursi Roda', 'Aksesibilitas', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(8, 'LIFT', 'Lift', 'Aksesibilitas', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(9, 'AC', 'Pendingin Ruangan', 'Hotel', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(10, 'KOLAM_RENANG', 'Kolam Renang', 'Hotel', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(11, 'RESTORAN_HOTEL', 'Restoran Hotel', 'Hotel', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(12, 'RUANG_PERTEMUAN', 'Ruang Pertemuan', 'Hotel', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(13, 'RESEPSIONIS_24_JAM', 'Resepsionis 24 Jam', 'Hotel', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(14, 'ROOM_SERVICE', 'Layanan Kamar', 'Hotel', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(15, 'AREA_MEROKOK', 'Area Merokok', 'Kuliner', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(16, 'AREA_ANAK', 'Area Bermain Anak', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(17, 'DELIVERY', 'Layanan Antar', 'Kuliner', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(18, 'PEMANDU', 'Pemandu Wisata', 'Wisata', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(19, 'PUSAT_INFORMASI', 'Pusat Informasi', 'Wisata', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(20, 'SPOT_FOTO', 'Spot Foto', 'Wisata', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(21, 'SEWA_PERALATAN', 'Sewa Peralatan', 'Wisata', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(22, 'P3K', 'Pertolongan Pertama / P3K', 'Keamanan', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(23, 'CCTV', 'CCTV', 'Keamanan', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(24, 'PETUGAS_KEAMANAN', 'Petugas Keamanan', 'Keamanan', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(25, 'TEMPAT_SAMPAH', 'Tempat Sampah', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(26, 'CHARGING_STATION', 'Charging Station', 'Umum', NULL, NULL, 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10');

-- Dumping structure for table dinas_pariwisata.master_jabatan
DROP TABLE IF EXISTS `master_jabatan`;
CREATE TABLE IF NOT EXISTS `master_jabatan` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama_jabatan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nama_jabatan` (`nama_jabatan`),
  KEY `idx_master_jabatan_nama_jabatan` (`nama_jabatan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_jabatan: ~0 rows (approximately)
DELETE FROM `master_jabatan`;

-- Dumping structure for table dinas_pariwisata.master_jenis_hotel
DROP TABLE IF EXISTS `master_jenis_hotel`;
CREATE TABLE IF NOT EXISTS `master_jenis_hotel` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_jenis` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_jenis_hotel_kode` (`kode`),
  UNIQUE KEY `uk_master_jenis_hotel_nama` (`nama_jenis`),
  KEY `idx_master_jenis_hotel_aktif` (`aktif`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_jenis_hotel: ~9 rows (approximately)
DELETE FROM `master_jenis_hotel`;
INSERT INTO `master_jenis_hotel` (`id`, `kode`, `nama_jenis`, `deskripsi`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'HOTEL', 'Hotel', 'Akomodasi hotel untuk wisata dan perjalanan bisnis.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:09'),
	(2, 'RESORT', 'Resort', 'Akomodasi rekreasi dengan fasilitas pendukung.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:09'),
	(3, 'VILLA', 'Villa', 'Akomodasi berupa rumah atau vila privat.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(4, 'GUESTHOUSE', 'Guest House', 'Akomodasi skala kecil dengan suasana lebih personal.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:09'),
	(5, 'HOMESTAY', 'Homestay', 'Akomodasi berbasis rumah tinggal dan pengalaman lokal.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:09'),
	(6, 'HOSTEL', 'Hostel', 'Akomodasi ekonomis dengan fasilitas bersama.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(7, 'MOTEL', 'Motel', 'Akomodasi untuk perjalanan singkat dengan akses kendaraan.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(8, 'PENGINAPAN', 'Penginapan', 'Akomodasi umum selain klasifikasi lainnya.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(9, 'LAINNYA', 'Lainnya', 'Jenis akomodasi lainnya.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10');

-- Dumping structure for table dinas_pariwisata.master_kategori_acara
DROP TABLE IF EXISTS `master_kategori_acara`;
CREATE TABLE IF NOT EXISTS `master_kategori_acara` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kategori` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ikon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_kategori_acara_kode` (`kode`),
  UNIQUE KEY `uk_master_kategori_acara_slug` (`slug`),
  UNIQUE KEY `uk_master_kategori_acara_nama` (`nama_kategori`),
  KEY `idx_master_kategori_acara_aktif_urutan` (`aktif`,`urutan`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_kategori_acara: ~9 rows (approximately)
DELETE FROM `master_kategori_acara`;
INSERT INTO `master_kategori_acara` (`id`, `kode`, `slug`, `nama_kategori`, `deskripsi`, `ikon`, `urutan`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'FESTIVAL', 'festival', 'Festival', 'Festival budaya, pariwisata, kuliner, dan ekonomi kreatif.', NULL, 1, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(2, 'PAMERAN', 'pameran', 'Pameran', 'Pameran produk, promosi destinasi, dan ekonomi kreatif.', NULL, 2, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(3, 'PELATIHAN', 'pelatihan', 'Pelatihan', 'Pelatihan dan peningkatan kapasitas pelaku.', NULL, 3, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(4, 'SEMINAR', 'seminar', 'Seminar / Diskusi', 'Seminar, sosialisasi, lokakarya, dan diskusi publik.', NULL, 4, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(5, 'PERTUNJUKAN', 'pertunjukan', 'Pertunjukan', 'Pertunjukan seni, budaya, dan hiburan.', NULL, 5, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(6, 'LOMBA', 'lomba', 'Lomba / Kompetisi', 'Lomba dan kompetisi bidang pariwisata atau ekonomi kreatif.', NULL, 6, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(7, 'PROMOSI', 'promosi', 'Promosi Pariwisata', 'Kegiatan promosi destinasi, kuliner, dan produk daerah.', NULL, 7, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(8, 'KUNJUNGAN', 'kunjungan', 'Kunjungan / Tur', 'Kunjungan, tur, famtrip, dan kegiatan jelajah destinasi.', NULL, 8, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(9, 'LAINNYA', 'lainnya', 'Lainnya', 'Kategori acara publik lainnya.', NULL, 99, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(10, 'DUM-AC-FOR', 'dummy-forum', 'Forum & Temu Kreatif', 'Forum diskusi, jejaring, dan kolaborasi.', NULL, 4, 1, '2026-08-08 06:30:32', '2026-08-08 06:30:32');

-- Dumping structure for table dinas_pariwisata.master_kategori_berita
DROP TABLE IF EXISTS `master_kategori_berita`;
CREATE TABLE IF NOT EXISTS `master_kategori_berita` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kategori` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ikon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_kategori_berita_kode` (`kode`),
  UNIQUE KEY `uk_master_kategori_berita_slug` (`slug`),
  UNIQUE KEY `uk_master_kategori_berita_nama` (`nama_kategori`),
  KEY `idx_master_kategori_berita_aktif_urutan` (`aktif`,`urutan`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_kategori_berita: ~9 rows (approximately)
DELETE FROM `master_kategori_berita`;
INSERT INTO `master_kategori_berita` (`id`, `kode`, `slug`, `nama_kategori`, `deskripsi`, `ikon`, `urutan`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'PENGUMUMAN', 'pengumuman', 'Pengumuman', 'Informasi resmi dan pengumuman dari Dinas Pariwisata.', NULL, 1, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(2, 'PARIWISATA', 'pariwisata', 'Pariwisata', 'Berita destinasi, layanan, dan perkembangan pariwisata.', NULL, 2, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(3, 'EKRAF', 'ekonomi-kreatif', 'Ekonomi Kreatif', 'Berita pelaku, produk, dan kegiatan ekonomi kreatif.', NULL, 3, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(4, 'PELATIHAN', 'pelatihan', 'Pelatihan', 'Informasi pelatihan, pembinaan, dan peningkatan kapasitas.', NULL, 4, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(5, 'PRESTASI', 'prestasi', 'Prestasi', 'Prestasi daerah, pelaku pariwisata, dan ekonomi kreatif.', NULL, 5, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(6, 'KEBIJAKAN', 'kebijakan', 'Kebijakan', 'Kebijakan, regulasi, dan program resmi bidang pariwisata.', NULL, 6, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(7, 'UMUM', 'umum', 'Umum', 'Berita umum lainnya.', NULL, 99, 1, '2026-08-06 09:52:05', '2026-08-06 09:52:05'),
	(8, 'DUM-BR-KOM', 'dummy-komunitas', 'Komunitas', 'Aktivitas komunitas dan jejaring kreatif.', NULL, 3, 1, '2026-08-08 06:30:32', '2026-08-08 06:30:32'),
	(9, 'DUM-BR-PROG', 'dummy-program-kebijakan', 'Program & Kebijakan', 'Program, kebijakan, dan layanan pemerintah.', NULL, 4, 1, '2026-08-08 06:30:32', '2026-08-08 06:30:32');

-- Dumping structure for table dinas_pariwisata.master_kategori_kuliner
DROP TABLE IF EXISTS `master_kategori_kuliner`;
CREATE TABLE IF NOT EXISTS `master_kategori_kuliner` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kategori` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_kategori_kuliner_kode` (`kode`),
  UNIQUE KEY `uk_master_kategori_kuliner_nama` (`nama_kategori`),
  KEY `idx_master_kategori_kuliner_aktif` (`aktif`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_kategori_kuliner: ~11 rows (approximately)
DELETE FROM `master_kategori_kuliner`;
INSERT INTO `master_kategori_kuliner` (`id`, `kode`, `nama_kategori`, `deskripsi`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'RESTORAN', 'Restoran', 'Usaha kuliner dengan layanan makan di tempat.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:08'),
	(2, 'RUMAH_MAKAN', 'Rumah Makan', 'Usaha makanan utama dengan konsep rumah makan.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(3, 'KAFE', 'Kafe & Kedai Kopi', 'Kafe, kedai kopi, dan ruang santai.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:09'),
	(4, 'WARUNG', 'Warung Lokal', 'Warung dengan sajian lokal dan rumahan.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:09'),
	(5, 'KEDAI', 'Kedai', 'Usaha kuliner dengan menu khusus atau sederhana.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(6, 'JAJANAN', 'Jajanan / Street Food', 'Kuliner jalanan, jajanan, atau usaha gerobak.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(7, 'OLEH_OLEH', 'Toko Oleh-oleh', 'Pusat penjualan makanan khas dan buah tangan.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(8, 'BAKERY', 'Bakery / Toko Roti', 'Usaha roti, kue, dan produk panggang.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(9, 'CATERING', 'Katering', 'Jasa penyediaan makanan untuk kegiatan atau pemesanan.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(10, 'LAINNYA', 'Lainnya', 'Kategori kuliner lainnya.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(25, 'OLEHOLEH', 'Oleh-oleh', 'Produk makanan dan minuman untuk buah tangan.', 1, '2026-08-08 07:04:09', '2026-08-08 07:04:09');

-- Dumping structure for table dinas_pariwisata.master_kategori_wisata
DROP TABLE IF EXISTS `master_kategori_wisata`;
CREATE TABLE IF NOT EXISTS `master_kategori_wisata` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kategori` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_kategori_wisata_kode` (`kode`),
  UNIQUE KEY `uk_master_kategori_wisata_nama` (`nama_kategori`),
  KEY `idx_master_kategori_wisata_aktif` (`aktif`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_kategori_wisata: ~11 rows (approximately)
DELETE FROM `master_kategori_wisata`;
INSERT INTO `master_kategori_wisata` (`id`, `kode`, `nama_kategori`, `deskripsi`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'ALAM', 'Wisata Alam', 'Destinasi dengan daya tarik alam dan lanskap.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:08'),
	(2, 'BAHARI', 'Wisata Bahari', 'Destinasi pantai, pesisir, dan aktivitas bahari.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:08'),
	(3, 'BUDAYA', 'Wisata Budaya', 'Destinasi sejarah, religi, budaya, dan warisan lokal.', 1, '2026-08-06 08:07:10', '2026-08-08 07:04:08'),
	(4, 'SEJARAH', 'Wisata Sejarah', 'Bangunan, situs, dan kawasan bersejarah.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(5, 'RELIGI', 'Wisata Religi', 'Tempat ibadah, ziarah, dan kegiatan keagamaan.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(6, 'BUATAN', 'Wisata Buatan', 'Taman rekreasi dan destinasi buatan manusia.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(7, 'EDUKASI', 'Wisata Edukasi', 'Destinasi pembelajaran, museum, pusat sains, dan sejenisnya.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(8, 'BELANJA', 'Wisata Belanja', 'Kawasan belanja, pasar, dan sentra produk lokal.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(9, 'AGRO', 'Agrowisata', 'Perkebunan, pertanian, peternakan, dan aktivitas agro.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(10, 'MINAT_KHUSUS', 'Wisata Minat Khusus', 'Ekowisata, petualangan, olahraga, dan minat khusus.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(11, 'LAINNYA', 'Lainnya', 'Kategori tempat wisata lainnya.', 1, '2026-08-06 08:07:10', '2026-08-06 08:07:10'),
	(27, 'KELUARGA', 'Wisata Keluarga', 'Destinasi rekreasi yang ramah keluarga.', 1, '2026-08-08 07:04:08', '2026-08-08 07:04:08');

-- Dumping structure for table dinas_pariwisata.master_kecamatan
DROP TABLE IF EXISTS `master_kecamatan`;
CREATE TABLE IF NOT EXISTS `master_kecamatan` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode_bps` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kecamatan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_bps` (`kode_bps`),
  KEY `idx_master_kecamatan_nama` (`nama_kecamatan`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_kecamatan: ~8 rows (approximately)
DELETE FROM `master_kecamatan`;
INSERT INTO `master_kecamatan` (`id`, `kode_bps`, `nama_kecamatan`, `aktif`) VALUES
	(1, '190101', 'Sungailiat', 1),
	(2, '190102', 'Belinyu', 1),
	(3, '190103', 'Merawang', 1),
	(4, '190104', 'Mendo Barat', 1),
	(5, '190105', 'Pemali', 1),
	(6, '190106', 'Bakam', 1),
	(7, '190107', 'Riau Silip', 1),
	(8, '190108', 'Puding Besar', 1);

-- Dumping structure for table dinas_pariwisata.master_kelurahan
DROP TABLE IF EXISTS `master_kelurahan`;
CREATE TABLE IF NOT EXISTS `master_kelurahan` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kecamatan_id` int unsigned NOT NULL,
  `kode_bps` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kelurahan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis` enum('Desa','Kelurahan') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_bps` (`kode_bps`),
  KEY `idx_master_kelurahan_kecamatan` (`kecamatan_id`),
  KEY `idx_master_kelurahan_nama` (`nama_kelurahan`),
  CONSTRAINT `fk_kelurahan_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `master_kecamatan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_kelurahan: ~81 rows (approximately)
DELETE FROM `master_kelurahan`;
INSERT INTO `master_kelurahan` (`id`, `kecamatan_id`, `kode_bps`, `nama_kelurahan`, `jenis`) VALUES
	(1, 1, '1901011001', 'Sungailiat', 'Kelurahan'),
	(2, 1, '1901011002', 'Sri Menanti', 'Kelurahan'),
	(3, 1, '1901011003', 'Kudai', 'Kelurahan'),
	(4, 1, '1901011004', 'Sinar Baru', 'Kelurahan'),
	(5, 1, '1901011005', 'Kenanga', 'Kelurahan'),
	(6, 1, '1901011006', 'Parit Padang', 'Kelurahan'),
	(7, 1, '1901011008', 'Sinar Jaya Jelutung', 'Kelurahan'),
	(8, 1, '1901011009', 'Matras', 'Kelurahan'),
	(9, 1, '1901011010', 'Jelitik', 'Kelurahan'),
	(10, 1, '1901011011', 'Surya Timur', 'Kelurahan'),
	(11, 1, '1901011012', 'Lubuk Kelik', 'Kelurahan'),
	(12, 1, '1901011013', 'Bukit Betung', 'Kelurahan'),
	(13, 1, '1901012007', 'Rebo', 'Desa'),
	(14, 2, '1901021001', 'Kuto Panji', 'Kelurahan'),
	(15, 2, '1901021002', 'Air Jukung', 'Kelurahan'),
	(16, 2, '1901021003', 'Bukit Ketok', 'Kelurahan'),
	(17, 2, '1901021009', 'Remodong Indah', 'Kelurahan'),
	(18, 2, '1901021010', 'Air Asam', 'Kelurahan'),
	(19, 2, '1901021011', 'Mantung', 'Kelurahan'),
	(20, 2, '1901021012', 'Belinyu', 'Kelurahan'),
	(21, 2, '1901022004', 'Gunung Muda', 'Desa'),
	(22, 2, '1901022005', 'Gunung Pelawan', 'Desa'),
	(23, 2, '1901022006', 'Riding Panjang', 'Desa'),
	(24, 2, '1901022007', 'Lumut', 'Desa'),
	(25, 2, '1901022008', 'Bintet', 'Desa'),
	(26, 3, '1901032001', 'Batu Rusa', 'Desa'),
	(27, 3, '1901032002', 'Balun Ijuk', 'Desa'),
	(28, 3, '1901032003', 'Riding Panjang', 'Desa'),
	(29, 3, '1901032004', 'Jurung', 'Desa'),
	(30, 3, '1901032005', 'Kimak', 'Desa'),
	(31, 3, '1901032006', 'Pagarawan', 'Desa'),
	(32, 3, '1901032007', 'Merawang', 'Desa'),
	(33, 3, '1901032008', 'Air Anyir', 'Desa'),
	(34, 3, '1901032009', 'Dwi Makmur', 'Desa'),
	(35, 3, '1901032010', 'Jada Bahrin', 'Desa'),
	(36, 4, '1901042001', 'Petaling', 'Desa'),
	(37, 4, '1901042002', 'Penagan', 'Desa'),
	(38, 4, '1901042003', 'Zed', 'Desa'),
	(39, 4, '1901042004', 'Mendo', 'Desa'),
	(40, 4, '1901042005', 'Paya Benua', 'Desa'),
	(41, 4, '1901042006', 'Cengkong Abang', 'Desa'),
	(42, 4, '1901042007', 'Kace', 'Desa'),
	(43, 4, '1901042008', 'Kemuja', 'Desa'),
	(44, 4, '1901042009', 'Air Duren', 'Desa'),
	(45, 4, '1901042010', 'Kota Kapur', 'Desa'),
	(46, 4, '1901042011', 'Air Buluh', 'Desa'),
	(47, 4, '1901042012', 'Rukam', 'Desa'),
	(48, 4, '1901042013', 'Labuh Air Pandan', 'Desa'),
	(49, 4, '1901042014', 'Kace Timur', 'Desa'),
	(50, 4, '1901042015', 'Petaling Banjar', 'Desa'),
	(51, 5, '1901052001', 'Air Ruai', 'Desa'),
	(52, 5, '1901052002', 'Air Duren', 'Desa'),
	(53, 5, '1901052003', 'Penyamun', 'Desa'),
	(54, 5, '1901052004', 'Sempan', 'Desa'),
	(55, 5, '1901052005', 'Pemali', 'Desa'),
	(56, 5, '1901052006', 'Karya Makmur', 'Desa'),
	(57, 6, '1901062001', 'Bakam', 'Desa'),
	(58, 6, '1901062002', 'Kapuk', 'Desa'),
	(59, 6, '1901062003', 'Dalil', 'Desa'),
	(60, 6, '1901062004', 'Neknang', 'Desa'),
	(61, 6, '1901062005', 'Tiang Tarah', 'Desa'),
	(62, 6, '1901062006', 'Mangka', 'Desa'),
	(63, 6, '1901062007', 'Mabat', 'Desa'),
	(64, 6, '1901062008', 'Bukit Layang', 'Desa'),
	(65, 6, '1901062009', 'Maras Senang', 'Desa'),
	(66, 7, '1901072001', 'Riau', 'Desa'),
	(67, 7, '1901072002', 'Pangkal Niur', 'Desa'),
	(68, 7, '1901072003', 'Pugul', 'Desa'),
	(69, 7, '1901072004', 'Cit', 'Desa'),
	(70, 7, '1901072005', 'Deniang', 'Desa'),
	(71, 7, '1901072006', 'Silip', 'Desa'),
	(72, 7, '1901072007', 'Mapur', 'Desa'),
	(73, 7, '1901072008', 'Banyu Asin', 'Desa'),
	(74, 7, '1901072009', 'Berbura', 'Desa'),
	(75, 8, '1901082001', 'Puding Besar', 'Desa'),
	(76, 8, '1901082002', 'Labu', 'Desa'),
	(77, 8, '1901082003', 'Nibung', 'Desa'),
	(78, 8, '1901082004', 'Tanah Bawah', 'Desa'),
	(79, 8, '1901082005', 'Saing', 'Desa'),
	(80, 8, '1901082006', 'Kota Waringin', 'Desa'),
	(81, 8, '1901082007', 'Kayu Besi', 'Desa');

-- Dumping structure for table dinas_pariwisata.master_komunitas
DROP TABLE IF EXISTS `master_komunitas`;
CREATE TABLE IF NOT EXISTS `master_komunitas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_komunitas` varchar(150) NOT NULL,
  `ketua` varchar(150) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alamat` text,
  `keterangan` text,
  `aktif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.master_komunitas: ~0 rows (approximately)
DELETE FROM `master_komunitas`;
INSERT INTO `master_komunitas` (`id`, `nama_komunitas`, `ketua`, `no_hp`, `email`, `alamat`, `keterangan`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'Komunitas Musik', 'John', '081277483920', 'superman.wisesa@gmail.com', 'Jalan Matras', NULL, 1, '2026-08-15 09:17:31', '2026-08-15 09:17:31'),
	(2, 'yaya', 'alya', '121211212312', 'alyazilyanti3@gmail.com', 'jl.mawar', NULL, 1, '2026-08-19 03:15:32', '2026-08-19 03:15:32');

-- Dumping structure for table dinas_pariwisata.master_status_konservasi
DROP TABLE IF EXISTS `master_status_konservasi`;
CREATE TABLE IF NOT EXISTS `master_status_konservasi` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kode` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `urutan_prioritas` tinyint unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_master_status_konservasi_kode` (`kode`),
  UNIQUE KEY `uk_master_status_konservasi_nama` (`nama_status`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.master_status_konservasi: ~9 rows (approximately)
DELETE FROM `master_status_konservasi`;
INSERT INTO `master_status_konservasi` (`id`, `kode`, `nama_status`, `deskripsi`, `urutan_prioritas`, `aktif`) VALUES
	(1, 'NE', 'Not Evaluated', 'Belum dievaluasi.', 0, 1),
	(2, 'DD', 'Data Deficient', 'Data belum cukup untuk menilai risiko kepunahan.', 1, 1),
	(3, 'LC', 'Least Concern', 'Risiko rendah.', 2, 1),
	(4, 'NT', 'Near Threatened', 'Mendekati terancam.', 3, 1),
	(5, 'VU', 'Vulnerable', 'Rentan.', 4, 1),
	(6, 'EN', 'Endangered', 'Terancam.', 5, 1),
	(7, 'CR', 'Critically Endangered', 'Kritis.', 6, 1),
	(8, 'EW', 'Extinct in the Wild', 'Punah di alam liar.', 7, 1),
	(9, 'EX', 'Extinct', 'Punah.', 8, 1);

-- Dumping structure for table dinas_pariwisata.master_subsektor_ekraf
DROP TABLE IF EXISTS `master_subsektor_ekraf`;
CREATE TABLE IF NOT EXISTS `master_subsektor_ekraf` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` varchar(10) NOT NULL,
  `nama_subsektor` varchar(100) NOT NULL,
  `deskripsi` text,
  `aktif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.master_subsektor_ekraf: ~17 rows (approximately)
DELETE FROM `master_subsektor_ekraf`;
INSERT INTO `master_subsektor_ekraf` (`id`, `kode`, `nama_subsektor`, `deskripsi`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 'APL', 'Aplikasi', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(2, 'ARS', 'Arsitektur', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(3, 'DIN', 'Desain Interior', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(4, 'DKV', 'Desain Komunikasi Visual', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(5, 'DPR', 'Desain Produk', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(6, 'FSH', 'Fashion', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(7, 'FAV', 'Film, Animasi dan Video', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(8, 'FOT', 'Fotografi', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(9, 'KRY', 'Kriya', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(10, 'KUL', 'Kuliner', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(11, 'MUS', 'Musik', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(12, 'PEN', 'Penerbitan', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(13, 'IKL', 'Periklanan', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(14, 'SPT', 'Seni Pertunjukan', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(15, 'SRP', 'Seni Rupa', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(16, 'TVR', 'Televisi dan Radio', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02'),
	(17, 'GME', 'Pengembangan Permainan', NULL, 1, '2026-08-05 12:10:02', '2026-08-05 12:10:02');

-- Dumping structure for table dinas_pariwisata.pengajuan_ekraf
DROP TABLE IF EXISTS `pengajuan_ekraf`;
CREATE TABLE IF NOT EXISTS `pengajuan_ekraf` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `no_registrasi` varchar(30) DEFAULT NULL,
  `status` enum('Menunggu','Perlu Perbaikan','Disetujui','Ditolak') NOT NULL DEFAULT 'Menunggu',
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `nama_lengkap` varchar(150) NOT NULL,
  `nik` char(16) NOT NULL,
  `nama_usaha` varchar(150) NOT NULL,
  `no_hp` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') DEFAULT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `alamat` text,
  `kecamatan_id` int DEFAULT NULL,
  `kelurahan_id` int DEFAULT NULL,
  `kode_pos` varchar(10) DEFAULT NULL,
  `komunitas_id` int DEFAULT NULL,
  `subsektor_id` int NOT NULL,
  `tahun_mulai_usaha` year DEFAULT NULL,
  `nama_merek` varchar(150) DEFAULT NULL,
  `deskripsi_usaha` text,
  `alamat_usaha` text,
  `kecamatan_usaha_id` int DEFAULT NULL,
  `kelurahan_usaha_id` int DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `tahun_berdiri` year DEFAULT NULL,
  `jumlah_tenaga_kerja` int DEFAULT NULL,
  `omzet_per_tahun` decimal(18,2) DEFAULT NULL,
  `media_sosial` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `link_shopee` varchar(500) DEFAULT NULL,
  `visi_usaha` text,
  `misi_usaha` text,
  `produk_jasa` text,
  `prestasi` text,
  `pelatihan` text,
  `pameran` text,
  `kendala_usaha` text,
  `kebutuhan_pembinaan` text,
  `file_sertifikat` varchar(1000) DEFAULT NULL,
  `file_sertifikat_pelatihan` varchar(1000) DEFAULT NULL,
  `file_foto_dokumentasi` varchar(1000) DEFAULT NULL,
  `file_foto_diri` varchar(1000) DEFAULT NULL,
  `file_logo_usaha` varchar(1000) DEFAULT NULL,
  `catatan_verifikasi` text,
  `diverifikasi_oleh` bigint DEFAULT NULL,
  `tanggal_verifikasi` datetime DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `no_registrasi` (`no_registrasi`),
  KEY `fk_subsektor` (`subsektor_id`),
  KEY `fk_komunitas` (`komunitas_id`),
  KEY `fk_kecamatan` (`kecamatan_id`),
  KEY `fk_kelurahan` (`kelurahan_id`),
  KEY `fk_kecamatan_usaha` (`kecamatan_usaha_id`),
  KEY `fk_kelurahan_usaha` (`kelurahan_usaha_id`),
  KEY `idx_pengajuan_ekraf_created_by` (`created_by`),
  KEY `idx_pengajuan_ekraf_unggulan` (`unggulan`,`status`,`tanggal_verifikasi`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.pengajuan_ekraf: ~1 rows (approximately)
DELETE FROM `pengajuan_ekraf`;
INSERT INTO `pengajuan_ekraf` (`id`, `no_registrasi`, `status`, `unggulan`, `nama_lengkap`, `nik`, `nama_usaha`, `no_hp`, `email`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `alamat`, `kecamatan_id`, `kelurahan_id`, `kode_pos`, `komunitas_id`, `subsektor_id`, `tahun_mulai_usaha`, `nama_merek`, `deskripsi_usaha`, `alamat_usaha`, `kecamatan_usaha_id`, `kelurahan_usaha_id`, `latitude`, `longitude`, `tahun_berdiri`, `jumlah_tenaga_kerja`, `omzet_per_tahun`, `media_sosial`, `website`, `link_shopee`, `visi_usaha`, `misi_usaha`, `produk_jasa`, `prestasi`, `pelatihan`, `pameran`, `kendala_usaha`, `kebutuhan_pembinaan`, `file_sertifikat`, `file_sertifikat_pelatihan`, `file_foto_dokumentasi`, `file_foto_diri`, `file_logo_usaha`, `catatan_verifikasi`, `diverifikasi_oleh`, `tanggal_verifikasi`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'EKR-2026-SOLZ7H6G9CC', 'Ditolak', 0, 'Bradika Almandin Wisesa', '1901010101010001', 'Lumpia Rinka', '081217780258', 'superman.wisesa@gmail.com', 'Laki-laki', 'Sungailiat', '1992-01-17', 'Sungailiat, Kabupaten Bangka', 1, 1, '33211', NULL, 10, '2022', 'Lumpia Rinka', 'Data pengujian otomatis Selenium pada lingkungan lokal.', 'Sungailiat, Kabupaten Bangka', 1, 1, -1.8742000, 106.1147000, '2020', 2, 50000000.00, '@selenium_bangka', NULL, 'https://shopee.co.id/pejuangdigitall', 'tes', 'tes', 'Produk kuliner lokal untuk data uji.', 'tes', 'pelatihan', 'pameran', 'kendala', 'kebutuhan', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fekraf%2Fuser-3%2F2026%2F08%2Ffile_sertifikat-14e27c73-1f34-4bda-9b4c-7227b1e5ff26.pdf', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fekraf%2Fuser-3%2F2026%2F08%2Ffile_sertifikat_pelatihan-06ceb70d-8c6d-4324-8e32-440661bc3c0e.pdf', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fekraf%2Fuser-3%2F2026%2F08%2Ffile_foto_dokumentasi-b5eb0d9d-9e9c-4981-bb0c-fd6496d353bd.jpg', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fekraf%2Fuser-3%2F2026%2F08%2Ffile_foto_diri-d52136e9-6473-479e-9dc5-abc109e52301.jpg', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fekraf%2Fuser-3%2F2026%2F08%2Ffile_logo_usaha-4b3e4007-c547-4962-b09e-b1aea51d8ed2.png', 'tes 3', 2, '2026-08-26 19:23:44', 3, 2, '2026-08-11 12:00:22', '2026-08-26 12:23:44');

-- Dumping structure for table dinas_pariwisata.pengajuan_komunitas_asosiasi
DROP TABLE IF EXISTS `pengajuan_komunitas_asosiasi`;
CREATE TABLE IF NOT EXISTS `pengajuan_komunitas_asosiasi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `no_registrasi` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_pengajuan` enum('Menunggu','Perlu Perbaikan','Disetujui','Ditolak') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Menunggu',
  `nama_organisasi` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori` enum('Komunitas','Industri Kreatif','Lembaga','Asosiasi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan_id` int unsigned NOT NULL,
  `kelurahan_id` int unsigned NOT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun_berdiri` year NOT NULL,
  `subsektor_id` int DEFAULT NULL,
  `status_badan_hukum` enum('Tidak Ada','Ada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Tidak Ada',
  `nomor_akta` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rincian` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `visi_misi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nama_ketua` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_hp_ketua` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_logo_organisasi` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_foto_dokumentasi` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_akta_badan_hukum` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `master_komunitas_id` int DEFAULT NULL COMMENT 'Diisi setelah pengajuan disetujui dan dibuat menjadi data master',
  `persetujuan_publikasi` tinyint(1) NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `catatan_verifikasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `alasan_penolakan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `diverifikasi_oleh` bigint unsigned DEFAULT NULL,
  `tanggal_verifikasi` datetime DEFAULT NULL,
  `token_perbaikan` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_perbaikan_kedaluwarsa` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pengajuan_kla_no_registrasi` (`no_registrasi`),
  UNIQUE KEY `uk_pengajuan_kla_token_perbaikan` (`token_perbaikan`),
  KEY `idx_pengajuan_komunitas_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.pengajuan_komunitas_asosiasi: ~0 rows (approximately)
DELETE FROM `pengajuan_komunitas_asosiasi`;
INSERT INTO `pengajuan_komunitas_asosiasi` (`id`, `no_registrasi`, `status_pengajuan`, `nama_organisasi`, `kategori`, `email`, `kecamatan_id`, `kelurahan_id`, `alamat`, `tahun_berdiri`, `subsektor_id`, `status_badan_hukum`, `nomor_akta`, `rincian`, `visi_misi`, `nama_ketua`, `no_hp_ketua`, `file_logo_organisasi`, `file_foto_dokumentasi`, `file_akta_badan_hukum`, `latitude`, `longitude`, `master_komunitas_id`, `persetujuan_publikasi`, `dipublikasikan`, `tanggal_publikasi`, `catatan_verifikasi`, `alasan_penolakan`, `diverifikasi_oleh`, `tanggal_verifikasi`, `token_perbaikan`, `token_perbaikan_kedaluwarsa`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'KLA-2026-STVIDV227H2', 'Disetujui', 'Komunitas Musik', 'Komunitas', 'superman.wisesa@gmail.com', 1, 6, 'Jalan Matras', '2026', 11, 'Tidak Ada', NULL, NULL, 'tes', 'John', '081277483920', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fkomunitas%2Fuser-3%2F2026%2F08%2Ffile_logo_organisasi-1889d2d0-03ba-4846-866c-d955ef386112.png', NULL, NULL, NULL, NULL, 1, 1, 1, '2026-08-15 16:17:31', NULL, NULL, 2, '2026-08-15 16:17:31', NULL, NULL, 3, 2, '2026-08-15 04:26:02', '2026-08-15 09:17:31'),
	(2, 'KLA-2026-SZIQMGEHTJI', 'Disetujui', 'yaya', 'Komunitas', 'alyazilyanti3@gmail.com', 8, 80, 'jl.mawar', '2000', 5, 'Tidak Ada', '121212121', NULL, NULL, 'alya', '121211212312', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fkomunitas%2Fuser-4%2F2026%2F08%2Ffile_logo_organisasi-54fc1de9-6683-40cc-9d65-efa4ab73694c.png', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fkomunitas%2Fuser-4%2F2026%2F08%2Ffile_foto_dokumentasi-5bd29d2b-8166-4549-a02a-97c3ea105568.jpg', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fkomunitas%2Fuser-4%2F2026%2F08%2Ffile_akta_badan_hukum-eee9d2cf-c357-4b52-973a-8d3ec75df56f.jpg', NULL, NULL, 2, 1, 1, '2026-08-19 10:15:32', NULL, NULL, 2, '2026-08-19 10:15:32', NULL, NULL, 4, 2, '2026-08-19 03:15:10', '2026-08-19 03:15:32');

-- Dumping structure for table dinas_pariwisata.pengajuan_sdm_pariwisata
DROP TABLE IF EXISTS `pengajuan_sdm_pariwisata`;
CREATE TABLE IF NOT EXISTS `pengajuan_sdm_pariwisata` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `no_registrasi` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_pengajuan` enum('Menunggu','Perlu Perbaikan','Disetujui','Ditolak') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Menunggu',
  `nama_lengkap` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jabatan` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nik` char(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_hp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `npwp` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempat_bertugas` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat_bertugas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bulan_mulai_bertugas` tinyint unsigned NOT NULL,
  `tahun_mulai_bertugas` year NOT NULL,
  `file_foto_diri` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_sertifikat_pelatihan` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `persetujuan_publikasi` tinyint(1) NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `catatan_verifikasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `alasan_penolakan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `diverifikasi_oleh` bigint unsigned DEFAULT NULL,
  `tanggal_verifikasi` datetime DEFAULT NULL,
  `token_perbaikan` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_perbaikan_kedaluwarsa` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pengajuan_sdm_no_registrasi` (`no_registrasi`),
  UNIQUE KEY `uk_pengajuan_sdm_token_perbaikan` (`token_perbaikan`),
  KEY `idx_pengajuan_sdm_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.pengajuan_sdm_pariwisata: ~0 rows (approximately)
DELETE FROM `pengajuan_sdm_pariwisata`;
INSERT INTO `pengajuan_sdm_pariwisata` (`id`, `no_registrasi`, `status_pengajuan`, `nama_lengkap`, `email`, `jabatan`, `nik`, `alamat`, `no_hp`, `npwp`, `tempat_bertugas`, `alamat_bertugas`, `bulan_mulai_bertugas`, `tahun_mulai_bertugas`, `file_foto_diri`, `file_sertifikat_pelatihan`, `persetujuan_publikasi`, `dipublikasikan`, `tanggal_publikasi`, `catatan_verifikasi`, `alasan_penolakan`, `diverifikasi_oleh`, `tanggal_verifikasi`, `token_perbaikan`, `token_perbaikan_kedaluwarsa`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'SDM-2026-STV78STZ3K8', 'Disetujui', 'Bradika Almandin Wisesa', 'superman.wisesa@gmail.com', 'Staff Kitchen', '3573023010920005', 'Jl. Nusakambangan no. 19 E', '081217780258', NULL, 'Lumpia Rinka', 'Jalan Sripemandang', 1, '2026', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fsdm%2Fuser-3%2F2026%2F08%2Ffile_foto_diri-f4cb5c02-3710-446a-8c12-e3c66da0c8fb.jpg', '/api/uploads/r2/submission?key=appekraf%2Fpengajuan%2Fsdm%2Fuser-3%2F2026%2F08%2Ffile_sertifikat_pelatihan-d03c9b71-c0f1-4f3c-9ef6-159a1a94433f.pdf', 1, 1, '2026-08-15 11:17:44', NULL, NULL, 2, '2026-08-15 11:17:44', NULL, NULL, 3, 2, '2026-08-15 04:17:21', '2026-08-15 04:17:44');

-- Dumping structure for table dinas_pariwisata.pengguna
DROP TABLE IF EXISTS `pengguna`;
CREATE TABLE IF NOT EXISTS `pengguna` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role` enum('admin','pengguna','pengaju') NOT NULL DEFAULT 'pengguna' COMMENT 'admin mengelola akun; pengguna adalah petugas operasional; pengaju adalah masyarakat/pemohon Google OAuth',
  `nip` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `id_jabatan` int DEFAULT NULL,
  `auth_provider` enum('password','google') NOT NULL DEFAULT 'password',
  `google_sub` varchar(191) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `password` varchar(255) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_phone` (`phone`),
  UNIQUE KEY `uk_users_google_sub` (`google_sub`),
  KEY `idx_users_role_status` (`role`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.pengguna: ~2 rows (approximately)
DELETE FROM `pengguna`;
INSERT INTO `pengguna` (`id`, `role`, `nip`, `name`, `email`, `phone`, `id_jabatan`, `auth_provider`, `google_sub`, `email_verified`, `password`, `avatar_url`, `status`, `last_login_at`, `created_at`, `updated_at`) VALUES
	(1, 'admin', NULL, 'Administrator APPEKRAF', 'admin@appekraf.bangka.go.id', NULL, NULL, 'password', NULL, 0, 'scrypt$3ee9fb46643f71dd88d344e490d1a8d5$52ed493cd53039c165708474cb716181ae3d06172f6137342445111a2aaf6c8d1928f7c639d3c2f589bd8980d6a5e6aa0847f1e6250a79b6d6860459cfb4501c', NULL, 'active', '2026-08-26 13:09:05', '2026-08-07 08:01:55', '2026-08-26 06:09:05'),
	(2, 'pengguna', NULL, 'Brad', 'bradika@polman-babel.ac.id', NULL, NULL, 'password', NULL, 0, 'scrypt$d56366b59e7fc844ccd06409ea0eefb1$604901656f294c523a677e22d660dc94de10713bf5edb8bf690fd2a4a5980faba1b7f04f65b2c9110bf1515e1a28f6ff1b6db077a126274c436dd0a7cdf1ab6d', NULL, 'active', '2026-08-25 06:42:13', '2026-08-07 08:12:06', '2026-08-24 23:42:13'),
	(3, 'pengaju', NULL, 'Bradika Almandin Wisesa', 'superman.wisesa@gmail.com', NULL, NULL, 'google', '115561841967191663146', 1, 'oauth:google', 'https://lh3.googleusercontent.com/a/ACg8ocKt-YzROr82zQ41zZEW7VzgJRQtZjBrP_T5GnZG-TfxKhV89L8wWQ=s96-c', 'active', '2026-08-25 14:57:59', '2026-08-11 10:27:57', '2026-08-25 07:57:59'),
	(4, 'pengaju', NULL, 'Alya Zilyanti', 'alyazilyanti3@gmail.com', NULL, NULL, 'google', '117657544875972883865', 1, 'oauth:google', 'https://lh3.googleusercontent.com/a/ACg8ocJEJa5bieoKfJlNz4h0IH_50xUT6cLP3a3Y0ubMhkItSz2cbfwT=s96-c', 'active', '2026-08-19 10:05:26', '2026-08-19 03:05:26', '2026-08-19 03:05:26');

-- Dumping structure for table dinas_pariwisata.produk_ekraf
DROP TABLE IF EXISTS `produk_ekraf`;
CREATE TABLE IF NOT EXISTS `produk_ekraf` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nama_produk` varchar(200) NOT NULL,
  `nama_pelaku` varchar(200) NOT NULL,
  `subsektor` varchar(120) NOT NULL,
  `deskripsi` text,
  `harga` decimal(18,2) DEFAULT NULL,
  `stok` int unsigned DEFAULT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_produk_nama` (`nama_produk`),
  KEY `idx_produk_subsektor` (`subsektor`),
  KEY `idx_produk_status` (`status`),
  KEY `fk_produk_created_by` (`created_by`),
  KEY `fk_produk_updated_by` (`updated_by`),
  CONSTRAINT `fk_produk_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_produk_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.produk_ekraf: ~0 rows (approximately)
DELETE FROM `produk_ekraf`;

-- Dumping structure for table dinas_pariwisata.satwa_endemik
DROP TABLE IF EXISTS `satwa_endemik`;
CREATE TABLE IF NOT EXISTS `satwa_endemik` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_umum` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_lokal` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_ilmiah` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kingdom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Animalia',
  `filum` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelas` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ordo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `famili` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `genus` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_endemisitas` enum('Endemik Lokal','Endemik Regional','Asli/Native','Migran','Introduksi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Endemik Regional',
  `wilayah_endemik` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_konservasi_id` int unsigned DEFAULT NULL,
  `status_perlindungan_indonesia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomor_peraturan_perlindungan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_singkat` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ciri_fisik` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `habitat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `persebaran` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `makanan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `perilaku` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reproduksi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ancaman` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `upaya_konservasi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fakta_unik` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `panduan_pengamatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `peringatan_interaksi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `foto_utama` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audio_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sumber_ringkas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `urutan_tampil` int unsigned NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_satwa_endemik_nama_ilmiah` (`nama_ilmiah`),
  UNIQUE KEY `uk_satwa_endemik_slug` (`slug`),
  KEY `idx_satwa_endemik_status_konservasi` (`status_konservasi_id`),
  KEY `idx_satwa_endemik_publik` (`dipublikasikan`,`aktif`,`unggulan`),
  KEY `idx_satwa_endemik_nama_umum` (`nama_umum`),
  KEY `fk_satwa_created_by` (`created_by`),
  KEY `fk_satwa_updated_by` (`updated_by`),
  CONSTRAINT `fk_satwa_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_satwa_status_konservasi` FOREIGN KEY (`status_konservasi_id`) REFERENCES `master_status_konservasi` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_satwa_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.satwa_endemik: ~10 rows (approximately)
DELETE FROM `satwa_endemik`;
INSERT INTO `satwa_endemik` (`id`, `slug`, `nama_umum`, `nama_lokal`, `nama_ilmiah`, `kingdom`, `filum`, `kelas`, `ordo`, `famili`, `genus`, `status_endemisitas`, `wilayah_endemik`, `status_konservasi_id`, `status_perlindungan_indonesia`, `nomor_peraturan_perlindungan`, `deskripsi_singkat`, `deskripsi`, `ciri_fisik`, `habitat`, `persebaran`, `makanan`, `perilaku`, `reproduksi`, `ancaman`, `upaya_konservasi`, `fakta_unik`, `panduan_pengamatan`, `peringatan_interaksi`, `foto_utama`, `audio_url`, `video_url`, `sumber_ringkas`, `unggulan`, `urutan_tampil`, `dipublikasikan`, `tanggal_publikasi`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'mentilin-bangka-dummy', 'Mentilin', 'Mentilin', 'Cephalopachus bancanus', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Endemik Regional', 'Pulau Bangka dan kawasan regional terkait', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Primata nokturnal berukuran kecil yang dikenal sebagai salah satu fauna khas kawasan Bangka Belitung.', 'Primata nokturnal berukuran kecil yang dikenal sebagai salah satu fauna khas kawasan Bangka Belitung. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan sekunder, semak, kebun campuran, dan area berpohon.', 'Pulau Bangka dan wilayah sebaran regional sesuai catatan ilmiah.', NULL, NULL, NULL, NULL, NULL, 'Aktif malam hari, memiliki mata besar, dan bergerak dengan lompatan.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Jangan memberi makan atau mengejar satwa; lakukan pengamatan dari jarak aman.', 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 1, 1, 1, '2026-08-04 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(2, 'trenggiling-sunda-dummy', 'Trenggiling Sunda', 'Trenggiling', 'Manis javanica', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra dan wilayah Sunda', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Mamalia bersisik yang aktif terutama pada malam hari dan memakan semut serta rayap.', 'Mamalia bersisik yang aktif terutama pada malam hari dan memakan semut serta rayap. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan, semak, kebun, dan area dengan sumber pakan serangga.', 'Asia Tenggara termasuk sebagian wilayah Sumatra.', NULL, NULL, NULL, NULL, NULL, 'Tubuh dilindungi sisik keras dan dapat menggulung saat merasa terancam.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Satwa dilindungi; jangan disentuh, dipelihara, atau diperdagangkan.', 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 1, 2, 1, '2026-08-03 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(3, 'rusa-sambar-dummy', 'Rusa Sambar', 'Rusa', 'Rusa unicolor', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Rusa berukuran besar yang dapat dijumpai pada berbagai tipe habitat hutan dan tepi kawasan terbuka.', 'Rusa berukuran besar yang dapat dijumpai pada berbagai tipe habitat hutan dan tepi kawasan terbuka. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan dataran rendah, tepian hutan, dan area dekat sumber air.', 'Berbagai wilayah Asia Selatan dan Asia Tenggara termasuk Sumatra.', NULL, NULL, NULL, NULL, NULL, 'Pejantan memiliki ranggah dan cenderung aktif pada waktu teduh.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Amati dari jarak aman dan hindari suara keras yang mengganggu satwa.', 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 1, 3, 1, '2026-08-02 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(4, 'beruk-dummy', 'Beruk', 'Beruk', 'Macaca nemestrina', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Primata berekor pendek yang hidup berkelompok dan memiliki perilaku sosial kompleks.', 'Primata berekor pendek yang hidup berkelompok dan memiliki perilaku sosial kompleks. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan hujan, hutan sekunder, dan mosaik kebun dekat hutan.', 'Sumatra dan sejumlah wilayah Asia Tenggara.', NULL, NULL, NULL, NULL, NULL, 'Mampu mencari pakan di lantai hutan maupun pepohonan.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Jangan memberi makan karena dapat mengubah perilaku alami dan memicu konflik.', 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 4, 1, '2026-08-01 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(5, 'rangkong-badak-dummy', 'Rangkong Badak', 'Enggang', 'Buceros rhinoceros', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra dan Kalimantan', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Burung berukuran besar dengan paruh dan balung khas yang berperan penting dalam penyebaran biji.', 'Burung berukuran besar dengan paruh dan balung khas yang berperan penting dalam penyebaran biji. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan tropis dengan pohon besar untuk bersarang.', 'Sumatra, Kalimantan, Semenanjung Malaya, dan wilayah terkait.', NULL, NULL, NULL, NULL, NULL, 'Pasangan rangkong memiliki pola bersarang unik pada lubang pohon besar.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Pengamatan sebaiknya menggunakan teropong tanpa mendekati sarang.', 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 5, 1, '2026-07-31 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(6, 'elang-brontok-dummy', 'Elang Brontok', 'Elang', 'Nisaetus cirrhatus', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Indonesia bagian barat dan wilayah terkait', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Burung pemangsa yang dapat ditemukan di kawasan berhutan dan tepian habitat terbuka.', 'Burung pemangsa yang dapat ditemukan di kawasan berhutan dan tepian habitat terbuka. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan, perkebunan berpohon, dan area perbukitan.', 'Asia Selatan hingga Asia Tenggara termasuk Indonesia.', NULL, NULL, NULL, NULL, NULL, 'Memiliki variasi warna bulu yang cukup beragam antar individu.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Hindari mengganggu area sarang dan jangan melakukan pemancingan satwa.', 'https://images.unsplash.com/photo-1515865644861-5bedc4e3b996?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 6, 1, '2026-07-30 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(7, 'kancil-dummy', 'Kancil', 'Pelanduk', 'Tragulus kanchil', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra dan wilayah Sunda', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Mamalia kecil penghuni lantai hutan yang cenderung pemalu dan aktif pada waktu tertentu.', 'Mamalia kecil penghuni lantai hutan yang cenderung pemalu dan aktif pada waktu tertentu. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan dataran rendah, semak rapat, dan area dekat aliran air.', 'Wilayah Sunda dan sebagian Asia Tenggara.', NULL, NULL, NULL, NULL, NULL, 'Ukuran tubuh kecil dan mampu bergerak cepat di vegetasi rapat.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Gunakan jalur pengamatan dan hindari mengejar satwa.', 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 7, 1, '2026-07-29 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(8, 'biawak-air-dummy', 'Biawak Air', 'Biawak', 'Varanus salvator', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Asia Tenggara termasuk Sumatra', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Reptil besar yang sering hidup dekat air dan berperan sebagai predator serta pemakan bangkai.', 'Reptil besar yang sering hidup dekat air dan berperan sebagai predator serta pemakan bangkai. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Sungai, rawa, mangrove, pesisir, dan area dekat badan air.', 'Asia Selatan dan Asia Tenggara.', NULL, NULL, NULL, NULL, NULL, 'Perenang yang baik dan mampu beradaptasi pada beragam lingkungan.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Jangan mendekati atau memberi makan; beri ruang satwa untuk bergerak.', 'https://images.unsplash.com/photo-1535338454770-8be927b5a00b?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 8, 1, '2026-07-28 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:05', '2026-08-08 07:11:05'),
	(9, 'kukang-sunda-dummy', 'Kukang Sunda', 'Kukang', 'Nycticebus coucang', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra dan kawasan Sunda', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Primata nokturnal yang bergerak perlahan dan bergantung pada tutupan vegetasi.', 'Primata nokturnal yang bergerak perlahan dan bergantung pada tutupan vegetasi. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan, semak berpohon, dan kebun campuran yang terhubung dengan habitat alami.', 'Sumatra dan wilayah Sunda tertentu.', NULL, NULL, NULL, NULL, NULL, 'Aktif malam dan memiliki adaptasi penglihatan untuk kondisi cahaya rendah.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Tidak boleh disentuh atau dipelihara; observasi harus dilakukan dengan etis.', 'https://images.unsplash.com/photo-1520638023360-6def43369781?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 9, 1, '2026-07-27 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:06', '2026-08-08 07:11:06'),
	(10, 'lutung-kelabu-dummy', 'Lutung Kelabu', 'Lutung', 'Trachypithecus cristatus', 'Animalia', NULL, NULL, NULL, NULL, NULL, 'Asli/Native', 'Sumatra dan wilayah Sunda', NULL, 'Perlu verifikasi status perlindungan resmi', NULL, 'Primata pemakan daun yang hidup berkelompok pada habitat berhutan dan mangrove.', 'Primata pemakan daun yang hidup berkelompok pada habitat berhutan dan mangrove. Data katalog ini disiapkan sebagai dummy untuk pengujian halaman. Identifikasi, status endemisitas, perlindungan, dan informasi konservasi wajib diverifikasi oleh sumber ilmiah/instansi berwenang sebelum publikasi produksi.', NULL, 'Hutan dataran rendah, mangrove, dan kawasan berpohon.', 'Sumatra, Kalimantan, Semenanjung Malaya, dan wilayah terkait.', NULL, NULL, NULL, NULL, NULL, 'Kelompok lutung memiliki struktur sosial dan banyak mengonsumsi daun muda.', 'Gunakan teropong atau kamera dengan jarak aman, hindari suara keras, dan jangan mengubah habitat.', 'Jaga jarak, jangan memberi makan, dan hindari menghalangi jalur pergerakan kelompok.', 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 'Data dummy pengembangan portal; bukan rujukan ilmiah.', 0, 10, 1, '2026-07-26 11:00:00', 1, NULL, NULL, '2026-08-08 07:11:06', '2026-08-08 07:11:06');

-- Dumping structure for table dinas_pariwisata.satwa_endemik_galeri
DROP TABLE IF EXISTS `satwa_endemik_galeri`;
CREATE TABLE IF NOT EXISTS `satwa_endemik_galeri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `satwa_endemik_id` bigint unsigned NOT NULL,
  `jenis_media` enum('Foto','Audio','Video','Ilustrasi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Foto',
  `file_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `kredit_pembuat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lisensi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teks_alternatif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_satwa_galeri_satwa_urutan` (`satwa_endemik_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_satwa_galeri_satwa` FOREIGN KEY (`satwa_endemik_id`) REFERENCES `satwa_endemik` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.satwa_endemik_galeri: ~0 rows (approximately)
DELETE FROM `satwa_endemik_galeri`;

-- Dumping structure for table dinas_pariwisata.satwa_endemik_lokasi
DROP TABLE IF EXISTS `satwa_endemik_lokasi`;
CREATE TABLE IF NOT EXISTS `satwa_endemik_lokasi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `satwa_endemik_id` bigint unsigned NOT NULL,
  `tempat_wisata_id` bigint unsigned DEFAULT NULL,
  `nama_lokasi` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan_id` int unsigned DEFAULT NULL,
  `kelurahan_id` int unsigned DEFAULT NULL,
  `deskripsi_lokasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `jenis_habitat` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jenis_lokasi` enum('Habitat Alami','Pusat Konservasi','Wisata Edukasi','Penangkaran','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Habitat Alami',
  `tingkat_akses` enum('Sangat Mudah','Mudah','Sedang','Sulit','Sangat Sulit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sedang',
  `pengamatan_diizinkan` tinyint(1) NOT NULL DEFAULT '1',
  `perlu_pemandu` tinyint(1) NOT NULL DEFAULT '0',
  `latitude_admin` decimal(10,7) DEFAULT NULL COMMENT 'Koordinat presisi; jangan ditampilkan publik untuk satwa sensitif',
  `longitude_admin` decimal(10,7) DEFAULT NULL COMMENT 'Koordinat presisi; jangan ditampilkan publik untuk satwa sensitif',
  `latitude_publik` decimal(10,7) DEFAULT NULL COMMENT 'Koordinat yang sudah digeneralisasi/disamarkan',
  `longitude_publik` decimal(10,7) DEFAULT NULL COMMENT 'Koordinat yang sudah digeneralisasi/disamarkan',
  `tingkat_sensitivitas` enum('Publik','Disamarkan','Rahasia') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Disamarkan',
  `waktu_pengamatan_terbaik` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `catatan_pengamatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_satwa_lokasi_satwa` (`satwa_endemik_id`,`aktif`),
  KEY `idx_satwa_lokasi_wisata` (`tempat_wisata_id`),
  KEY `idx_satwa_lokasi_wilayah` (`kecamatan_id`,`kelurahan_id`),
  KEY `fk_satwa_lokasi_kelurahan` (`kelurahan_id`),
  CONSTRAINT `fk_satwa_lokasi_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `master_kecamatan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_satwa_lokasi_kelurahan` FOREIGN KEY (`kelurahan_id`) REFERENCES `master_kelurahan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_satwa_lokasi_satwa` FOREIGN KEY (`satwa_endemik_id`) REFERENCES `satwa_endemik` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_satwa_lokasi_wisata` FOREIGN KEY (`tempat_wisata_id`) REFERENCES `tempat_wisata` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.satwa_endemik_lokasi: ~10 rows (approximately)
DELETE FROM `satwa_endemik_lokasi`;
INSERT INTO `satwa_endemik_lokasi` (`id`, `satwa_endemik_id`, `tempat_wisata_id`, `nama_lokasi`, `kecamatan_id`, `kelurahan_id`, `deskripsi_lokasi`, `jenis_habitat`, `jenis_lokasi`, `tingkat_akses`, `pengamatan_diizinkan`, `perlu_pemandu`, `latitude_admin`, `longitude_admin`, `latitude_publik`, `longitude_publik`, `tingkat_sensitivitas`, `waktu_pengamatan_terbaik`, `catatan_pengamatan`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 1, NULL, 'Lokasi Dummy SPK - Mentilin Bangka', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.7987300, 106.1098400, -1.7987000, 106.1098000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(2, 2, NULL, 'Lokasi Dummy SPK - Trenggiling Sunda', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -2.0914200, 105.8953700, -2.0914000, 105.8954000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(3, 3, NULL, 'Lokasi Dummy SPK - Rusa Sambar', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.7521800, 106.0286100, -1.7522000, 106.0286000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(4, 4, NULL, 'Lokasi Dummy SPK - Beruk', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.9217500, 106.0812400, -1.9218000, 106.0812000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(5, 5, NULL, 'Lokasi Dummy SPK - Rangkong Badak', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.6833100, 105.9418200, -1.6833000, 105.9418000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(6, 6, NULL, 'Lokasi Dummy SPK - Elang Brontok', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.8214500, 106.0631900, -1.8215000, 106.0632000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(7, 7, NULL, 'Lokasi Dummy SPK - Kancil', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -2.0412600, 105.9327700, -2.0413000, 105.9328000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(8, 8, NULL, 'Lokasi Dummy SPK - Biawak Air', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.9335800, 106.1379200, -1.9336000, 106.1379000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(9, 9, NULL, 'Lokasi Dummy SPK - Kukang Sunda', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.7068400, 105.9913100, -1.7068000, 105.9913000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39'),
	(10, 10, NULL, 'Lokasi Dummy SPK - Lutung Kelabu', NULL, NULL, 'Lokasi ilustratif untuk pengujian pembobotan jarak/SPK; bukan titik observasi resmi.', 'Habitat ilustratif', 'Habitat Alami', 'Sedang', 1, 1, -1.7692200, 106.0415500, -1.7692000, 106.0416000, 'Disamarkan', 'Pagi atau sore hari', 'Koordinat dummy. Jangan digunakan untuk navigasi lapangan atau publikasi konservasi.', 1, '2026-08-08 07:47:39', '2026-08-08 07:47:39');

-- Dumping structure for table dinas_pariwisata.satwa_endemik_referensi
DROP TABLE IF EXISTS `satwa_endemik_referensi`;
CREATE TABLE IF NOT EXISTS `satwa_endemik_referensi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `satwa_endemik_id` bigint unsigned NOT NULL,
  `jenis_sumber` enum('Jurnal','Buku','Peraturan','Website Resmi','Laporan','Observasi','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Website Resmi',
  `judul` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `penulis_lembaga` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tahun` year DEFAULT NULL,
  `url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_akses` date DEFAULT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_satwa_referensi_satwa` (`satwa_endemik_id`,`aktif`),
  CONSTRAINT `fk_satwa_referensi_satwa` FOREIGN KEY (`satwa_endemik_id`) REFERENCES `satwa_endemik` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.satwa_endemik_referensi: ~0 rows (approximately)
DELETE FROM `satwa_endemik_referensi`;

-- Dumping structure for table dinas_pariwisata.spk_bobot
DROP TABLE IF EXISTS `spk_bobot`;
CREATE TABLE IF NOT EXISTS `spk_bobot` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kriteria_id` int unsigned NOT NULL,
  `bobot` decimal(8,6) NOT NULL COMMENT 'Nilai 0 sampai 1; total bobot aktif per jenis objek harus 1',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_spk_bobot_kriteria` (`kriteria_id`),
  KEY `idx_spk_bobot_aktif` (`aktif`),
  KEY `fk_spk_bobot_created_by` (`created_by`),
  KEY `fk_spk_bobot_updated_by` (`updated_by`),
  CONSTRAINT `fk_spk_bobot_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_spk_bobot_kriteria` FOREIGN KEY (`kriteria_id`) REFERENCES `spk_kriteria` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_spk_bobot_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_spk_bobot_nilai` CHECK (((`bobot` >= 0) and (`bobot` <= 1)))
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.spk_bobot: ~23 rows (approximately)
DELETE FROM `spk_bobot`;
INSERT INTO `spk_bobot` (`id`, `kriteria_id`, `bobot`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 1, 0.300000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(2, 2, 0.300000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(3, 3, 0.200000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(4, 4, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(5, 5, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(6, 6, 0.250000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(7, 7, 0.250000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(8, 8, 0.200000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(9, 9, 0.150000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(10, 10, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(11, 11, 0.050000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(12, 12, 0.250000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(13, 13, 0.200000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(14, 14, 0.200000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(15, 15, 0.150000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(16, 16, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(17, 17, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(18, 18, 0.250000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(19, 19, 0.200000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(20, 20, 0.200000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(21, 21, 0.150000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(22, 22, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(23, 23, 0.100000, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17');

-- Dumping structure for table dinas_pariwisata.spk_kriteria
DROP TABLE IF EXISTS `spk_kriteria`;
CREATE TABLE IF NOT EXISTS `spk_kriteria` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `jenis_objek` enum('hotel','kuliner','tempat_wisata','satwa_endemik') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_kriteria` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipe_kriteria` enum('benefit','cost') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe_nilai` enum('angka','boolean','kategori','jarak','fasilitas') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sumber_data` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama kolom pada view SPK atau nilai yang dihitung oleh backend',
  `cara_hitung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `satuan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wajib` tinyint(1) NOT NULL DEFAULT '0',
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_spk_kriteria_objek_kode` (`jenis_objek`,`kode`),
  KEY `idx_spk_kriteria_objek_aktif` (`jenis_objek`,`aktif`,`urutan`),
  KEY `fk_spk_kriteria_created_by` (`created_by`),
  KEY `fk_spk_kriteria_updated_by` (`updated_by`),
  CONSTRAINT `fk_spk_kriteria_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_spk_kriteria_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.spk_kriteria: ~23 rows (approximately)
DELETE FROM `spk_kriteria`;
INSERT INTO `spk_kriteria` (`id`, `jenis_objek`, `kode`, `nama_kriteria`, `deskripsi`, `tipe_kriteria`, `tipe_nilai`, `sumber_data`, `cara_hitung`, `satuan`, `wajib`, `urutan`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'hotel', 'HARGA', 'Harga kamar', 'Harga referensi kamar hotel.', 'cost', 'angka', 'vw_spk_hotel.harga_referensi', 'Nilai lebih rendah lebih baik.', 'Rupiah', 1, 1, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(2, 'hotel', 'JARAK', 'Jarak dari lokasi pengunjung', 'Jarak Haversine dari koordinat sementara pengunjung.', 'cost', 'jarak', 'latitude,longitude', 'Dihitung backend saat permintaan rekomendasi.', 'Kilometer', 1, 2, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(3, 'hotel', 'FASILITAS', 'Kelengkapan fasilitas', 'Jumlah fasilitas aktif yang dimiliki hotel.', 'benefit', 'fasilitas', 'vw_spk_hotel.jumlah_fasilitas', 'Nilai lebih tinggi lebih baik.', 'Fasilitas', 0, 3, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(4, 'hotel', 'KLASIFIKASI', 'Klasifikasi hotel', 'Klasifikasi bintang hotel 0 sampai 5.', 'benefit', 'angka', 'vw_spk_hotel.klasifikasi_bintang', 'Nilai lebih tinggi lebih baik.', 'Bintang', 0, 4, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(5, 'hotel', 'AKSESIBILITAS', 'Aksesibilitas', 'Skor fasilitas pendukung akses dan mobilitas.', 'benefit', 'angka', 'vw_spk_hotel.skor_aksesibilitas', 'Dihitung dari fasilitas difabel, kursi roda, lift, dan parkir.', 'Skor', 0, 5, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(6, 'kuliner', 'HARGA', 'Harga menu', 'Harga referensi produk/menu kuliner.', 'cost', 'angka', 'vw_spk_kuliner.harga_referensi', 'Nilai lebih rendah lebih baik.', 'Rupiah', 1, 1, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(7, 'kuliner', 'JARAK', 'Jarak dari lokasi pengunjung', 'Jarak Haversine dari koordinat sementara pengunjung.', 'cost', 'jarak', 'latitude,longitude', 'Dihitung backend saat permintaan rekomendasi.', 'Kilometer', 1, 2, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(8, 'kuliner', 'KESESUAIAN_KATEGORI', 'Kesesuaian kategori kuliner', 'Kecocokan kategori kuliner dengan permintaan pengunjung.', 'benefit', 'kategori', 'kategori_kuliner_id', 'Bernilai tinggi jika kategori sesuai hasil formulir atau interpretasi AI.', 'Skor', 0, 3, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(9, 'kuliner', 'STATUS_HALAL', 'Status halal', 'Status sertifikasi atau informasi halal usaha kuliner.', 'benefit', 'kategori', 'vw_spk_kuliner.skor_halal', 'Menggunakan pemetaan subkriteria status halal.', 'Skor', 0, 4, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(10, 'kuliner', 'FASILITAS', 'Kelengkapan fasilitas', 'Jumlah fasilitas aktif yang dimiliki usaha kuliner.', 'benefit', 'fasilitas', 'vw_spk_kuliner.jumlah_fasilitas', 'Nilai lebih tinggi lebih baik.', 'Fasilitas', 0, 5, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(11, 'kuliner', 'LAYANAN', 'Kelengkapan layanan', 'Jumlah jenis layanan: makan di tempat, bungkus, antar, dan reservasi.', 'benefit', 'angka', 'vw_spk_kuliner.jumlah_layanan', 'Nilai lebih tinggi lebih baik.', 'Layanan', 0, 6, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(12, 'tempat_wisata', 'JARAK', 'Jarak dari lokasi pengunjung', 'Jarak Haversine dari koordinat sementara pengunjung.', 'cost', 'jarak', 'latitude,longitude', 'Dihitung backend saat permintaan rekomendasi.', 'Kilometer', 1, 1, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(13, 'tempat_wisata', 'HARGA_TIKET', 'Harga tiket', 'Harga tiket domestik sebagai nilai referensi.', 'cost', 'angka', 'vw_spk_tempat_wisata.harga_tiket_referensi', 'Nilai lebih rendah lebih baik.', 'Rupiah', 1, 2, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(14, 'tempat_wisata', 'KESESUAIAN_KATEGORI', 'Kesesuaian jenis wisata', 'Kecocokan kategori wisata dengan minat pengunjung.', 'benefit', 'kategori', 'kategori_wisata_id', 'Bernilai tinggi jika kategori sesuai hasil formulir atau interpretasi AI.', 'Skor', 0, 3, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(15, 'tempat_wisata', 'FASILITAS', 'Kelengkapan fasilitas', 'Jumlah fasilitas aktif yang tersedia di destinasi.', 'benefit', 'fasilitas', 'vw_spk_tempat_wisata.jumlah_fasilitas', 'Nilai lebih tinggi lebih baik.', 'Fasilitas', 0, 4, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(16, 'tempat_wisata', 'AKSESIBILITAS', 'Kemudahan akses', 'Tingkat kemudahan akses menuju dan di dalam destinasi.', 'benefit', 'kategori', 'vw_spk_tempat_wisata.skor_aksesibilitas', 'Menggunakan pemetaan subkriteria tingkat akses.', 'Skor', 0, 5, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(17, 'tempat_wisata', 'KESESUAIAN_PENGUNJUNG', 'Kesesuaian pengunjung', 'Kesesuaian untuk anak, keluarga, dan lansia.', 'benefit', 'angka', 'vw_spk_tempat_wisata.skor_kesesuaian_pengunjung', 'Jumlah atribut kesesuaian yang bernilai benar.', 'Skor', 0, 6, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(18, 'satwa_endemik', 'KESESUAIAN_JENIS', 'Kesesuaian jenis satwa', 'Kecocokan kelompok satwa dengan topik yang dicari.', 'benefit', 'kategori', 'vw_spk_satwa_endemik.kelompok_satwa', 'Ditentukan dari pilihan pengunjung atau interpretasi AI.', 'Skor', 0, 1, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(19, 'satwa_endemik', 'KESESUAIAN_HABITAT', 'Kesesuaian habitat', 'Kecocokan habitat satwa dengan tema edukasi yang dicari.', 'benefit', 'kategori', 'vw_spk_satwa_endemik.habitat', 'Ditentukan melalui pencocokan kategori/teks oleh backend atau AI.', 'Skor', 0, 2, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(20, 'satwa_endemik', 'STATUS_KONSERVASI', 'Prioritas konservasi', 'Prioritas informasi berdasarkan status konservasi resmi.', 'benefit', 'angka', 'vw_spk_satwa_endemik.skor_prioritas_konservasi', 'Nilai mengikuti urutan prioritas pada master status konservasi.', 'Skor', 0, 3, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(21, 'satwa_endemik', 'KEMUDAHAN_PENGAMATAN', 'Kemudahan pengamatan edukatif', 'Kemudahan akses lokasi yang boleh diketahui dan dikunjungi.', 'benefit', 'angka', 'vw_spk_satwa_endemik.skor_kemudahan_pengamatan', 'Tidak memakai koordinat rahasia atau lokasi yang melarang pengamatan.', 'Skor', 0, 4, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(22, 'satwa_endemik', 'LOKASI_EDUKASI', 'Ketersediaan lokasi edukasi', 'Jumlah pusat konservasi, wisata edukasi, atau penangkaran terkait.', 'benefit', 'angka', 'vw_spk_satwa_endemik.jumlah_lokasi_edukasi', 'Nilai lebih tinggi menunjukkan lebih banyak pilihan edukasi.', 'Lokasi', 0, 5, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(23, 'satwa_endemik', 'LOKASI_PENGAMATAN', 'Ketersediaan lokasi pengamatan', 'Jumlah lokasi nonrahasia yang mengizinkan pengamatan.', 'benefit', 'angka', 'vw_spk_satwa_endemik.jumlah_lokasi_pengamatan', 'Hanya menghitung lokasi aman untuk ditampilkan.', 'Lokasi', 0, 6, 1, NULL, NULL, '2026-08-06 09:15:17', '2026-08-06 09:15:17');

-- Dumping structure for table dinas_pariwisata.spk_subkriteria
DROP TABLE IF EXISTS `spk_subkriteria`;
CREATE TABLE IF NOT EXISTS `spk_subkriteria` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kriteria_id` int unsigned NOT NULL,
  `kode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_subkriteria` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nilai` decimal(10,4) NOT NULL,
  `keterangan` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_spk_subkriteria_kriteria_kode` (`kriteria_id`,`kode`),
  KEY `idx_spk_subkriteria_aktif` (`kriteria_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_spk_subkriteria_kriteria` FOREIGN KEY (`kriteria_id`) REFERENCES `spk_kriteria` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.spk_subkriteria: ~15 rows (approximately)
DELETE FROM `spk_subkriteria`;
INSERT INTO `spk_subkriteria` (`id`, `kriteria_id`, `kode`, `nama_subkriteria`, `nilai`, `keterangan`, `urutan`, `aktif`, `created_at`, `updated_at`) VALUES
	(1, 9, 'HALAL_BERSERTIFIKAT', 'Halal Bersertifikat', 5.0000, 'Memiliki sertifikat halal.', 1, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(2, 9, 'KLAIM_HALAL', 'Klaim Halal', 4.0000, 'Pernyataan halal dari pelaku usaha.', 2, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(3, 9, 'PROSES_SERTIFIKASI', 'Proses Sertifikasi', 3.0000, 'Sedang dalam proses sertifikasi halal.', 3, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(4, 9, 'BELUM_DIKETAHUI', 'Belum Diketahui', 1.0000, 'Status halal belum tersedia.', 4, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(5, 9, 'TIDAK_HALAL', 'Tidak Halal', 0.0000, 'Produk atau layanan tidak halal.', 5, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(8, 16, 'SANGAT_MUDAH', 'Sangat Mudah', 5.0000, 'Akses sangat mudah untuk pengunjung umum.', 1, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(9, 16, 'MUDAH', 'Mudah', 4.0000, 'Akses mudah dengan sedikit hambatan.', 2, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(10, 16, 'SEDANG', 'Sedang', 3.0000, 'Akses memerlukan kesiapan normal.', 3, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(11, 16, 'SULIT', 'Sulit', 2.0000, 'Akses memerlukan usaha atau kendaraan khusus.', 4, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(12, 16, 'SANGAT_SULIT', 'Sangat Sulit', 1.0000, 'Akses menantang dan memerlukan persiapan khusus.', 5, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(15, 21, 'SANGAT_MUDAH', 'Sangat Mudah', 5.0000, 'Lokasi edukasi/pengamatan sangat mudah diakses.', 1, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(16, 21, 'MUDAH', 'Mudah', 4.0000, 'Lokasi mudah diakses.', 2, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(17, 21, 'SEDANG', 'Sedang', 3.0000, 'Akses membutuhkan persiapan normal.', 3, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(18, 21, 'SULIT', 'Sulit', 2.0000, 'Akses membutuhkan persiapan khusus.', 4, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17'),
	(19, 21, 'SANGAT_SULIT', 'Sangat Sulit', 1.0000, 'Akses sangat terbatas atau menantang.', 5, 1, '2026-08-06 09:15:17', '2026-08-06 09:15:17');

-- Dumping structure for table dinas_pariwisata.staff_chat_presence
DROP TABLE IF EXISTS `staff_chat_presence`;
CREATE TABLE IF NOT EXISTS `staff_chat_presence` (
  `user_id` bigint unsigned NOT NULL,
  `last_seen_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_staff_chat_presence_last_seen` (`last_seen_at`),
  CONSTRAINT `fk_staff_chat_presence_user` FOREIGN KEY (`user_id`) REFERENCES `pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dinas_pariwisata.staff_chat_presence: ~2 rows (approximately)
DELETE FROM `staff_chat_presence`;
INSERT INTO `staff_chat_presence` (`user_id`, `last_seen_at`, `created_at`, `updated_at`) VALUES
	(1, '2026-08-26 06:34:55', '2026-08-26 06:09:07', '2026-08-26 06:34:55'),
	(2, '2026-08-26 13:32:19', '2026-08-25 07:59:20', '2026-08-26 13:32:19');

-- Dumping structure for table dinas_pariwisata.tempat_wisata
DROP TABLE IF EXISTS `tempat_wisata`;
CREATE TABLE IF NOT EXISTS `tempat_wisata` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_tempat` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kategori_wisata_id` int unsigned NOT NULL,
  `nama_pengelola` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jenis_pengelola` enum('Pemerintah','BUMN/BUMD','Swasta','Komunitas','Masyarakat','Perorangan','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_singkat` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sejarah` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `daya_tarik_utama` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `alamat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan_id` int unsigned DEFAULT NULL,
  `kelurahan_id` int unsigned DEFAULT NULL,
  `kode_pos` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `telepon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiktok` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jam_operasional` json DEFAULT NULL COMMENT 'Contoh: {"senin":{"buka":"08:00","tutup":"17:00"}}',
  `harga_tiket_domestik_dewasa` decimal(14,2) DEFAULT NULL,
  `harga_tiket_domestik_anak` decimal(14,2) DEFAULT NULL,
  `harga_tiket_mancanegara` decimal(14,2) DEFAULT NULL,
  `biaya_parkir` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waktu_kunjungan_terbaik` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durasi_kunjungan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durasi_kunjungan_menit` smallint unsigned DEFAULT NULL COMMENT 'Nilai terstruktur untuk penyaringan dan SPK',
  `cocok_anak` tinyint(1) NOT NULL DEFAULT '0',
  `cocok_keluarga` tinyint(1) NOT NULL DEFAULT '1',
  `ramah_lansia` tinyint(1) NOT NULL DEFAULT '0',
  `tingkat_kesulitan_akses` enum('Sangat Mudah','Mudah','Sedang','Sulit','Sangat Sulit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sedang',
  `akses_transportasi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `aksesibilitas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `peraturan_pengunjung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `informasi_keselamatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `kontak_darurat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_utama` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `virtual_tour_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unggulan` tinyint(1) NOT NULL DEFAULT '0',
  `urutan_tampil` int unsigned NOT NULL DEFAULT '0',
  `dipublikasikan` tinyint(1) NOT NULL DEFAULT '0',
  `tanggal_publikasi` datetime DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tempat_wisata_slug` (`slug`),
  KEY `idx_tempat_wisata_kategori` (`kategori_wisata_id`),
  KEY `idx_tempat_wisata_lokasi` (`kecamatan_id`,`kelurahan_id`),
  KEY `idx_tempat_wisata_publik` (`dipublikasikan`,`aktif`,`unggulan`),
  KEY `idx_tempat_wisata_nama` (`nama_tempat`),
  KEY `idx_tempat_wisata_koordinat` (`latitude`,`longitude`),
  KEY `fk_tempat_wisata_kelurahan` (`kelurahan_id`),
  KEY `fk_tempat_wisata_created_by` (`created_by`),
  KEY `fk_tempat_wisata_updated_by` (`updated_by`),
  CONSTRAINT `fk_tempat_wisata_created_by` FOREIGN KEY (`created_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tempat_wisata_kategori` FOREIGN KEY (`kategori_wisata_id`) REFERENCES `master_kategori_wisata` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tempat_wisata_kecamatan` FOREIGN KEY (`kecamatan_id`) REFERENCES `master_kecamatan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tempat_wisata_kelurahan` FOREIGN KEY (`kelurahan_id`) REFERENCES `master_kelurahan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tempat_wisata_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `pengguna` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.tempat_wisata: ~10 rows (approximately)
DELETE FROM `tempat_wisata`;
INSERT INTO `tempat_wisata` (`id`, `slug`, `nama_tempat`, `kategori_wisata_id`, `nama_pengelola`, `jenis_pengelola`, `deskripsi_singkat`, `deskripsi`, `sejarah`, `daya_tarik_utama`, `alamat`, `kecamatan_id`, `kelurahan_id`, `kode_pos`, `latitude`, `longitude`, `telepon`, `whatsapp`, `email`, `website`, `instagram`, `facebook`, `tiktok`, `jam_operasional`, `harga_tiket_domestik_dewasa`, `harga_tiket_domestik_anak`, `harga_tiket_mancanegara`, `biaya_parkir`, `waktu_kunjungan_terbaik`, `durasi_kunjungan`, `durasi_kunjungan_menit`, `cocok_anak`, `cocok_keluarga`, `ramah_lansia`, `tingkat_kesulitan_akses`, `akses_transportasi`, `aksesibilitas`, `peraturan_pengunjung`, `informasi_keselamatan`, `kontak_darurat`, `foto_utama`, `video_url`, `virtual_tour_url`, `unggulan`, `urutan_tampil`, `dipublikasikan`, `tanggal_publikasi`, `aktif`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
	(1, 'pantai-matras-dummy', 'Pantai Matras', 2, 'Pengelola Destinasi', 'Masyarakat', 'Pantai berpasir putih dengan bentang pesisir yang cocok untuk rekreasi keluarga.', 'Pantai berpasir putih dengan bentang pesisir yang cocok untuk rekreasi keluarga. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Hamparan pasir, laut terbuka, suasana matahari terbit, dan area rekreasi pesisir.', 'Pantai Matras, Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8019000, 106.1167000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 10000.00, NULL, 25000.00, NULL, 'Pagi hari atau menjelang sore', '1–3 jam', NULL, 0, 1, 0, 'Mudah', 'Akses kendaraan roda dua dan roda empat melalui jalur utama Sungailiat.', NULL, NULL, 'Ikuti rambu keselamatan, perhatikan kondisi ombak, dan jaga kebersihan area pantai.', NULL, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 1, 1, 1, '2026-08-01 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(2, 'pantai-tanjung-pesona-dummy', 'Pantai Tanjung Pesona', 2, 'Pengelola Destinasi', 'Swasta', 'Destinasi pesisir dengan panorama batu granit dan ruang rekreasi tepi laut.', 'Destinasi pesisir dengan panorama batu granit dan ruang rekreasi tepi laut. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Panorama batu granit, garis pantai, area santai, dan aktivitas keluarga.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8849000, 106.1562000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 15000.00, NULL, 30000.00, NULL, 'Sore hari', '2–4 jam', NULL, 0, 1, 0, 'Mudah', 'Dapat dicapai menggunakan kendaraan pribadi dari pusat Sungailiat.', NULL, NULL, 'Gunakan alas kaki yang sesuai saat berada di area batu dan hindari zona licin.', NULL, 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 1, 2, 1, '2026-07-31 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(3, 'pantai-rambak-dummy', 'Pantai Rambak', 2, 'Kelompok Masyarakat', 'Masyarakat', 'Pantai dengan karakter batu granit dan suasana yang relatif tenang untuk menikmati pesisir Bangka.', 'Pantai dengan karakter batu granit dan suasana yang relatif tenang untuk menikmati pesisir Bangka. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Batu granit, panorama laut, fotografi, dan suasana pesisir.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8995000, 106.1713000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 5000.00, NULL, 15000.00, NULL, 'Pagi dan sore hari', '1–3 jam', NULL, 0, 1, 0, 'Mudah', 'Akses melalui jalan lokal menuju kawasan pantai.', NULL, NULL, 'Perhatikan pasang surut dan tidak memanjat batu saat permukaan basah.', NULL, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 1, 3, 1, '2026-07-30 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(4, 'puri-tri-agung-dummy', 'Puri Tri Agung', 3, 'Pengelola Kawasan', 'Komunitas', 'Destinasi budaya dan religi di kawasan perbukitan dengan panorama laut.', 'Destinasi budaya dan religi di kawasan perbukitan dengan panorama laut. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Arsitektur, suasana kontemplatif, panorama dari ketinggian, dan nilai budaya.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8796000, 106.1157000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 0.00, NULL, 0.00, NULL, 'Pagi hingga sore', '1–2 jam', NULL, 0, 1, 0, 'Mudah', 'Jalan beraspal dapat dilalui kendaraan pribadi dan rombongan.', NULL, NULL, 'Hormati tata tertib, berpakaian sopan, dan jaga ketenangan area ibadah.', NULL, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 4, 1, '2026-07-29 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(5, 'bukit-rebo-dummy', 'Bukit Rebo', 1, 'Kelompok Masyarakat', 'Masyarakat', 'Ruang alam perbukitan untuk menikmati lanskap hijau dan panorama sekitar.', 'Ruang alam perbukitan untuk menikmati lanskap hijau dan panorama sekitar. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Lanskap perbukitan, udara terbuka, trekking ringan, dan fotografi.', 'Rebo, Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8462000, 106.1079000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 5000.00, NULL, 10000.00, NULL, 'Pagi hari', '2–3 jam', NULL, 0, 1, 0, 'Sedang', 'Kendaraan dapat mencapai area awal, dilanjutkan berjalan kaki pada beberapa bagian.', NULL, NULL, 'Gunakan alas kaki trekking dan hindari kunjungan saat cuaca buruk.', NULL, 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 5, 1, '2026-07-28 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(6, 'danau-pading-dummy', 'Danau Pading', 1, 'Kelompok Wisata', 'Masyarakat', 'Kawasan danau dengan karakter lanskap terbuka yang menarik untuk fotografi dan wisata singkat.', 'Kawasan danau dengan karakter lanskap terbuka yang menarik untuk fotografi dan wisata singkat. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Panorama air, lanskap terbuka, titik foto, dan suasana tenang.', 'Kabupaten Bangka', NULL, NULL, NULL, -2.1384000, 105.9887000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 5000.00, NULL, 10000.00, NULL, 'Pagi atau sore', '1–2 jam', NULL, 0, 1, 0, 'Mudah', 'Dapat diakses kendaraan pribadi melalui jalan lokal.', NULL, NULL, 'Jangan berenang di area yang tidak diizinkan dan ikuti petunjuk pengelola.', NULL, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 6, 1, '2026-07-27 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(7, 'pantai-penyusuk-dummy', 'Pantai Penyusuk', 2, 'Kelompok Wisata', 'Masyarakat', 'Pantai di utara Bangka dengan pemandangan laut dan susunan batu granit yang khas.', 'Pantai di utara Bangka dengan pemandangan laut dan susunan batu granit yang khas. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Pantai, batu granit, pemandangan pulau kecil, dan rekreasi bahari.', 'Belinyu, Kabupaten Bangka', NULL, NULL, NULL, -1.5378000, 105.8496000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 10000.00, NULL, 25000.00, NULL, 'Pagi hingga sore', '2–4 jam', NULL, 0, 1, 0, 'Mudah', 'Akses kendaraan pribadi menuju kawasan Belinyu dan dilanjutkan ke pesisir.', NULL, NULL, 'Perhatikan kondisi gelombang dan gunakan pelampung untuk aktivitas bahari.', NULL, 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 7, 1, '2026-07-26 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(8, 'hutan-pelawan-dummy', 'Hutan Pelawan Bangka', 1, 'Kelompok Konservasi', 'Komunitas', 'Kawasan hijau untuk edukasi lingkungan, observasi flora, dan wisata berbasis alam.', 'Kawasan hijau untuk edukasi lingkungan, observasi flora, dan wisata berbasis alam. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Vegetasi lokal, edukasi lingkungan, jalur interpretasi, dan ketenangan alam.', 'Kabupaten Bangka', NULL, NULL, NULL, -2.0936000, 105.9025000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 10000.00, NULL, 15000.00, NULL, 'Pagi hari', '2–3 jam', NULL, 0, 1, 0, 'Sedang', 'Disarankan menggunakan kendaraan pribadi dan mengikuti jalur kunjungan yang ditentukan.', NULL, NULL, 'Tidak memetik tumbuhan, tidak membuang sampah, dan tetap berada di jalur.', NULL, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 8, 1, '2026-07-25 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(9, 'kampung-kreatif-bangka-dummy', 'Kampung Kreatif Bangka', 27, 'Komunitas Kreatif', 'Komunitas', 'Ruang kunjungan berbasis kreativitas lokal, produk kerajinan, dan aktivitas keluarga.', 'Ruang kunjungan berbasis kreativitas lokal, produk kerajinan, dan aktivitas keluarga. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Produk kreatif, workshop singkat, interaksi komunitas, dan ruang keluarga.', 'Kabupaten Bangka', NULL, NULL, NULL, -1.8546000, 106.1105000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 5000.00, NULL, 20000.00, NULL, 'Siang hingga sore', '1–3 jam', NULL, 0, 1, 0, 'Sangat Mudah', 'Mudah dicapai kendaraan pribadi dan transportasi lokal.', NULL, NULL, 'Anak-anak perlu pendampingan saat mengikuti workshop dan aktivitas produksi.', NULL, 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 9, 1, '2026-07-24 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38'),
	(10, 'taman-pesisir-sungailiat-dummy', 'Taman Pesisir Sungailiat', 27, 'Pengelola Kawasan', 'Pemerintah', 'Ruang rekreasi terbuka untuk berjalan santai, menikmati pesisir, dan berkumpul bersama keluarga.', 'Ruang rekreasi terbuka untuk berjalan santai, menikmati pesisir, dan berkumpul bersama keluarga. Data ini merupakan dummy untuk pengujian portal APPEKRAF dan bukan informasi resmi. Silakan verifikasi harga, pengelola, akses, dan ketentuan sebelum digunakan pada produksi.', NULL, 'Ruang terbuka, pemandangan pesisir, area duduk, dan aktivitas keluarga.', 'Sungailiat, Kabupaten Bangka', NULL, NULL, NULL, -1.8724000, 106.1421000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"senin": {"buka": "08:00", "tutup": "17:00"}, "minggu": {"buka": "07:00", "tutup": "18:00"}}', 0.00, NULL, 0.00, NULL, 'Sore hari', '1–2 jam', NULL, 0, 1, 0, 'Sangat Mudah', 'Terhubung dengan jalan kota dan mudah dicapai kendaraan.', NULL, NULL, 'Jaga kebersihan, awasi anak-anak, dan gunakan area sesuai peruntukan.', NULL, 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=82', NULL, NULL, 0, 10, 1, '2026-07-23 08:00:00', 1, NULL, NULL, '2026-08-08 07:04:09', '2026-08-08 07:47:38');

-- Dumping structure for table dinas_pariwisata.tempat_wisata_aktivitas
DROP TABLE IF EXISTS `tempat_wisata_aktivitas`;
CREATE TABLE IF NOT EXISTS `tempat_wisata_aktivitas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tempat_wisata_id` bigint unsigned NOT NULL,
  `nama_aktivitas` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `biaya_mulai` decimal(14,2) DEFAULT NULL,
  `biaya_sampai` decimal(14,2) DEFAULT NULL,
  `durasi` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batas_usia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `perlu_reservasi` tinyint(1) NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wisata_aktivitas_tempat` (`tempat_wisata_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_wisata_aktivitas_tempat` FOREIGN KEY (`tempat_wisata_id`) REFERENCES `tempat_wisata` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_wisata_aktivitas_biaya` CHECK (((`biaya_mulai` is null) or (`biaya_sampai` is null) or (`biaya_sampai` >= `biaya_mulai`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.tempat_wisata_aktivitas: ~0 rows (approximately)
DELETE FROM `tempat_wisata_aktivitas`;

-- Dumping structure for table dinas_pariwisata.tempat_wisata_fasilitas
DROP TABLE IF EXISTS `tempat_wisata_fasilitas`;
CREATE TABLE IF NOT EXISTS `tempat_wisata_fasilitas` (
  `tempat_wisata_id` bigint unsigned NOT NULL,
  `fasilitas_id` int unsigned NOT NULL,
  `keterangan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`tempat_wisata_id`,`fasilitas_id`),
  KEY `idx_tempat_wisata_fasilitas_fasilitas` (`fasilitas_id`),
  CONSTRAINT `fk_tempat_wisata_fasilitas_master` FOREIGN KEY (`fasilitas_id`) REFERENCES `master_fasilitas` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tempat_wisata_fasilitas_tempat` FOREIGN KEY (`tempat_wisata_id`) REFERENCES `tempat_wisata` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.tempat_wisata_fasilitas: ~0 rows (approximately)
DELETE FROM `tempat_wisata_fasilitas`;

-- Dumping structure for table dinas_pariwisata.tempat_wisata_galeri
DROP TABLE IF EXISTS `tempat_wisata_galeri`;
CREATE TABLE IF NOT EXISTS `tempat_wisata_galeri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tempat_wisata_id` bigint unsigned NOT NULL,
  `jenis_media` enum('Foto','Video','Virtual Tour') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Foto',
  `file_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `judul` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `keterangan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teks_alternatif` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int unsigned NOT NULL DEFAULT '0',
  `aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tempat_wisata_galeri_tempat_urutan` (`tempat_wisata_id`,`aktif`,`urutan`),
  CONSTRAINT `fk_tempat_wisata_galeri_tempat` FOREIGN KEY (`tempat_wisata_id`) REFERENCES `tempat_wisata` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table dinas_pariwisata.tempat_wisata_galeri: ~0 rows (approximately)
DELETE FROM `tempat_wisata_galeri`;

-- Dumping structure for view dinas_pariwisata.vw_acara_akan_datang
DROP VIEW IF EXISTS `vw_acara_akan_datang`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_acara_akan_datang` (
	`id` BIGINT(20) UNSIGNED NOT NULL,
	`slug` VARCHAR(250) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_acara` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`ringkasan` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`deskripsi` LONGTEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori_acara_id` INT(10) UNSIGNED NOT NULL,
	`kode_kategori` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`slug_kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`tanggal_mulai` DATETIME NOT NULL,
	`tanggal_selesai` DATETIME NOT NULL,
	`sepanjang_hari` TINYINT(1) NOT NULL,
	`zona_waktu` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`status_acara` ENUM('Dijadwalkan','Berlangsung','Selesai','Ditunda','Dibatalkan') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`status_waktu` VARCHAR(11) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`jenis_pelaksanaan` ENUM('Luring','Daring','Hibrida') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_lokasi` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`alamat` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`kecamatan_id` INT(10) UNSIGNED NULL,
	`nama_kecamatan` VARCHAR(100) NULL COLLATE 'utf8mb4_unicode_ci',
	`kelurahan_id` INT(10) UNSIGNED NULL,
	`nama_kelurahan` VARCHAR(100) NULL COLLATE 'utf8mb4_unicode_ci',
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`tautan_daring` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`penyelenggara` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`narahubung_nama` VARCHAR(150) NULL COLLATE 'utf8mb4_unicode_ci',
	`narahubung_telepon` VARCHAR(30) NULL COLLATE 'utf8mb4_unicode_ci',
	`narahubung_email` VARCHAR(150) NULL COLLATE 'utf8mb4_unicode_ci',
	`memerlukan_pendaftaran` TINYINT(1) NOT NULL,
	`tautan_pendaftaran` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`tanggal_buka_pendaftaran` DATETIME NULL,
	`tanggal_tutup_pendaftaran` DATETIME NULL,
	`pendaftaran_dibuka` INT(10) NOT NULL,
	`kuota` INT(10) UNSIGNED NULL,
	`gratis` TINYINT(1) NOT NULL,
	`harga_mulai` DECIMAL(14,2) NULL,
	`harga_sampai` DECIMAL(14,2) NULL,
	`syarat_ketentuan` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_utama` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_alt` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`video_url` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`kata_kunci` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`unggulan` TINYINT(1) NOT NULL,
	`urutan_tampil` INT(10) UNSIGNED NOT NULL,
	`tanggal_publikasi` DATETIME NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_acara_publik
DROP VIEW IF EXISTS `vw_acara_publik`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_acara_publik` (
	`id` BIGINT(20) UNSIGNED NOT NULL,
	`slug` VARCHAR(250) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_acara` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`ringkasan` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`deskripsi` LONGTEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori_acara_id` INT(10) UNSIGNED NOT NULL,
	`kode_kategori` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`slug_kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`tanggal_mulai` DATETIME NOT NULL,
	`tanggal_selesai` DATETIME NOT NULL,
	`sepanjang_hari` TINYINT(1) NOT NULL,
	`zona_waktu` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`status_acara` ENUM('Dijadwalkan','Berlangsung','Selesai','Ditunda','Dibatalkan') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`status_waktu` VARCHAR(11) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`jenis_pelaksanaan` ENUM('Luring','Daring','Hibrida') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_lokasi` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`alamat` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`kecamatan_id` INT(10) UNSIGNED NULL,
	`nama_kecamatan` VARCHAR(100) NULL COLLATE 'utf8mb4_unicode_ci',
	`kelurahan_id` INT(10) UNSIGNED NULL,
	`nama_kelurahan` VARCHAR(100) NULL COLLATE 'utf8mb4_unicode_ci',
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`tautan_daring` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`penyelenggara` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`narahubung_nama` VARCHAR(150) NULL COLLATE 'utf8mb4_unicode_ci',
	`narahubung_telepon` VARCHAR(30) NULL COLLATE 'utf8mb4_unicode_ci',
	`narahubung_email` VARCHAR(150) NULL COLLATE 'utf8mb4_unicode_ci',
	`memerlukan_pendaftaran` TINYINT(1) NOT NULL,
	`tautan_pendaftaran` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`tanggal_buka_pendaftaran` DATETIME NULL,
	`tanggal_tutup_pendaftaran` DATETIME NULL,
	`pendaftaran_dibuka` INT(10) NOT NULL,
	`kuota` INT(10) UNSIGNED NULL,
	`gratis` TINYINT(1) NOT NULL,
	`harga_mulai` DECIMAL(14,2) NULL,
	`harga_sampai` DECIMAL(14,2) NULL,
	`syarat_ketentuan` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_utama` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_alt` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`video_url` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`kata_kunci` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`unggulan` TINYINT(1) NOT NULL,
	`urutan_tampil` INT(10) UNSIGNED NOT NULL,
	`tanggal_publikasi` DATETIME NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_ai_katalog_pariwisata
DROP VIEW IF EXISTS `vw_ai_katalog_pariwisata`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_ai_katalog_pariwisata` (
	`jenis_objek` VARCHAR(13) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`id` BIGINT(20) UNSIGNED NOT NULL,
	`slug` VARCHAR(250) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`deskripsi_singkat` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`lokasi_ringkas` MEDIUMTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`foto_utama` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`konten_ai` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`metadata_json` JSON NULL,
	`updated_at` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_berita_publik
DROP VIEW IF EXISTS `vw_berita_publik`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_berita_publik` (
	`id` BIGINT(20) UNSIGNED NOT NULL,
	`slug` VARCHAR(250) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`judul` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`subjudul` VARCHAR(500) NULL COLLATE 'utf8mb4_unicode_ci',
	`ringkasan` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`isi` LONGTEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori_berita_id` INT(10) UNSIGNED NOT NULL,
	`kode_kategori` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`slug_kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`penulis_tampil` VARCHAR(150) NULL COLLATE 'utf8mb4_unicode_ci',
	`sumber_nama` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`sumber_url` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_utama` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_keterangan` VARCHAR(500) NULL COLLATE 'utf8mb4_unicode_ci',
	`foto_alt` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`kata_kunci` VARCHAR(1000) NULL COLLATE 'utf8mb4_unicode_ci',
	`headline` TINYINT(1) NOT NULL,
	`urutan_tampil` INT(10) UNSIGNED NOT NULL,
	`tanggal_publikasi` DATETIME NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_katalog_pariwisata_publik
DROP VIEW IF EXISTS `vw_katalog_pariwisata_publik`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_katalog_pariwisata_publik` (
	`jenis_konten` VARCHAR(13) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`id` BIGINT(20) UNSIGNED NOT NULL,
	`slug` VARCHAR(250) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori` VARCHAR(120) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`deskripsi_singkat` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`lokasi_ringkas` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`foto_utama` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`unggulan` TINYINT(3) NOT NULL,
	`tanggal_publikasi` DATETIME NULL,
	`updated_at` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_spk_hotel
DROP VIEW IF EXISTS `vw_spk_hotel`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_spk_hotel` (
	`id` BIGINT(20) UNSIGNED NULL,
	`slug` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_hotel` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`jenis_hotel_id` INT(10) UNSIGNED NULL,
	`jenis_hotel` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`klasifikasi_bintang` TINYINT(3) UNSIGNED NULL COMMENT '0 sampai 5; NULL jika belum/tidak diklasifikasikan',
	`harga_mulai` DECIMAL(14,2) NULL,
	`harga_sampai` DECIMAL(14,2) NULL,
	`harga_referensi` DECIMAL(19,6) NOT NULL,
	`jumlah_kamar` SMALLINT(5) UNSIGNED NULL,
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`kecamatan_id` INT(10) UNSIGNED NULL,
	`kelurahan_id` INT(10) UNSIGNED NULL,
	`jumlah_fasilitas` BIGINT(19) NULL,
	`memiliki_parkir` INT(10) NOT NULL,
	`memiliki_musala` INT(10) NOT NULL,
	`skor_aksesibilitas` INT(10) NOT NULL,
	`dipublikasikan` TINYINT(1) NULL,
	`aktif` TINYINT(1) NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_spk_kuliner
DROP VIEW IF EXISTS `vw_spk_kuliner`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_spk_kuliner` (
	`id` BIGINT(20) UNSIGNED NULL,
	`slug` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_usaha` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori_kuliner_id` INT(10) UNSIGNED NULL,
	`kategori_kuliner` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`harga_mulai` DECIMAL(14,2) NULL,
	`harga_sampai` DECIMAL(14,2) NULL,
	`harga_referensi` DECIMAL(19,6) NOT NULL,
	`status_halal` ENUM('Belum Diketahui','Halal Bersertifikat','Klaim Halal','Tidak Halal','Proses Sertifikasi') NULL COLLATE 'utf8mb4_unicode_ci',
	`skor_halal` INT(10) NOT NULL,
	`jumlah_layanan` INT(10) NOT NULL,
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`kecamatan_id` INT(10) UNSIGNED NULL,
	`kelurahan_id` INT(10) UNSIGNED NULL,
	`jumlah_fasilitas` BIGINT(19) NULL,
	`memiliki_parkir` INT(10) NOT NULL,
	`memiliki_musala` INT(10) NOT NULL,
	`dipublikasikan` TINYINT(1) NULL,
	`aktif` TINYINT(1) NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_spk_satwa_endemik
DROP VIEW IF EXISTS `vw_spk_satwa_endemik`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_spk_satwa_endemik` (
	`id` BIGINT(20) UNSIGNED NULL,
	`slug` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_umum` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_lokal` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_ilmiah` VARCHAR(255) NULL COLLATE 'utf8mb4_unicode_ci',
	`kelompok_satwa` VARCHAR(100) NULL COLLATE 'utf8mb4_unicode_ci',
	`status_endemisitas` ENUM('Endemik Lokal','Endemik Regional','Asli/Native','Migran','Introduksi') NULL COLLATE 'utf8mb4_unicode_ci',
	`wilayah_endemik` VARCHAR(500) NULL COLLATE 'utf8mb4_unicode_ci',
	`habitat` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`status_konservasi_id` INT(10) UNSIGNED NULL,
	`kode_status_konservasi` VARCHAR(5) NULL COLLATE 'utf8mb4_unicode_ci',
	`status_konservasi` VARCHAR(100) NULL COLLATE 'utf8mb4_unicode_ci',
	`skor_prioritas_konservasi` INT(10) NOT NULL,
	`latitude` DECIMAL(11,7) NULL,
	`longitude` DECIMAL(11,7) NULL,
	`jumlah_lokasi` BIGINT(19) NULL,
	`jumlah_lokasi_pengamatan` BIGINT(19) NULL,
	`jumlah_lokasi_edukasi` BIGINT(19) NULL,
	`skor_kemudahan_pengamatan` INT(10) NOT NULL,
	`dipublikasikan` TINYINT(1) NULL,
	`aktif` TINYINT(1) NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_spk_tempat_wisata
DROP VIEW IF EXISTS `vw_spk_tempat_wisata`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_spk_tempat_wisata` (
	`id` BIGINT(20) UNSIGNED NULL,
	`slug` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`nama_tempat` VARCHAR(200) NULL COLLATE 'utf8mb4_unicode_ci',
	`kategori_wisata_id` INT(10) UNSIGNED NULL,
	`kategori_wisata` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`harga_tiket_domestik_dewasa` DECIMAL(14,2) NULL,
	`harga_tiket_domestik_anak` DECIMAL(14,2) NULL,
	`harga_tiket_mancanegara` DECIMAL(14,2) NULL,
	`harga_tiket_referensi` DECIMAL(14,2) NOT NULL,
	`durasi_kunjungan_menit` SMALLINT(5) UNSIGNED NULL COMMENT 'Nilai terstruktur untuk penyaringan dan SPK',
	`cocok_anak` TINYINT(1) NULL,
	`cocok_keluarga` TINYINT(1) NULL,
	`ramah_lansia` TINYINT(1) NULL,
	`skor_kesesuaian_pengunjung` INT(10) NOT NULL,
	`tingkat_kesulitan_akses` ENUM('Sangat Mudah','Mudah','Sedang','Sulit','Sangat Sulit') NULL COLLATE 'utf8mb4_unicode_ci',
	`skor_aksesibilitas` INT(10) NOT NULL,
	`latitude` DECIMAL(10,7) NULL,
	`longitude` DECIMAL(10,7) NULL,
	`kecamatan_id` INT(10) UNSIGNED NULL,
	`kelurahan_id` INT(10) UNSIGNED NULL,
	`jumlah_fasilitas` BIGINT(19) NULL,
	`jumlah_aktivitas` BIGINT(19) NULL,
	`memiliki_parkir` INT(10) NOT NULL,
	`memiliki_musala` INT(10) NOT NULL,
	`dipublikasikan` TINYINT(1) NULL,
	`aktif` TINYINT(1) NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_spk_total_bobot
DROP VIEW IF EXISTS `vw_spk_total_bobot`;
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vw_spk_total_bobot` (
	`jenis_objek` ENUM('hotel','kuliner','tempat_wisata','satwa_endemik') NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`jumlah_kriteria_aktif` BIGINT(19) NOT NULL,
	`total_bobot` DECIMAL(30,6) NULL,
	`bobot_valid` INT(10) NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view dinas_pariwisata.vw_acara_akan_datang
DROP VIEW IF EXISTS `vw_acara_akan_datang`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_acara_akan_datang`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_acara_akan_datang` AS select `vw_acara_publik`.`id` AS `id`,`vw_acara_publik`.`slug` AS `slug`,`vw_acara_publik`.`nama_acara` AS `nama_acara`,`vw_acara_publik`.`ringkasan` AS `ringkasan`,`vw_acara_publik`.`deskripsi` AS `deskripsi`,`vw_acara_publik`.`kategori_acara_id` AS `kategori_acara_id`,`vw_acara_publik`.`kode_kategori` AS `kode_kategori`,`vw_acara_publik`.`slug_kategori` AS `slug_kategori`,`vw_acara_publik`.`nama_kategori` AS `nama_kategori`,`vw_acara_publik`.`tanggal_mulai` AS `tanggal_mulai`,`vw_acara_publik`.`tanggal_selesai` AS `tanggal_selesai`,`vw_acara_publik`.`sepanjang_hari` AS `sepanjang_hari`,`vw_acara_publik`.`zona_waktu` AS `zona_waktu`,`vw_acara_publik`.`status_acara` AS `status_acara`,`vw_acara_publik`.`status_waktu` AS `status_waktu`,`vw_acara_publik`.`jenis_pelaksanaan` AS `jenis_pelaksanaan`,`vw_acara_publik`.`nama_lokasi` AS `nama_lokasi`,`vw_acara_publik`.`alamat` AS `alamat`,`vw_acara_publik`.`kecamatan_id` AS `kecamatan_id`,`vw_acara_publik`.`nama_kecamatan` AS `nama_kecamatan`,`vw_acara_publik`.`kelurahan_id` AS `kelurahan_id`,`vw_acara_publik`.`nama_kelurahan` AS `nama_kelurahan`,`vw_acara_publik`.`latitude` AS `latitude`,`vw_acara_publik`.`longitude` AS `longitude`,`vw_acara_publik`.`tautan_daring` AS `tautan_daring`,`vw_acara_publik`.`penyelenggara` AS `penyelenggara`,`vw_acara_publik`.`narahubung_nama` AS `narahubung_nama`,`vw_acara_publik`.`narahubung_telepon` AS `narahubung_telepon`,`vw_acara_publik`.`narahubung_email` AS `narahubung_email`,`vw_acara_publik`.`memerlukan_pendaftaran` AS `memerlukan_pendaftaran`,`vw_acara_publik`.`tautan_pendaftaran` AS `tautan_pendaftaran`,`vw_acara_publik`.`tanggal_buka_pendaftaran` AS `tanggal_buka_pendaftaran`,`vw_acara_publik`.`tanggal_tutup_pendaftaran` AS `tanggal_tutup_pendaftaran`,`vw_acara_publik`.`pendaftaran_dibuka` AS `pendaftaran_dibuka`,`vw_acara_publik`.`kuota` AS `kuota`,`vw_acara_publik`.`gratis` AS `gratis`,`vw_acara_publik`.`harga_mulai` AS `harga_mulai`,`vw_acara_publik`.`harga_sampai` AS `harga_sampai`,`vw_acara_publik`.`syarat_ketentuan` AS `syarat_ketentuan`,`vw_acara_publik`.`foto_utama` AS `foto_utama`,`vw_acara_publik`.`foto_alt` AS `foto_alt`,`vw_acara_publik`.`video_url` AS `video_url`,`vw_acara_publik`.`kata_kunci` AS `kata_kunci`,`vw_acara_publik`.`unggulan` AS `unggulan`,`vw_acara_publik`.`urutan_tampil` AS `urutan_tampil`,`vw_acara_publik`.`tanggal_publikasi` AS `tanggal_publikasi`,`vw_acara_publik`.`created_at` AS `created_at`,`vw_acara_publik`.`updated_at` AS `updated_at` from `vw_acara_publik` where (`vw_acara_publik`.`status_waktu` in ('Akan Datang','Berlangsung','Ditunda'));

-- Dumping structure for view dinas_pariwisata.vw_acara_publik
DROP VIEW IF EXISTS `vw_acara_publik`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_acara_publik`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_acara_publik` AS select `a`.`id` AS `id`,`a`.`slug` AS `slug`,`a`.`nama_acara` AS `nama_acara`,`a`.`ringkasan` AS `ringkasan`,`a`.`deskripsi` AS `deskripsi`,`a`.`kategori_acara_id` AS `kategori_acara_id`,`mka`.`kode` AS `kode_kategori`,`mka`.`slug` AS `slug_kategori`,`mka`.`nama_kategori` AS `nama_kategori`,`a`.`tanggal_mulai` AS `tanggal_mulai`,`a`.`tanggal_selesai` AS `tanggal_selesai`,`a`.`sepanjang_hari` AS `sepanjang_hari`,`a`.`zona_waktu` AS `zona_waktu`,`a`.`status_acara` AS `status_acara`,(case when (`a`.`status_acara` = 'Dibatalkan') then 'Dibatalkan' when (`a`.`status_acara` = 'Ditunda') then 'Ditunda' when (now() < `a`.`tanggal_mulai`) then 'Akan Datang' when (now() between `a`.`tanggal_mulai` and `a`.`tanggal_selesai`) then 'Berlangsung' else 'Selesai' end) AS `status_waktu`,`a`.`jenis_pelaksanaan` AS `jenis_pelaksanaan`,`a`.`nama_lokasi` AS `nama_lokasi`,`a`.`alamat` AS `alamat`,`a`.`kecamatan_id` AS `kecamatan_id`,`mkec`.`nama_kecamatan` AS `nama_kecamatan`,`a`.`kelurahan_id` AS `kelurahan_id`,`mkel`.`nama_kelurahan` AS `nama_kelurahan`,`a`.`latitude` AS `latitude`,`a`.`longitude` AS `longitude`,`a`.`tautan_daring` AS `tautan_daring`,`a`.`penyelenggara` AS `penyelenggara`,`a`.`narahubung_nama` AS `narahubung_nama`,`a`.`narahubung_telepon` AS `narahubung_telepon`,`a`.`narahubung_email` AS `narahubung_email`,`a`.`memerlukan_pendaftaran` AS `memerlukan_pendaftaran`,`a`.`tautan_pendaftaran` AS `tautan_pendaftaran`,`a`.`tanggal_buka_pendaftaran` AS `tanggal_buka_pendaftaran`,`a`.`tanggal_tutup_pendaftaran` AS `tanggal_tutup_pendaftaran`,(case when (`a`.`memerlukan_pendaftaran` = 0) then 0 when ((`a`.`tanggal_buka_pendaftaran` is not null) and (now() < `a`.`tanggal_buka_pendaftaran`)) then 0 when ((`a`.`tanggal_tutup_pendaftaran` is not null) and (now() > `a`.`tanggal_tutup_pendaftaran`)) then 0 else 1 end) AS `pendaftaran_dibuka`,`a`.`kuota` AS `kuota`,`a`.`gratis` AS `gratis`,`a`.`harga_mulai` AS `harga_mulai`,`a`.`harga_sampai` AS `harga_sampai`,`a`.`syarat_ketentuan` AS `syarat_ketentuan`,`a`.`foto_utama` AS `foto_utama`,`a`.`foto_alt` AS `foto_alt`,`a`.`video_url` AS `video_url`,`a`.`kata_kunci` AS `kata_kunci`,`a`.`unggulan` AS `unggulan`,`a`.`urutan_tampil` AS `urutan_tampil`,`a`.`tanggal_publikasi` AS `tanggal_publikasi`,`a`.`created_at` AS `created_at`,`a`.`updated_at` AS `updated_at` from (((`acara` `a` join `master_kategori_acara` `mka` on((`mka`.`id` = `a`.`kategori_acara_id`))) left join `master_kecamatan` `mkec` on((`mkec`.`id` = `a`.`kecamatan_id`))) left join `master_kelurahan` `mkel` on((`mkel`.`id` = `a`.`kelurahan_id`))) where ((`a`.`dipublikasikan` = 1) and (`a`.`aktif` = 1) and (`mka`.`aktif` = 1) and (`a`.`tanggal_publikasi` is not null) and (`a`.`tanggal_publikasi` <= now()));

-- Dumping structure for view dinas_pariwisata.vw_ai_katalog_pariwisata
DROP VIEW IF EXISTS `vw_ai_katalog_pariwisata`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_ai_katalog_pariwisata`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_ai_katalog_pariwisata` AS select 'hotel' AS `jenis_objek`,`h`.`id` AS `id`,`h`.`slug` AS `slug`,`h`.`nama_hotel` AS `nama`,`mjh`.`nama_jenis` AS `kategori`,`h`.`deskripsi_singkat` AS `deskripsi_singkat`,`h`.`alamat` AS `lokasi_ringkas`,`h`.`latitude` AS `latitude`,`h`.`longitude` AS `longitude`,`h`.`foto_utama` AS `foto_utama`,concat_ws(' ',`h`.`nama_hotel`,`mjh`.`nama_jenis`,`h`.`deskripsi_singkat`,`h`.`deskripsi`,`h`.`alamat`,`h`.`aksesibilitas`,`h`.`informasi_reservasi`) AS `konten_ai`,json_object('harga_mulai',`h`.`harga_mulai`,'harga_sampai',`h`.`harga_sampai`,'bintang',`h`.`klasifikasi_bintang`,'jumlah_kamar',`h`.`jumlah_kamar`) AS `metadata_json`,`h`.`updated_at` AS `updated_at` from (`hotel` `h` join `master_jenis_hotel` `mjh` on((`mjh`.`id` = `h`.`jenis_hotel_id`))) where ((`h`.`dipublikasikan` = 1) and (`h`.`aktif` = 1)) union all select 'kuliner' AS `kuliner`,`k`.`id` AS `id`,`k`.`slug` AS `slug`,`k`.`nama_usaha` AS `nama_usaha`,`mkk`.`nama_kategori` AS `nama_kategori`,`k`.`deskripsi_singkat` AS `deskripsi_singkat`,`k`.`alamat` AS `alamat`,`k`.`latitude` AS `latitude`,`k`.`longitude` AS `longitude`,`k`.`foto_utama` AS `foto_utama`,concat_ws(' ',`k`.`nama_usaha`,`mkk`.`nama_kategori`,`k`.`deskripsi_singkat`,`k`.`deskripsi`,`k`.`menu_unggulan`,`k`.`cita_rasa_khas`,`k`.`alamat`,`k`.`status_halal`) AS `konten_ai`,json_object('harga_mulai',`k`.`harga_mulai`,'harga_sampai',`k`.`harga_sampai`,'status_halal',`k`.`status_halal`,'dine_in',`k`.`tersedia_dine_in`,'takeaway',`k`.`tersedia_takeaway`,'delivery',`k`.`tersedia_delivery`) AS `metadata_json`,`k`.`updated_at` AS `updated_at` from (`kuliner` `k` join `master_kategori_kuliner` `mkk` on((`mkk`.`id` = `k`.`kategori_kuliner_id`))) where ((`k`.`dipublikasikan` = 1) and (`k`.`aktif` = 1)) union all select 'tempat_wisata' AS `tempat_wisata`,`tw`.`id` AS `id`,`tw`.`slug` AS `slug`,`tw`.`nama_tempat` AS `nama_tempat`,`mkw`.`nama_kategori` AS `nama_kategori`,`tw`.`deskripsi_singkat` AS `deskripsi_singkat`,`tw`.`alamat` AS `alamat`,`tw`.`latitude` AS `latitude`,`tw`.`longitude` AS `longitude`,`tw`.`foto_utama` AS `foto_utama`,concat_ws(' ',`tw`.`nama_tempat`,`mkw`.`nama_kategori`,`tw`.`deskripsi_singkat`,`tw`.`deskripsi`,`tw`.`sejarah`,`tw`.`daya_tarik_utama`,`tw`.`alamat`,`tw`.`akses_transportasi`,`tw`.`aksesibilitas`,`tw`.`waktu_kunjungan_terbaik`) AS `konten_ai`,json_object('tiket_dewasa',`tw`.`harga_tiket_domestik_dewasa`,'tiket_anak',`tw`.`harga_tiket_domestik_anak`,'cocok_anak',`tw`.`cocok_anak`,'cocok_keluarga',`tw`.`cocok_keluarga`,'ramah_lansia',`tw`.`ramah_lansia`,'tingkat_akses',`tw`.`tingkat_kesulitan_akses`) AS `metadata_json`,`tw`.`updated_at` AS `updated_at` from (`tempat_wisata` `tw` join `master_kategori_wisata` `mkw` on((`mkw`.`id` = `tw`.`kategori_wisata_id`))) where ((`tw`.`dipublikasikan` = 1) and (`tw`.`aktif` = 1)) union all select 'satwa_endemik' AS `satwa_endemik`,`se`.`id` AS `id`,`se`.`slug` AS `slug`,`se`.`nama_umum` AS `nama_umum`,coalesce(`se`.`kelas`,'Satwa') AS `COALESCE(se.``kelas``, 'Satwa')`,`se`.`deskripsi_singkat` AS `deskripsi_singkat`,`se`.`wilayah_endemik` AS `wilayah_endemik`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,`se`.`foto_utama` AS `foto_utama`,concat_ws(' ',`se`.`nama_umum`,`se`.`nama_lokal`,`se`.`nama_ilmiah`,`se`.`kelas`,`se`.`status_endemisitas`,`se`.`wilayah_endemik`,`se`.`deskripsi_singkat`,`se`.`deskripsi`,`se`.`ciri_fisik`,`se`.`habitat`,`se`.`persebaran`,`se`.`makanan`,`se`.`perilaku`,`se`.`ancaman`,`se`.`upaya_konservasi`,`se`.`fakta_unik`,`se`.`panduan_pengamatan`) AS `konten_ai`,json_object('nama_ilmiah',`se`.`nama_ilmiah`,'status_endemisitas',`se`.`status_endemisitas`,'status_konservasi',`msk`.`nama_status`,'wilayah_endemik',`se`.`wilayah_endemik`) AS `metadata_json`,`se`.`updated_at` AS `updated_at` from (`satwa_endemik` `se` left join `master_status_konservasi` `msk` on((`msk`.`id` = `se`.`status_konservasi_id`))) where ((`se`.`dipublikasikan` = 1) and (`se`.`aktif` = 1)) union all select 'berita' AS `berita`,`bp`.`id` AS `id`,`bp`.`slug` AS `slug`,`bp`.`judul` AS `judul`,`bp`.`nama_kategori` AS `nama_kategori`,coalesce(`bp`.`ringkasan`,`bp`.`subjudul`) AS `COALESCE(bp.``ringkasan``, bp.``subjudul``)`,`bp`.`sumber_nama` AS `sumber_nama`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,`bp`.`foto_utama` AS `foto_utama`,concat_ws(' ',`bp`.`judul`,`bp`.`subjudul`,`bp`.`ringkasan`,`bp`.`isi`,`bp`.`nama_kategori`,`bp`.`penulis_tampil`,`bp`.`sumber_nama`,`bp`.`kata_kunci`) AS `konten_ai`,json_object('tanggal_publikasi',`bp`.`tanggal_publikasi`,'penulis',`bp`.`penulis_tampil`,'headline',`bp`.`headline`,'sumber',`bp`.`sumber_nama`) AS `metadata_json`,`bp`.`updated_at` AS `updated_at` from `vw_berita_publik` `bp` union all select 'acara' AS `acara`,`ap`.`id` AS `id`,`ap`.`slug` AS `slug`,`ap`.`nama_acara` AS `nama_acara`,`ap`.`nama_kategori` AS `nama_kategori`,`ap`.`ringkasan` AS `ringkasan`,coalesce(`ap`.`nama_lokasi`,`ap`.`alamat`,`ap`.`jenis_pelaksanaan`) AS `COALESCE(ap.``nama_lokasi``, ap.``alamat``, ap.``jenis_pelaksanaan``)`,`ap`.`latitude` AS `latitude`,`ap`.`longitude` AS `longitude`,`ap`.`foto_utama` AS `foto_utama`,concat_ws(' ',`ap`.`nama_acara`,`ap`.`nama_kategori`,`ap`.`ringkasan`,`ap`.`deskripsi`,`ap`.`penyelenggara`,`ap`.`nama_lokasi`,`ap`.`alamat`,`ap`.`jenis_pelaksanaan`,`ap`.`status_waktu`,`ap`.`kata_kunci`) AS `konten_ai`,json_object('tanggal_mulai',`ap`.`tanggal_mulai`,'tanggal_selesai',`ap`.`tanggal_selesai`,'status',`ap`.`status_waktu`,'jenis_pelaksanaan',`ap`.`jenis_pelaksanaan`,'gratis',`ap`.`gratis`,'harga_mulai',`ap`.`harga_mulai`,'harga_sampai',`ap`.`harga_sampai`,'pendaftaran_dibuka',`ap`.`pendaftaran_dibuka`) AS `metadata_json`,`ap`.`updated_at` AS `updated_at` from `vw_acara_publik` `ap`;

-- Dumping structure for view dinas_pariwisata.vw_berita_publik
DROP VIEW IF EXISTS `vw_berita_publik`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_berita_publik`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_berita_publik` AS select `b`.`id` AS `id`,`b`.`slug` AS `slug`,`b`.`judul` AS `judul`,`b`.`subjudul` AS `subjudul`,`b`.`ringkasan` AS `ringkasan`,`b`.`isi` AS `isi`,`b`.`kategori_berita_id` AS `kategori_berita_id`,`mkb`.`kode` AS `kode_kategori`,`mkb`.`slug` AS `slug_kategori`,`mkb`.`nama_kategori` AS `nama_kategori`,`b`.`penulis_tampil` AS `penulis_tampil`,`b`.`sumber_nama` AS `sumber_nama`,`b`.`sumber_url` AS `sumber_url`,`b`.`foto_utama` AS `foto_utama`,`b`.`foto_keterangan` AS `foto_keterangan`,`b`.`foto_alt` AS `foto_alt`,`b`.`kata_kunci` AS `kata_kunci`,`b`.`headline` AS `headline`,`b`.`urutan_tampil` AS `urutan_tampil`,`b`.`tanggal_publikasi` AS `tanggal_publikasi`,`b`.`created_at` AS `created_at`,`b`.`updated_at` AS `updated_at` from (`berita` `b` join `master_kategori_berita` `mkb` on((`mkb`.`id` = `b`.`kategori_berita_id`))) where ((`b`.`dipublikasikan` = 1) and (`b`.`aktif` = 1) and (`mkb`.`aktif` = 1) and (`b`.`tanggal_publikasi` is not null) and (`b`.`tanggal_publikasi` <= now()));

-- Dumping structure for view dinas_pariwisata.vw_katalog_pariwisata_publik
DROP VIEW IF EXISTS `vw_katalog_pariwisata_publik`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_katalog_pariwisata_publik`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_katalog_pariwisata_publik` AS select 'hotel' AS `jenis_konten`,`h`.`id` AS `id`,`h`.`slug` AS `slug`,`h`.`nama_hotel` AS `nama`,`jh`.`nama_jenis` AS `kategori`,`h`.`deskripsi_singkat` AS `deskripsi_singkat`,`h`.`alamat` AS `lokasi_ringkas`,`h`.`latitude` AS `latitude`,`h`.`longitude` AS `longitude`,`h`.`foto_utama` AS `foto_utama`,`h`.`unggulan` AS `unggulan`,`h`.`tanggal_publikasi` AS `tanggal_publikasi`,`h`.`updated_at` AS `updated_at` from (`hotel` `h` join `master_jenis_hotel` `jh` on((`jh`.`id` = `h`.`jenis_hotel_id`))) where ((`h`.`dipublikasikan` = 1) and (`h`.`aktif` = 1)) union all select 'kuliner' AS `kuliner`,`k`.`id` AS `id`,`k`.`slug` AS `slug`,`k`.`nama_usaha` AS `nama_usaha`,`kk`.`nama_kategori` AS `nama_kategori`,`k`.`deskripsi_singkat` AS `deskripsi_singkat`,`k`.`alamat` AS `alamat`,`k`.`latitude` AS `latitude`,`k`.`longitude` AS `longitude`,`k`.`foto_utama` AS `foto_utama`,`k`.`unggulan` AS `unggulan`,`k`.`tanggal_publikasi` AS `tanggal_publikasi`,`k`.`updated_at` AS `updated_at` from (`kuliner` `k` join `master_kategori_kuliner` `kk` on((`kk`.`id` = `k`.`kategori_kuliner_id`))) where ((`k`.`dipublikasikan` = 1) and (`k`.`aktif` = 1)) union all select 'tempat_wisata' AS `tempat_wisata`,`tw`.`id` AS `id`,`tw`.`slug` AS `slug`,`tw`.`nama_tempat` AS `nama_tempat`,`kw`.`nama_kategori` AS `nama_kategori`,`tw`.`deskripsi_singkat` AS `deskripsi_singkat`,`tw`.`alamat` AS `alamat`,`tw`.`latitude` AS `latitude`,`tw`.`longitude` AS `longitude`,`tw`.`foto_utama` AS `foto_utama`,`tw`.`unggulan` AS `unggulan`,`tw`.`tanggal_publikasi` AS `tanggal_publikasi`,`tw`.`updated_at` AS `updated_at` from (`tempat_wisata` `tw` join `master_kategori_wisata` `kw` on((`kw`.`id` = `tw`.`kategori_wisata_id`))) where ((`tw`.`dipublikasikan` = 1) and (`tw`.`aktif` = 1)) union all select 'satwa_endemik' AS `satwa_endemik`,`se`.`id` AS `id`,`se`.`slug` AS `slug`,`se`.`nama_umum` AS `nama_umum`,coalesce(`msk`.`nama_status`,`se`.`status_endemisitas`) AS `COALESCE(msk.``nama_status``, se.``status_endemisitas``)`,`se`.`deskripsi_singkat` AS `deskripsi_singkat`,coalesce(`se`.`wilayah_endemik`,`se`.`habitat`) AS `COALESCE(se.``wilayah_endemik``, se.``habitat``)`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,`se`.`foto_utama` AS `foto_utama`,`se`.`unggulan` AS `unggulan`,`se`.`tanggal_publikasi` AS `tanggal_publikasi`,`se`.`updated_at` AS `updated_at` from (`satwa_endemik` `se` left join `master_status_konservasi` `msk` on((`msk`.`id` = `se`.`status_konservasi_id`))) where ((`se`.`dipublikasikan` = 1) and (`se`.`aktif` = 1)) union all select 'berita' AS `berita`,`bp`.`id` AS `id`,`bp`.`slug` AS `slug`,`bp`.`judul` AS `judul`,`bp`.`nama_kategori` AS `nama_kategori`,coalesce(`bp`.`ringkasan`,`bp`.`subjudul`) AS `COALESCE(bp.``ringkasan``, bp.``subjudul``)`,`bp`.`sumber_nama` AS `sumber_nama`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,cast(NULL as decimal(10,7)) AS `CAST(NULL AS DECIMAL(10,7))`,`bp`.`foto_utama` AS `foto_utama`,`bp`.`headline` AS `headline`,`bp`.`tanggal_publikasi` AS `tanggal_publikasi`,`bp`.`updated_at` AS `updated_at` from `vw_berita_publik` `bp` union all select 'acara' AS `acara`,`ap`.`id` AS `id`,`ap`.`slug` AS `slug`,`ap`.`nama_acara` AS `nama_acara`,`ap`.`nama_kategori` AS `nama_kategori`,`ap`.`ringkasan` AS `ringkasan`,coalesce(`ap`.`nama_lokasi`,`ap`.`alamat`,`ap`.`jenis_pelaksanaan`) AS `COALESCE(ap.``nama_lokasi``, ap.``alamat``, ap.``jenis_pelaksanaan``)`,`ap`.`latitude` AS `latitude`,`ap`.`longitude` AS `longitude`,`ap`.`foto_utama` AS `foto_utama`,`ap`.`unggulan` AS `unggulan`,`ap`.`tanggal_publikasi` AS `tanggal_publikasi`,`ap`.`updated_at` AS `updated_at` from `vw_acara_publik` `ap`;

-- Dumping structure for view dinas_pariwisata.vw_spk_hotel
DROP VIEW IF EXISTS `vw_spk_hotel`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_spk_hotel`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_spk_hotel` AS select `h`.`id` AS `id`,`h`.`slug` AS `slug`,`h`.`nama_hotel` AS `nama_hotel`,`h`.`jenis_hotel_id` AS `jenis_hotel_id`,`mjh`.`nama_jenis` AS `jenis_hotel`,`h`.`klasifikasi_bintang` AS `klasifikasi_bintang`,`h`.`harga_mulai` AS `harga_mulai`,`h`.`harga_sampai` AS `harga_sampai`,coalesce(((`h`.`harga_mulai` + `h`.`harga_sampai`) / 2),`h`.`harga_mulai`,`h`.`harga_sampai`,0) AS `harga_referensi`,`h`.`jumlah_kamar` AS `jumlah_kamar`,`h`.`latitude` AS `latitude`,`h`.`longitude` AS `longitude`,`h`.`kecamatan_id` AS `kecamatan_id`,`h`.`kelurahan_id` AS `kelurahan_id`,(select count(0) from `hotel_fasilitas` `hf` where (`hf`.`hotel_id` = `h`.`id`)) AS `jumlah_fasilitas`,exists(select 1 from (`hotel_fasilitas` `hf` join `master_fasilitas` `mf` on((`mf`.`id` = `hf`.`fasilitas_id`))) where ((`hf`.`hotel_id` = `h`.`id`) and (`mf`.`kode` = 'PARKIR') and (`mf`.`aktif` = 1))) AS `memiliki_parkir`,exists(select 1 from (`hotel_fasilitas` `hf` join `master_fasilitas` `mf` on((`mf`.`id` = `hf`.`fasilitas_id`))) where ((`hf`.`hotel_id` = `h`.`id`) and (`mf`.`kode` = 'MUSALA') and (`mf`.`aktif` = 1))) AS `memiliki_musala`,(((exists(select 1 from (`hotel_fasilitas` `hf` join `master_fasilitas` `mf` on((`mf`.`id` = `hf`.`fasilitas_id`))) where ((`hf`.`hotel_id` = `h`.`id`) and (`mf`.`kode` = 'DIFABEL') and (`mf`.`aktif` = 1))) + exists(select 1 from (`hotel_fasilitas` `hf` join `master_fasilitas` `mf` on((`mf`.`id` = `hf`.`fasilitas_id`))) where ((`hf`.`hotel_id` = `h`.`id`) and (`mf`.`kode` = 'KURSI_RODA') and (`mf`.`aktif` = 1)))) + exists(select 1 from (`hotel_fasilitas` `hf` join `master_fasilitas` `mf` on((`mf`.`id` = `hf`.`fasilitas_id`))) where ((`hf`.`hotel_id` = `h`.`id`) and (`mf`.`kode` = 'LIFT') and (`mf`.`aktif` = 1)))) + exists(select 1 from (`hotel_fasilitas` `hf` join `master_fasilitas` `mf` on((`mf`.`id` = `hf`.`fasilitas_id`))) where ((`hf`.`hotel_id` = `h`.`id`) and (`mf`.`kode` = 'PARKIR') and (`mf`.`aktif` = 1)))) AS `skor_aksesibilitas`,`h`.`dipublikasikan` AS `dipublikasikan`,`h`.`aktif` AS `aktif` from (`hotel` `h` join `master_jenis_hotel` `mjh` on((`mjh`.`id` = `h`.`jenis_hotel_id`))) where ((`h`.`dipublikasikan` = 1) and (`h`.`aktif` = 1));

-- Dumping structure for view dinas_pariwisata.vw_spk_kuliner
DROP VIEW IF EXISTS `vw_spk_kuliner`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_spk_kuliner`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_spk_kuliner` AS select `k`.`id` AS `id`,`k`.`slug` AS `slug`,`k`.`nama_usaha` AS `nama_usaha`,`k`.`kategori_kuliner_id` AS `kategori_kuliner_id`,`mkk`.`nama_kategori` AS `kategori_kuliner`,`k`.`harga_mulai` AS `harga_mulai`,`k`.`harga_sampai` AS `harga_sampai`,coalesce(((`k`.`harga_mulai` + `k`.`harga_sampai`) / 2),`k`.`harga_mulai`,`k`.`harga_sampai`,0) AS `harga_referensi`,`k`.`status_halal` AS `status_halal`,(case `k`.`status_halal` when 'Halal Bersertifikat' then 5 when 'Klaim Halal' then 4 when 'Proses Sertifikasi' then 3 when 'Belum Diketahui' then 1 when 'Tidak Halal' then 0 else 0 end) AS `skor_halal`,(((`k`.`tersedia_dine_in` + `k`.`tersedia_takeaway`) + `k`.`tersedia_delivery`) + `k`.`menerima_reservasi`) AS `jumlah_layanan`,`k`.`latitude` AS `latitude`,`k`.`longitude` AS `longitude`,`k`.`kecamatan_id` AS `kecamatan_id`,`k`.`kelurahan_id` AS `kelurahan_id`,(select count(0) from `kuliner_fasilitas` `kf` where (`kf`.`kuliner_id` = `k`.`id`)) AS `jumlah_fasilitas`,exists(select 1 from (`kuliner_fasilitas` `kf` join `master_fasilitas` `mf` on((`mf`.`id` = `kf`.`fasilitas_id`))) where ((`kf`.`kuliner_id` = `k`.`id`) and (`mf`.`kode` = 'PARKIR') and (`mf`.`aktif` = 1))) AS `memiliki_parkir`,exists(select 1 from (`kuliner_fasilitas` `kf` join `master_fasilitas` `mf` on((`mf`.`id` = `kf`.`fasilitas_id`))) where ((`kf`.`kuliner_id` = `k`.`id`) and (`mf`.`kode` = 'MUSALA') and (`mf`.`aktif` = 1))) AS `memiliki_musala`,`k`.`dipublikasikan` AS `dipublikasikan`,`k`.`aktif` AS `aktif` from (`kuliner` `k` join `master_kategori_kuliner` `mkk` on((`mkk`.`id` = `k`.`kategori_kuliner_id`))) where ((`k`.`dipublikasikan` = 1) and (`k`.`aktif` = 1));

-- Dumping structure for view dinas_pariwisata.vw_spk_satwa_endemik
DROP VIEW IF EXISTS `vw_spk_satwa_endemik`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_spk_satwa_endemik`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_spk_satwa_endemik` AS select `se`.`id` AS `id`,`se`.`slug` AS `slug`,`se`.`nama_umum` AS `nama_umum`,`se`.`nama_lokal` AS `nama_lokal`,`se`.`nama_ilmiah` AS `nama_ilmiah`,`se`.`kelas` AS `kelompok_satwa`,`se`.`status_endemisitas` AS `status_endemisitas`,`se`.`wilayah_endemik` AS `wilayah_endemik`,`se`.`habitat` AS `habitat`,`se`.`status_konservasi_id` AS `status_konservasi_id`,`msk`.`kode` AS `kode_status_konservasi`,`msk`.`nama_status` AS `status_konservasi`,coalesce(`msk`.`urutan_prioritas`,0) AS `skor_prioritas_konservasi`,(select round(avg(`sel`.`latitude_publik`),7) from `satwa_endemik_lokasi` `sel` where ((`sel`.`satwa_endemik_id` = `se`.`id`) and (`sel`.`aktif` = 1) and (`sel`.`tingkat_sensitivitas` <> 'Rahasia') and (`sel`.`latitude_publik` is not null))) AS `latitude`,(select round(avg(`sel`.`longitude_publik`),7) from `satwa_endemik_lokasi` `sel` where ((`sel`.`satwa_endemik_id` = `se`.`id`) and (`sel`.`aktif` = 1) and (`sel`.`tingkat_sensitivitas` <> 'Rahasia') and (`sel`.`longitude_publik` is not null))) AS `longitude`,(select count(0) from `satwa_endemik_lokasi` `sel` where ((`sel`.`satwa_endemik_id` = `se`.`id`) and (`sel`.`aktif` = 1))) AS `jumlah_lokasi`,(select count(0) from `satwa_endemik_lokasi` `sel` where ((`sel`.`satwa_endemik_id` = `se`.`id`) and (`sel`.`aktif` = 1) and (`sel`.`tingkat_sensitivitas` <> 'Rahasia') and (`sel`.`pengamatan_diizinkan` = 1))) AS `jumlah_lokasi_pengamatan`,(select count(0) from `satwa_endemik_lokasi` `sel` where ((`sel`.`satwa_endemik_id` = `se`.`id`) and (`sel`.`aktif` = 1) and (`sel`.`jenis_lokasi` in ('Pusat Konservasi','Wisata Edukasi','Penangkaran')))) AS `jumlah_lokasi_edukasi`,coalesce((select max((case `sel`.`tingkat_akses` when 'Sangat Mudah' then 5 when 'Mudah' then 4 when 'Sedang' then 3 when 'Sulit' then 2 when 'Sangat Sulit' then 1 else 0 end)) from `satwa_endemik_lokasi` `sel` where ((`sel`.`satwa_endemik_id` = `se`.`id`) and (`sel`.`aktif` = 1) and (`sel`.`tingkat_sensitivitas` <> 'Rahasia') and (`sel`.`pengamatan_diizinkan` = 1))),0) AS `skor_kemudahan_pengamatan`,`se`.`dipublikasikan` AS `dipublikasikan`,`se`.`aktif` AS `aktif` from (`satwa_endemik` `se` left join `master_status_konservasi` `msk` on((`msk`.`id` = `se`.`status_konservasi_id`))) where ((`se`.`dipublikasikan` = 1) and (`se`.`aktif` = 1));

-- Dumping structure for view dinas_pariwisata.vw_spk_tempat_wisata
DROP VIEW IF EXISTS `vw_spk_tempat_wisata`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_spk_tempat_wisata`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_spk_tempat_wisata` AS select `tw`.`id` AS `id`,`tw`.`slug` AS `slug`,`tw`.`nama_tempat` AS `nama_tempat`,`tw`.`kategori_wisata_id` AS `kategori_wisata_id`,`mkw`.`nama_kategori` AS `kategori_wisata`,`tw`.`harga_tiket_domestik_dewasa` AS `harga_tiket_domestik_dewasa`,`tw`.`harga_tiket_domestik_anak` AS `harga_tiket_domestik_anak`,`tw`.`harga_tiket_mancanegara` AS `harga_tiket_mancanegara`,coalesce(`tw`.`harga_tiket_domestik_dewasa`,`tw`.`harga_tiket_domestik_anak`,`tw`.`harga_tiket_mancanegara`,0) AS `harga_tiket_referensi`,`tw`.`durasi_kunjungan_menit` AS `durasi_kunjungan_menit`,`tw`.`cocok_anak` AS `cocok_anak`,`tw`.`cocok_keluarga` AS `cocok_keluarga`,`tw`.`ramah_lansia` AS `ramah_lansia`,((`tw`.`cocok_anak` + `tw`.`cocok_keluarga`) + `tw`.`ramah_lansia`) AS `skor_kesesuaian_pengunjung`,`tw`.`tingkat_kesulitan_akses` AS `tingkat_kesulitan_akses`,(case `tw`.`tingkat_kesulitan_akses` when 'Sangat Mudah' then 5 when 'Mudah' then 4 when 'Sedang' then 3 when 'Sulit' then 2 when 'Sangat Sulit' then 1 else 0 end) AS `skor_aksesibilitas`,`tw`.`latitude` AS `latitude`,`tw`.`longitude` AS `longitude`,`tw`.`kecamatan_id` AS `kecamatan_id`,`tw`.`kelurahan_id` AS `kelurahan_id`,(select count(0) from `tempat_wisata_fasilitas` `twf` where (`twf`.`tempat_wisata_id` = `tw`.`id`)) AS `jumlah_fasilitas`,(select count(0) from `tempat_wisata_aktivitas` `twa` where ((`twa`.`tempat_wisata_id` = `tw`.`id`) and (`twa`.`aktif` = 1))) AS `jumlah_aktivitas`,exists(select 1 from (`tempat_wisata_fasilitas` `twf` join `master_fasilitas` `mf` on((`mf`.`id` = `twf`.`fasilitas_id`))) where ((`twf`.`tempat_wisata_id` = `tw`.`id`) and (`mf`.`kode` = 'PARKIR') and (`mf`.`aktif` = 1))) AS `memiliki_parkir`,exists(select 1 from (`tempat_wisata_fasilitas` `twf` join `master_fasilitas` `mf` on((`mf`.`id` = `twf`.`fasilitas_id`))) where ((`twf`.`tempat_wisata_id` = `tw`.`id`) and (`mf`.`kode` = 'MUSALA') and (`mf`.`aktif` = 1))) AS `memiliki_musala`,`tw`.`dipublikasikan` AS `dipublikasikan`,`tw`.`aktif` AS `aktif` from (`tempat_wisata` `tw` join `master_kategori_wisata` `mkw` on((`mkw`.`id` = `tw`.`kategori_wisata_id`))) where ((`tw`.`dipublikasikan` = 1) and (`tw`.`aktif` = 1));

-- Dumping structure for view dinas_pariwisata.vw_spk_total_bobot
DROP VIEW IF EXISTS `vw_spk_total_bobot`;
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vw_spk_total_bobot`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_spk_total_bobot` AS select `sk`.`jenis_objek` AS `jenis_objek`,count(0) AS `jumlah_kriteria_aktif`,round(sum(`sb`.`bobot`),6) AS `total_bobot`,(case when (round(sum(`sb`.`bobot`),6) = 1.000000) then 1 else 0 end) AS `bobot_valid` from (`spk_kriteria` `sk` join `spk_bobot` `sb` on(((`sb`.`kriteria_id` = `sk`.`id`) and (`sb`.`aktif` = 1)))) where (`sk`.`aktif` = 1) group by `sk`.`jenis_objek`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
