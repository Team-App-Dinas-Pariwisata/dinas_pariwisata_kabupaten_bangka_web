-- Migration akun pengaju SI PARIK BANGKA berbasis Google OAuth
-- Jalankan SATU KALI pada database lama yang sudah ada:
-- mysql -u root -p dinas_pariwisata < database/migrations/2026-08-11_google_pengaju.sql

ALTER TABLE `pengguna`
  MODIFY COLUMN `role` enum('admin','pengguna','pengaju') NOT NULL DEFAULT 'pengguna'
    COMMENT 'admin mengelola akun; pengguna adalah petugas operasional; pengaju adalah masyarakat/pemohon Google OAuth',
  ADD COLUMN `auth_provider` enum('password','google') NOT NULL DEFAULT 'password' AFTER `id_jabatan`,
  ADD COLUMN `google_sub` varchar(191) DEFAULT NULL AFTER `auth_provider`,
  ADD COLUMN `email_verified` tinyint(1) NOT NULL DEFAULT '0' AFTER `google_sub`,
  ADD UNIQUE KEY `uk_users_google_sub` (`google_sub`);

UPDATE `pengguna`
SET `auth_provider` = 'password', `email_verified` = 0
WHERE `role` IN ('admin','pengguna');

ALTER TABLE `pengajuan_ekraf`
  ADD KEY `idx_pengajuan_ekraf_created_by` (`created_by`);

ALTER TABLE `pengajuan_sdm_pariwisata`
  ADD KEY `idx_pengajuan_sdm_created_by` (`created_by`);

ALTER TABLE `pengajuan_komunitas_asosiasi`
  ADD KEY `idx_pengajuan_komunitas_created_by` (`created_by`);
