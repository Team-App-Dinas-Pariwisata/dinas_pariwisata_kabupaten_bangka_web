-- Tambahan untuk instalasi yang sebelumnya sudah memiliki fitur chat guest <-> petugas.
-- Digunakan untuk mendeteksi petugas yang masih aktif di portal tanpa WebSocket.

CREATE TABLE IF NOT EXISTS `staff_chat_presence` (
  `user_id` bigint unsigned NOT NULL,
  `last_seen_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_staff_chat_presence_last_seen` (`last_seen_at`),
  CONSTRAINT `fk_staff_chat_presence_user` FOREIGN KEY (`user_id`) REFERENCES `pengguna` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
