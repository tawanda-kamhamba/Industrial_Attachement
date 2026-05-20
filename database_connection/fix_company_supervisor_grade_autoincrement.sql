-- Fix company_supervisor_grade.id: remove duplicate primary keys, then enable AUTO_INCREMENT.
-- Run in phpMyAdmin if ALTER TABLE fails with #1062 duplicate entry for key 'PRIMARY'.

ALTER TABLE `company_supervisor_grade` DROP PRIMARY KEY;

SET @iasms_csg_id := 0;
UPDATE `company_supervisor_grade`
SET `id` = (@iasms_csg_id := @iasms_csg_id + 1)
ORDER BY `date` ASC, `id` ASC;

ALTER TABLE `company_supervisor_grade`
  MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY;
