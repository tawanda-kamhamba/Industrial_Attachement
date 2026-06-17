-- Create table to store student profile picture metadata (file path and type).
-- The actual image files are still saved in: uploads/student_profiles/
--
-- How to run:
-- 1. Open phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Select database "IASMS"
-- 3. Click the "SQL" tab
-- 4. Paste this entire file and click "Go"
--
-- Or from command line: mysql -u root -p IASMS < database_connection/create_student_profile_photos_table.sql

USE IASMS;

CREATE TABLE IF NOT EXISTS `student_profile_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `index_number` varchar(50) NOT NULL,
  `filename` varchar(255) NOT NULL COMMENT 'File name on disk, e.g. R123456.jpg',
  `content_type` varchar(100) NOT NULL DEFAULT 'image/jpeg',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_number` (`index_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
