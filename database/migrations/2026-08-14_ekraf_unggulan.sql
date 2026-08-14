-- Menambahkan penanda Pelaku Ekraf unggulan untuk prioritas tampilan beranda.
ALTER TABLE `pengajuan_ekraf`
  ADD COLUMN `unggulan` tinyint(1) NOT NULL DEFAULT '0' AFTER `status`,
  ADD KEY `idx_pengajuan_ekraf_unggulan` (`unggulan`,`status`,`tanggal_verifikasi`);
