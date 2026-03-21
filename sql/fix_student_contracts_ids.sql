-- =============================================================================
-- Fix student_contracts when every row has id = 0 (or duplicate ids)
-- =============================================================================
-- Symptom: "Invalid contract id", downloads wrong file, or profile hides contract.
-- Cause:   `id` is NOT NULL but not AUTO_INCREMENT, so INSERTs store 0.
--
-- BACK UP your database before running (Export in phpMyAdmin).
-- Run this against your IASMS database (e.g. iasms).
-- =============================================================================

-- If this errors because there is no PRIMARY KEY on `id`, skip DROP / ADD PK lines
-- and only run the UPDATE + MODIFY + AUTO_INCREMENT parts as appropriate.

ALTER TABLE student_contracts DROP PRIMARY KEY;

-- Assign unique positive ids in a stable order
SET @rownum := 0;
UPDATE student_contracts
SET id = (@rownum := @rownum + 1)
ORDER BY submission_date ASC, index_number ASC, contract_file ASC;

-- Primary key + auto-increment for new uploads (matches intended schema)
ALTER TABLE student_contracts
  MODIFY id INT(11) NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (id);

-- Set next AUTO_INCREMENT to max(id) + 1
SET @next_ai := (SELECT COALESCE(MAX(id), 0) + 1 FROM student_contracts);
SET @stmt := CONCAT('ALTER TABLE student_contracts AUTO_INCREMENT = ', @next_ai);
PREPARE dynamic_ai FROM @stmt;
EXECUTE dynamic_ai;
DEALLOCATE PREPARE dynamic_ai;

-- Verify: each id should be 1, 2, 3, ... and unique
-- SELECT id, index_number, original_filename FROM student_contracts ORDER BY id;
