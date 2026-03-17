-- Fix visiting_lecturers.id being non-AUTO_INCREMENT (causes many rows to have id=0)
-- Symptoms:
-- - Supervisor login returns user_id=0 for many supervisors
-- - Assessment passwords update "only one row" and display same password for everyone
--
-- Run in phpMyAdmin (SQL tab) on the IASMS database.

-- 1) Give every row a unique id (safe even if currently all 0)
SET @iasms_i := 0;
UPDATE visiting_lecturers
SET id = (@iasms_i := @iasms_i + 1)
ORDER BY lecturer_name, lecturer_email, staff_id;

-- 2) Make id the PRIMARY KEY and AUTO_INCREMENT for future inserts
ALTER TABLE visiting_lecturers
  MODIFY id INT(11) NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (id);

-- 3) Ensure AUTO_INCREMENT continues from max(id)+1
SET @iasms_next := (SELECT COALESCE(MAX(id), 0) + 1 FROM visiting_lecturers);
SET @iasms_sql := CONCAT('ALTER TABLE visiting_lecturers AUTO_INCREMENT = ', @iasms_next);
PREPARE stmt FROM @iasms_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

