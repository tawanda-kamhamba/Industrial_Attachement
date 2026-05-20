-- IASMS Database Schema & Seed Data
-- ==================================
-- Use on a new laptop: import this file in phpMyAdmin or run: mysql -u root -p < iasms.sql
-- Creates database IASMS (or use existing), all tables, Zimbabwe provinces, 11 faculties (AGR, ARTS, COM, CIE, EDU, ENG, LAW, MED, SCI, SOC, VET).
-- Ensure database_connection.php uses the same DB name (IASMS) and credentials.
--
-- Original dump metadata:
-- Host: 127.0.0.1 | Server: MariaDB/MySQL

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: IASMS (Industrial Attachment / VIRA Management)
-- Use this file to set up the database on a new machine (e.g. another laptop).
--
CREATE DATABASE IF NOT EXISTS `IASMS` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `IASMS`;

-- --------------------------------------------------------

--
-- Table structure for table `assigned_lecturers`
-- Regions = Zimbabwe provinces; 11 faculties: AGR, ARTS, COM, CIE, EDU, ENG, LAW, MED, SCI, SOC, VET
--

CREATE TABLE `assigned_lecturers` (
  `id` int(11) NOT NULL,
  `regions` varchar(255) NOT NULL,
  `first_supervisor_agr` varchar(255) DEFAULT NULL,
  `second_supervisor_agr` varchar(255) DEFAULT NULL,
  `first_supervisor_arts` varchar(255) DEFAULT NULL,
  `second_supervisor_arts` varchar(255) DEFAULT NULL,
  `first_supervisor_com` varchar(255) DEFAULT NULL,
  `second_supervisor_com` varchar(255) DEFAULT NULL,
  `first_supervisor_cie` varchar(255) DEFAULT NULL,
  `second_supervisor_cie` varchar(255) DEFAULT NULL,
  `first_supervisor_edu` varchar(255) DEFAULT NULL,
  `second_supervisor_edu` varchar(255) DEFAULT NULL,
  `first_supervisor_eng` varchar(255) DEFAULT NULL,
  `second_supervisor_eng` varchar(255) DEFAULT NULL,
  `first_supervisor_law` varchar(255) DEFAULT NULL,
  `second_supervisor_law` varchar(255) DEFAULT NULL,
  `first_supervisor_med` varchar(255) DEFAULT NULL,
  `second_supervisor_med` varchar(255) DEFAULT NULL,
  `first_supervisor_sci` varchar(255) DEFAULT NULL,
  `second_supervisor_sci` varchar(255) DEFAULT NULL,
  `first_supervisor_soc` varchar(255) DEFAULT NULL,
  `second_supervisor_soc` varchar(255) DEFAULT NULL,
  `first_supervisor_vet` varchar(255) DEFAULT NULL,
  `second_supervisor_vet` varchar(255) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `assigned_lecturers` (Zimbabwe 10 provinces)
--

INSERT INTO `assigned_lecturers` (`id`, `regions`, `first_supervisor_agr`, `second_supervisor_agr`, `first_supervisor_arts`, `second_supervisor_arts`, `first_supervisor_com`, `second_supervisor_com`, `first_supervisor_cie`, `second_supervisor_cie`, `first_supervisor_edu`, `second_supervisor_edu`, `first_supervisor_eng`, `second_supervisor_eng`, `first_supervisor_law`, `second_supervisor_law`, `first_supervisor_med`, `second_supervisor_med`, `first_supervisor_sci`, `second_supervisor_sci`, `first_supervisor_soc`, `second_supervisor_soc`, `first_supervisor_vet`, `second_supervisor_vet`, `date`) VALUES
(1, 'Bulawayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(2, 'Harare', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(3, 'Manicaland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(4, 'Mashonaland Central', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(5, 'Mashonaland East', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(6, 'Mashonaland West', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(7, 'Masvingo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(8, 'Matabeleland North', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(9, 'Matabeleland South', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
(10, 'Midlands', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW());

-- --------------------------------------------------------

--
-- Table structure for table `company_supervisor_grade`
--

CREATE TABLE `company_supervisor_grade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `user_index` varchar(100) NOT NULL,
  `specific_skill_1` varchar(100) NOT NULL,
  `specific_skill_1_score` int(11) NOT NULL,
  `specific_skill_2` varchar(100) NOT NULL,
  `specific_skill_2_score` int(11) NOT NULL,
  `specific_skill_3` varchar(100) NOT NULL,
  `specific_skill_3_score` int(11) NOT NULL,
  `specific_skill_4` varchar(100) NOT NULL,
  `specific_skill_4_score` int(11) NOT NULL,
  `specific_skill_5` varchar(100) NOT NULL,
  `specific_skill_5_score` int(5) NOT NULL,
  `ability_to_complete_work_on_time` int(5) NOT NULL,
  `ability_to_follow_instructions_carefully` int(5) NOT NULL,
  `ability_to_take_initiatives` int(5) NOT NULL,
  `ability_to_work_with_little_supervision` int(5) NOT NULL,
  `adherence_to_organizations_rules` int(5) NOT NULL,
  `adherence_to_safety` int(5) NOT NULL,
  `resourcefulness` int(5) NOT NULL,
  `attendance_to_work` int(5) NOT NULL,
  `punctuality` int(5) NOT NULL,
  `desire_to_work` int(5) NOT NULL,
  `williness_to_accept_new_ideas` int(5) NOT NULL,
  `relationship_with_colleagues` int(5) NOT NULL,
  `relationship_with_supervisors` int(5) NOT NULL,
  `ability_to_control_emotions_when_provoked` int(5) NOT NULL,
  `grade` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `company_supervisor_grade`
--

INSERT INTO `company_supervisor_grade` (`id`, `username`, `user_index`, `specific_skill_1`, `specific_skill_1_score`, `specific_skill_2`, `specific_skill_2_score`, `specific_skill_3`, `specific_skill_3_score`, `specific_skill_4`, `specific_skill_4_score`, `specific_skill_5`, `specific_skill_5_score`, `ability_to_complete_work_on_time`, `ability_to_follow_instructions_carefully`, `ability_to_take_initiatives`, `ability_to_work_with_little_supervision`, `adherence_to_organizations_rules`, `adherence_to_safety`, `resourcefulness`, `attendance_to_work`, `punctuality`, `desire_to_work`, `williness_to_accept_new_ideas`, `relationship_with_colleagues`, `relationship_with_supervisors`, `ability_to_control_emotions_when_provoked`, `grade`, `date`) VALUES
(1, 'LiousVuiton', '04/2013/0688D', 'Home', 5, 'is', 5, 'sweet', 5, 'papa', 5, 'hmmm', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-18 18:25:00'),
(2, 'KingShabo', '04/2014/0099D', 'po', 5, 'pi', 5, 'ty', 5, 'gh', 5, 'we', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-22 20:14:47'),
(3, 'PriscillaAwuku', '04/2014/0666D', 'GH', 5, 'Ph', 5, 'Wh', 5, 'Zh', 5, 'QH', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-23 05:34:39'),
(4, 'LiousVuiton', '04/2013/0688D', 'a', 5, 'b', 5, 'c', 5, 'd', 5, 'e', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-23 15:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `industrial_registration`
--

CREATE TABLE `industrial_registration` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `other_name` varchar(200) NOT NULL,
  `level` varchar(200) NOT NULL,
  `programme` varchar(200) NOT NULL,
  `session` varchar(200) NOT NULL,
  `faculty` varchar(100) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `index_number` varchar(255) NOT NULL,
  `company_supervisor_grade` int(11) NOT NULL,
  `visiting_supervisor_grade` int(11) NOT NULL,
  `company_supervisor_name` varchar(100) NOT NULL DEFAULT 'unassigned',
  `visiting_supervisor_name` varchar(100) NOT NULL DEFAULT 'unassigned',
  `company_supervisor_contact` varchar(11) NOT NULL,
  `visiting_supervisor_contact` varchar(11) NOT NULL,
  `attachment_region` varchar(100) NOT NULL DEFAULT 'unassigned'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `industrial_registration`
--

INSERT INTO `industrial_registration` (`id`, `first_name`, `last_name`, `other_name`, `level`, `programme`, `session`, `faculty`, `date`, `index_number`, `company_supervisor_grade`, `visiting_supervisor_grade`, `company_supervisor_name`, `visiting_supervisor_name`, `company_supervisor_contact`, `visiting_supervisor_contact`, `attachment_region`) VALUES
(3, 'Lious', 'Vuiton', '', '100', 'Accountancy', 'Morning', 'FAST', '2017-04-23 15:29:53', '04/2013/0688D', 100, 100, 'Ahitpogeah', 'Peter Donk', '99887788778', '0247732082', 'Central Region');

-- --------------------------------------------------------

--
-- Table structure for table `registered_students`
--

CREATE TABLE `registered_students` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `index_number` varchar(25) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `registered_students`
--

INSERT INTO `registered_students` (`id`, `first_name`, `last_name`, `index_number`, `password`) VALUES
(1, 'Peter', 'Donk', '04/2014/0688D', 'Peterdonk'),
(2, 'John', 'Doe', '04/2014/0689D', 'Doe'),
(3, 'Micheal', 'Faraday', '04/2014/0690D', 'micheal'),
(4, 'Don', 'Little', '04/2014/0000D', 'little'),
(5, 'Lious', 'Vuiton', '04/2013/0688D', 'donk2'),
(6, 'King', 'Shabo', '04/2014/0099D', 'shabo'),
(7, 'Priscilla', 'Awuku', '04/2014/0666D', 'rep');

-- --------------------------------------------------------

--
-- Table structure for table `student_profile_photos` (profile picture metadata; files in uploads/student_profiles/)
--

CREATE TABLE IF NOT EXISTS `student_profile_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `index_number` varchar(50) NOT NULL,
  `filename` varchar(255) NOT NULL COMMENT 'File name on disk, e.g. R123456.jpg',
  `content_type` varchar(100) NOT NULL DEFAULT 'image/jpeg',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_number` (`index_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `students_assumption`
--

CREATE TABLE `students_assumption` (
  `id` int(11) NOT NULL,
  `first_name` varchar(200) NOT NULL,
  `last_name` varchar(200) NOT NULL,
  `other_name` varchar(200) NOT NULL,
  `index_number` varchar(200) NOT NULL,
  `level` varchar(200) NOT NULL,
  `programme` varchar(200) NOT NULL,
  `session` varchar(200) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `supervisor_name` varchar(200) NOT NULL,
  `supervisor_contact` int(20) NOT NULL,
  `supervisor_email` varchar(100) NOT NULL,
  `company_region` varchar(200) NOT NULL,
  `company_address` mediumtext NOT NULL,
  `registration_type` varchar(200) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `students_assumption`
--

INSERT INTO `students_assumption` (`id`, `first_name`, `last_name`, `other_name`, `index_number`, `level`, `programme`, `session`, `company_name`, `supervisor_name`, `supervisor_contact`, `supervisor_email`, `company_region`, `company_address`, `registration_type`, `date`) VALUES
(10, 'Peter', 'Donk', '', '04/2014/0688D', '200', 'Computer Science', 'Evening', 'Scynett', 'Chris', 2147483647, 'gh@gmail.com', 'Central Region', 'Something', 'VIRA REGISTRATION', '2017-04-17 00:35:18'),
(15, 'King', 'Shabo', '', '04/2014/0099D', '100', 'Building Technology', 'Morning', 'Donk Enterprise1', 'PeterDonk2', 2147483647, 'donk172@gmail.com', 'Greater Accra Region', 'Opposide', 'VIRA REGISTRATION', '2017-04-22 21:05:40'),
(16, 'Don', 'Little', '', '04/2014/0000D', '100', 'Computer Science', 'Morning', 'Ponkey', 'Josh', 2147483647, 'ht@gmail.com', 'Volta Region', 'Bingo', 'INDUSTRIAL REGISTRATION', '2017-04-22 21:38:16'),
(17, 'Priscilla', 'Awuku', '', '04/2014/0666D', '200', 'Computer Science', 'Morning', 'Koforidua Technical University', 'Sackey Tego', 2147483647, 'peterdonk@gmail.com', 'Eastern Region', 'Koforidua Technical University', 'VIRA REGISTRATION', '2017-04-23 05:32:57'),
(19, 'Lious', 'Vuiton', '', '04/2013/0688D', '100', 'Accountancy', 'Morning', 'Koforidua Technical University', 'Ahitpogeah', 2147483647, 'peterdonk@gmail.com', 'Central Region', 'Opposite', 'INDUSTRIAL REGISTRATION', '2017-04-23 15:31:13');

-- --------------------------------------------------------

--
-- Table structure for table `institutional_supervisor_students`
-- Links institutional supervisors (visiting_lecturers.id) to assigned students; supervisor_id = visiting_lecturers.id
--

CREATE TABLE IF NOT EXISTS `institutional_supervisor_students` (
  `id` int(11) NOT NULL,
  `supervisor_id` int(11) NOT NULL,
  `student_index` varchar(100) NOT NULL,
  `visit_number` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `student_index` (`student_index`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `supervisors_login`
--

CREATE TABLE `supervisors_login` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `supervisors_login`
--

INSERT INTO `supervisors_login` (`id`, `username`, `password`, `date`, `status`) VALUES
(1, 'John', 'john', '2017-03-16 20:16:58', 'Visiting');

-- --------------------------------------------------------

--
-- Table structure for table `system_admin`
--

CREATE TABLE `system_admin` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `system_admin`
--

INSERT INTO `system_admin` (`id`, `username`, `password`) VALUES
(1, 'Micheal', 'dzelu'),
(2, 'Fiifi', 'rueben');

-- --------------------------------------------------------

--
-- Table structure for table `vira_receipts_paid`
--

CREATE TABLE `vira_receipts_paid` (
  `id` int(11) NOT NULL,
  `receipt_number` varchar(255) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `vira_receipts_paid`
--

INSERT INTO `vira_receipts_paid` (`id`, `receipt_number`, `date`) VALUES
(1, '255', '2017-03-15 10:39:14');

-- --------------------------------------------------------

--
-- Table structure for table `vira_registration`
--

CREATE TABLE `vira_registration` (
  `id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `other_name` varchar(255) NOT NULL,
  `index_number` varchar(200) NOT NULL,
  `programme` varchar(200) NOT NULL,
  `level` varchar(100) NOT NULL,
  `session` varchar(200) NOT NULL,
  `faculty` varchar(100) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `visiting_supervisor_grade` int(100) NOT NULL,
  `company_supervisor_grade` int(11) NOT NULL,
  `visiting_supervisor_name` varchar(100) NOT NULL DEFAULT 'unassigned',
  `company_supervisor_name` varchar(100) NOT NULL DEFAULT 'unassigned',
  `company_supervisor_contact` varchar(11) NOT NULL,
  `visiting_supervisor_contact` varchar(11) NOT NULL,
  `attachment_region` varchar(100) NOT NULL DEFAULT 'unassigned'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `vira_registration`
--

INSERT INTO `vira_registration` (`id`, `first_name`, `last_name`, `other_name`, `index_number`, `programme`, `level`, `session`, `faculty`, `date`, `visiting_supervisor_grade`, `company_supervisor_grade`, `visiting_supervisor_name`, `company_supervisor_name`, `company_supervisor_contact`, `visiting_supervisor_contact`, `attachment_region`) VALUES
(1, 'Peter', 'Donk', '', '04/2014/0688D', 'Computer Science', '200', 'Evening', '', '2017-03-20 17:56:05', 0, 0, '', 'JohnDoe', '247732082', '0', ''),
(2, 'King', 'Shabo', '', '04/2014/0099D', 'Building Technology', '100', 'Morning', 'FAST', '2017-04-22 20:08:10', 100, 100, 'Peter Donk', 'PeterDonk2', '02477332082', '02477909090', 'Eastern Region'),
(3, 'Priscilla', 'Awuku', '', '04/2014/0666D', 'Computer Science', '200', 'Morning', 'FAST', '2017-04-23 05:29:47', 100, 100, 'Peter Donk', 'Sackey Tego', '4455004404', '0247732082', 'Eastern Region');

-- --------------------------------------------------------

--
-- Table structure for table `visiting_lecturers`
--

CREATE TABLE `visiting_lecturers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lecturer_name` varchar(255) NOT NULL,
  `lecturer_faculty` varchar(255) NOT NULL,
  `lecturer_phone_number` varchar(50) NOT NULL,
  `lecturer_region_residence` varchar(255) NOT NULL,
  `lecturer_department` varchar(255) NOT NULL,
  `lecturer_email` varchar(255) NOT NULL,
  `staff_id` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `visiting_assessment_password` varchar(255) DEFAULT NULL COMMENT 'Password for this supervisor to open Visiting Supervisor Assessment from student portal',
  `company_assessment_password` varchar(255) DEFAULT NULL COMMENT 'Password for company supervisors to open Company Supervisor Assessment from student portal',
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_id` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `visiting_lecturers`
-- Faculties: AGR, ARTS, COM, CIE, EDU, ENG, LAW, MED, SCI, SOC, VET. staff_id/password = can log in as institutional supervisor.
--

INSERT INTO `visiting_lecturers` (`id`, `lecturer_name`, `lecturer_faculty`, `lecturer_phone_number`, `lecturer_region_residence`, `lecturer_department`, `lecturer_email`, `staff_id`, `password`) VALUES
(1, 'Peter Donk', 'COM', '0247732082', 'Harare', 'Computer Science', 'peterdonk17@gmail.com', NULL, NULL),
(2, 'John Doe', 'SOC', '0247732082', 'Harare', 'Marketing', 'peterdonk17@gmail.com', NULL, NULL),
(3, 'Luis Vuiton', 'ENG', '0247732082', 'Harare', 'Computer Science', 'peterdonk17@gmail.com', NULL, NULL),
(4, 'Tim Woods', 'SCI', '0247732082', 'Harare', 'Marketing', 'peterdonk17@gmail.com', NULL, NULL),
(5, 'Luck Donk', 'VET', '0247732082', 'Harare', 'Computer Science', 'peterdonk17@gmail.com', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `visiting_supervisor_grade`
--

CREATE TABLE `visiting_supervisor_grade` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `user_index` varchar(100) NOT NULL,
  `specific_skill_1` varchar(100) NOT NULL,
  `specific_skill_1_score` int(11) NOT NULL,
  `specific_skill_2` varchar(100) NOT NULL,
  `specific_skill_2_score` int(11) NOT NULL,
  `specific_skill_3` varchar(100) NOT NULL,
  `specific_skill_3_score` int(11) NOT NULL,
  `specific_skill_4` varchar(100) NOT NULL,
  `specific_skill_4_score` int(11) NOT NULL,
  `specific_skill_5` varchar(100) NOT NULL,
  `specific_skill_5_score` int(5) NOT NULL,
  `ability_to_complete_work_on_time` int(5) NOT NULL,
  `ability_to_follow_instructions_carefully` int(5) NOT NULL,
  `ability_to_take_initiatives` int(5) NOT NULL,
  `ability_to_work_with_little_supervision` int(5) NOT NULL,
  `adherence_to_organizations_rules` int(5) NOT NULL,
  `adherence_to_safety` int(5) NOT NULL,
  `resourcefulness` int(5) NOT NULL,
  `attendance_to_work` int(5) NOT NULL,
  `punctuality` int(5) NOT NULL,
  `desire_to_work` int(5) NOT NULL,
  `williness_to_accept_new_ideas` int(5) NOT NULL,
  `relationship_with_colleagues` int(5) NOT NULL,
  `relationship_with_supervisors` int(5) NOT NULL,
  `ability_to_control_emotions_when_provoked` int(5) NOT NULL,
  `grade` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `visiting_supervisor_grade`
--

INSERT INTO `visiting_supervisor_grade` (`id`, `username`, `user_index`, `specific_skill_1`, `specific_skill_1_score`, `specific_skill_2`, `specific_skill_2_score`, `specific_skill_3`, `specific_skill_3_score`, `specific_skill_4`, `specific_skill_4_score`, `specific_skill_5`, `specific_skill_5_score`, `ability_to_complete_work_on_time`, `ability_to_follow_instructions_carefully`, `ability_to_take_initiatives`, `ability_to_work_with_little_supervision`, `adherence_to_organizations_rules`, `adherence_to_safety`, `resourcefulness`, `attendance_to_work`, `punctuality`, `desire_to_work`, `williness_to_accept_new_ideas`, `relationship_with_colleagues`, `relationship_with_supervisors`, `ability_to_control_emotions_when_provoked`, `grade`, `date`) VALUES
(2, 'MichealFaraday', '04/2014/0690D', 'Peter', 5, 'Is', 5, 'A', 5, 'Good', 5, 'Friendly', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 95, '2017-04-16 13:19:17'),
(3, 'LiousVuiton', '04/2013/0688D', 'we', 5, 'too', 5, 'never', 5, 'say', 5, 'die', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-18 18:25:59'),
(4, 'KingShabo', '04/2014/0099D', 'cv', 5, 'as', 5, 'rt', 5, 'qw', 5, 'op', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-22 20:16:03'),
(5, 'PriscillaAwuku', '04/2014/0666D', 'Wz', 5, 'Pz', 5, 'Qz', 5, 'Gz', 5, 'Oz', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-23 05:35:34'),
(6, 'LiousVuiton', '04/2013/0688D', 'a', 5, 'b', 5, 'c', 5, 'd', 5, 'e', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 100, '2017-04-23 15:32:55');

-- --------------------------------------------------------

--
-- Table structure for table `week1_table`
--

CREATE TABLE `week1_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week1_table`
--

INSERT INTO `week1_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week2_table`
--

CREATE TABLE `week2_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week2_table`
--

INSERT INTO `week2_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week3_table`
--

CREATE TABLE `week3_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week3_table`
--

INSERT INTO `week3_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week4_table`
--

CREATE TABLE `week4_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week4_table`
--

INSERT INTO `week4_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week5_table`
--

CREATE TABLE `week5_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week5_table`
--

INSERT INTO `week5_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week6_table`
--

CREATE TABLE `week6_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week6_table`
--

INSERT INTO `week6_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week7_table`
--

CREATE TABLE `week7_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week7_table`
--

INSERT INTO `week7_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week8_table`
--

CREATE TABLE `week8_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week8_table`
--

INSERT INTO `week8_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week9_table`
--

CREATE TABLE `week9_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week9_table`
--

INSERT INTO `week9_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

-- --------------------------------------------------------

--
-- Table structure for table `week10_table`
--

CREATE TABLE `week10_table` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `monday_job_assigned` longtext NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monday_special_skill_acquired` mediumtext NOT NULL,
  `tuesday_job_assigned` mediumtext NOT NULL,
  `tuesday_special_skill_acquired` mediumtext NOT NULL,
  `wednesday_job_assigned` mediumtext NOT NULL,
  `wednesday_special_skill_acquired` mediumtext NOT NULL,
  `thursday_job_assigned` mediumtext NOT NULL,
  `thursday_special_skill_acquired` mediumtext NOT NULL,
  `friday_job_assigned` mediumtext NOT NULL,
  `friday_special_skill_acquired` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `week10_table`
--

INSERT INTO `week10_table` (`id`, `username`, `index_number`, `monday_job_assigned`, `date`, `monday_special_skill_acquired`, `tuesday_job_assigned`, `tuesday_special_skill_acquired`, `wednesday_job_assigned`, `wednesday_special_skill_acquired`, `thursday_job_assigned`, `thursday_special_skill_acquired`, `friday_job_assigned`, `friday_special_skill_acquired`) VALUES
(54, 'Lious Vuiton', '04/2013/0688D', 'This', '2017-04-23 19:17:22', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown');

--
-- Table structure for table `student_contracts`
--

CREATE TABLE `student_contracts` (
  `id` int(11) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `contract_file` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `submission_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_comment` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `student_contracts`
--

INSERT INTO `student_contracts` (`id`, `student_name`, `index_number`, `contract_file`, `original_filename`, `submission_date`, `status`, `admin_comment`) VALUES
(1, 'Lious Vuiton', '04/2013/0688D', 'uploads/contracts/contract_04_2013_0688D_1640995200.pdf', 'industrial_contract.pdf', '2022-01-01 10:00:00', 'approved', 'Contract approved. Good documentation.');

--
-- Table structure for table `elogbook_entries`
--

CREATE TABLE `elogbook_entries` (
  `id` int(11) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `week_number` int(11) NOT NULL,
  `monday_job_assigned` longtext,
  `monday_skill_acquired` mediumtext,
  `tuesday_job_assigned` mediumtext,
  `tuesday_skill_acquired` mediumtext,
  `wednesday_job_assigned` mediumtext,
  `wednesday_skill_acquired` mediumtext,
  `thursday_job_assigned` mediumtext,
  `thursday_skill_acquired` mediumtext,
  `friday_job_assigned` mediumtext,
  `friday_skill_acquired` mediumtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `elogbook_entries`
--

INSERT INTO `elogbook_entries` (`id`, `student_name`, `index_number`, `week_number`, `monday_job_assigned`, `monday_skill_acquired`, `tuesday_job_assigned`, `tuesday_skill_acquired`, `wednesday_job_assigned`, `wednesday_skill_acquired`, `thursday_job_assigned`, `thursday_skill_acquired`, `friday_job_assigned`, `friday_skill_acquired`, `created_at`, `updated_at`) VALUES
(1, 'Lious Vuiton', '04/2013/0688D', 1, 'This', 'A', 'Lious', 'Vuiton', 'The', 'Only', 'Stanger', 'Nanger', 'In', 'Lown', '2017-04-23 19:17:22', '2017-04-23 19:17:22');

--
-- Table structure for table `orientation_checklist`
--

CREATE TABLE `orientation_checklist` (
  `id` int(11) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `index_number` varchar(100) NOT NULL,
  `host_institution` varchar(255) DEFAULT NULL,
  `general_staff_introduction` tinyint(1) NOT NULL DEFAULT 0,
  `general_facilities_location` tinyint(1) NOT NULL DEFAULT 0,
  `general_tea_coffee_lunch` tinyint(1) NOT NULL DEFAULT 0,
  `general_transport_arrangements` tinyint(1) NOT NULL DEFAULT 0,
  `general_dress_code` tinyint(1) NOT NULL DEFAULT 0,
  `general_code_of_conduct` tinyint(1) NOT NULL DEFAULT 0,
  `general_policies_regulations` tinyint(1) NOT NULL DEFAULT 0,
  `work_workspace` tinyint(1) NOT NULL DEFAULT 0,
  `work_duty_arrangements` tinyint(1) NOT NULL DEFAULT 0,
  `work_schedule_meetings` tinyint(1) NOT NULL DEFAULT 0,
  `work_first_meeting_supervisor` tinyint(1) NOT NULL DEFAULT 0,
  `health_emergency_procedures` tinyint(1) NOT NULL DEFAULT 0,
  `health_safety_policy` tinyint(1) NOT NULL DEFAULT 0,
  `health_first_aid_arrangements` tinyint(1) NOT NULL DEFAULT 0,
  `health_fire_procedures` tinyint(1) NOT NULL DEFAULT 0,
  `health_accident_reporting` tinyint(1) NOT NULL DEFAULT 0,
  `health_manual_handling` tinyint(1) NOT NULL DEFAULT 0,
  `health_safety_regulations` tinyint(1) NOT NULL DEFAULT 0,
  `health_equipment_instruction` tinyint(1) NOT NULL DEFAULT 0,
  `others_student_info_form` tinyint(1) NOT NULL DEFAULT 0,
  `others_social_media_guidelines` tinyint(1) NOT NULL DEFAULT 0,
  `others_it_systems_equipment` tinyint(1) NOT NULL DEFAULT 0,
  `student_signature` varchar(255) DEFAULT NULL,
  `student_signature_date` date DEFAULT NULL,
  `host_supervisor_signature` varchar(255) DEFAULT NULL,
  `host_supervisor_date` date DEFAULT NULL,
  `wrl_coordinator_signature` varchar(255) DEFAULT NULL,
  `wrl_coordinator_date` date DEFAULT NULL,
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `orientation_checklist`
--

INSERT INTO `orientation_checklist` (`id`, `student_name`, `index_number`, `host_institution`, `general_staff_introduction`, `general_facilities_location`, `general_tea_coffee_lunch`, `general_transport_arrangements`, `general_dress_code`, `general_code_of_conduct`, `general_policies_regulations`, `work_workspace`, `work_duty_arrangements`, `work_schedule_meetings`, `work_first_meeting_supervisor`, `health_emergency_procedures`, `health_safety_policy`, `health_first_aid_arrangements`, `health_fire_procedures`, `health_accident_reporting`, `health_manual_handling`, `health_safety_regulations`, `health_equipment_instruction`, `others_student_info_form`, `others_social_media_guidelines`, `others_it_systems_equipment`, `completed_at`, `last_updated`) VALUES
(1, 'Lious Vuiton', '04/2013/0688D', 'Sample Company', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '2022-01-15 10:00:00', '2022-01-15 10:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assigned_lecturers`
--
ALTER TABLE `assigned_lecturers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `company_supervisor_grade`
--
ALTER TABLE `company_supervisor_grade`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `industrial_registration`
--
ALTER TABLE `industrial_registration`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `registered_students`
--
ALTER TABLE `registered_students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students_assumption`
--
ALTER TABLE `students_assumption`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `institutional_supervisor_students` (PK already in CREATE TABLE)
--
ALTER TABLE `institutional_supervisor_students`
  ADD KEY `supervisor_id` (`supervisor_id`),
  ADD KEY `student_index` (`student_index`);

--
-- Indexes for table `supervisors_login`
--
ALTER TABLE `supervisors_login`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_admin`
--
ALTER TABLE `system_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vira_receipts_paid`
--
ALTER TABLE `vira_receipts_paid`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vira_registration`
--
ALTER TABLE `vira_registration`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `visiting_lecturers`
--
ALTER TABLE `visiting_lecturers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `visiting_supervisor_grade`
--
ALTER TABLE `visiting_supervisor_grade`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week1_table`
--
ALTER TABLE `week1_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week2_table`
--
ALTER TABLE `week2_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week3_table`
--
ALTER TABLE `week3_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week4_table`
--
ALTER TABLE `week4_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week5_table`
--
ALTER TABLE `week5_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week6_table`
--
ALTER TABLE `week6_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week7_table`
--
ALTER TABLE `week7_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week8_table`
--
ALTER TABLE `week8_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week9_table`
--
ALTER TABLE `week9_table`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `week10_table`
--
ALTER TABLE `week10_table`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assigned_lecturers`
--
ALTER TABLE `assigned_lecturers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT for table `company_supervisor_grade`
--
ALTER TABLE `company_supervisor_grade`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `industrial_registration`
--
ALTER TABLE `industrial_registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `registered_students`
--
ALTER TABLE `registered_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `students_assumption`
--
ALTER TABLE `students_assumption`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;
--
-- AUTO_INCREMENT for table `institutional_supervisor_students`
--
ALTER TABLE `institutional_supervisor_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `supervisors_login`
--
ALTER TABLE `supervisors_login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `system_admin`
--
ALTER TABLE `system_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `vira_receipts_paid`
--
ALTER TABLE `vira_receipts_paid`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `vira_registration`
--
ALTER TABLE `vira_registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `visiting_lecturers`
--
ALTER TABLE `visiting_lecturers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `visiting_supervisor_grade`
--
ALTER TABLE `visiting_supervisor_grade`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT for table `week1_table`
--
ALTER TABLE `week1_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week2_table`
--
ALTER TABLE `week2_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week3_table`
--
ALTER TABLE `week3_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week4_table`
--
ALTER TABLE `week4_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week5_table`
--
ALTER TABLE `week5_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week6_table`
--
ALTER TABLE `week6_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week7_table`
--
ALTER TABLE `week7_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week8_table`
--
ALTER TABLE `week8_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week9_table`
--
ALTER TABLE `week9_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- AUTO_INCREMENT for table `week10_table`
--
ALTER TABLE `week10_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;
--
-- Indexes for table `student_contracts`
--
ALTER TABLE `student_contracts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_number` (`index_number`);

--
-- AUTO_INCREMENT for table `student_contracts`
--
ALTER TABLE `student_contracts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- Indexes for table `elogbook_entries`
--
ALTER TABLE `elogbook_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_number` (`index_number`),
  ADD KEY `week_number` (`week_number`),
  ADD KEY `student_week` (`index_number`,`week_number`);

--
-- AUTO_INCREMENT for table `elogbook_entries`
--
ALTER TABLE `elogbook_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- Indexes for table `orientation_checklist`
--
ALTER TABLE `orientation_checklist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `index_number` (`index_number`);

--
-- AUTO_INCREMENT for table `orientation_checklist`
--
ALTER TABLE `orientation_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
