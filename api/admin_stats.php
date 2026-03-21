<?php
$stats = [
    'registeredStudents' => 0,
    'orientationChecklists' => 0,
    'elogbooksSubmitted' => 0,
    'contractsPending' => 0,
    'contractsApproved' => 0,
    'reportsSubmitted' => 0,
    'assumptionsCount' => 0,
    'visitingScoresCount' => 0,
    'companyScoresCount' => 0,
];

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM industrial_registration");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['registeredStudents'] = (int)$row['c'];

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM orientation_checklist");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['orientationChecklists'] = (int)$row['c'];

$r = mysqli_query($conn, "SELECT COUNT(DISTINCT index_number) AS c FROM elogbook_entries");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['elogbooksSubmitted'] = (int)$row['c'];

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM student_contracts WHERE status = 'pending'");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['contractsPending'] = (int)$row['c'];

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM student_contracts WHERE status = 'approved'");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['contractsApproved'] = (int)$row['c'];

// Reports: count submissions from student_reports table (not just files).
mysqli_query(
    $conn,
    "CREATE TABLE IF NOT EXISTS student_reports (
      id INT(11) NOT NULL AUTO_INCREMENT,
      student_name VARCHAR(255) NOT NULL,
      index_number VARCHAR(100) NOT NULL,
      report_files_json LONGTEXT NOT NULL,
      original_filenames_json LONGTEXT NOT NULL,
      submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      admin_comment TEXT,
      PRIMARY KEY (id),
      UNIQUE KEY index_number_unique (index_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1"
);

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM student_reports");
if ($r && $row = mysqli_fetch_assoc($r)) {
    $stats['reportsSubmitted'] = (int)($row['c'] ?? 0);
}

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM students_assumption");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['assumptionsCount'] = (int)$row['c'];

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM visiting_supervisor_grade");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['visitingScoresCount'] = (int)$row['c'];

$r = mysqli_query($conn, "SELECT COUNT(*) AS c FROM company_supervisor_grade");
if ($r && $row = mysqli_fetch_assoc($r)) $stats['companyScoresCount'] = (int)$row['c'];

echo json_encode($stats);
