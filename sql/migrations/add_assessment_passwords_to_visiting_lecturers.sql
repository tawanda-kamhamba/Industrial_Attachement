-- Add columns for assessment form passwords (student portal links).
-- visiting_assessment_password: used by this institutional supervisor when opening "Visiting Supervisor Assessment".
-- company_assessment_password: shared with company supervisors to open "Company Supervisor Assessment".
--
-- Run in phpMyAdmin (SQL tab) or: mysql -u root -p IASMS < database_connection/add_assessment_passwords_to_visiting_lecturers.sql

USE IASMS;

ALTER TABLE `visiting_lecturers` ADD COLUMN `visiting_assessment_password` VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE `visiting_lecturers` ADD COLUMN `company_assessment_password` VARCHAR(255) NULL DEFAULT NULL;
