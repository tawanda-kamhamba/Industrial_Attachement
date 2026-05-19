<?php
/**
 * Admin reports list.
 * Reports are stored in student_reports table and actual files live in submit_report/uploads/.
 */
require_once __DIR__ . '/grading_helpers.php';

// Ensure table exists (same schema as upload endpoint).
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

$uploadsDir = dirname(__DIR__) . '/submit_report/uploads';

$list = [];
$res = mysqli_query(
    $conn,
    "SELECT index_number, student_name, submission_date, report_files_json
     FROM student_reports
     ORDER BY submission_date DESC"
);

if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $idx = $row['index_number'] ?? '';
        $filesJson = $row['report_files_json'] ?? '[]';
        $files = json_decode($filesJson, true);
        if (!is_array($files)) $files = [];

        foreach ($files as $f) {
            $filename = (string)$f;
            $path = $uploadsDir . DIRECTORY_SEPARATOR . $filename;
            if (!is_file($path)) {
                // If DB says it exists but file is missing, skip from file list.
                continue;
            }
            $list[] = [
                'name' => $filename,
                'index_number' => $idx,
                'student_name' => $row['student_name'] ?? '',
                'size' => filesize($path),
                'modified' => date('Y-m-d H:i:s', filemtime($path)),
            ];
        }
    }
}

// Backward compatibility: if no rows were found in student_reports yet,
// fall back to scanning legacy uploads.
if (empty($list) && is_dir($uploadsDir)) {
    $files = array_diff(scandir($uploadsDir), ['.', '..']);
    foreach ($files as $f) {
        $path = $uploadsDir . DIRECTORY_SEPARATOR . $f;
        if (!is_file($path)) continue;
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (in_array($ext, ['doc', 'docx', 'pdf'], true)) {
            $list[] = [
                'name' => $f,
                'size' => filesize($path),
                'modified' => date('Y-m-d H:i:s', filemtime($path)),
            ];
        }
    }
}

// The admin UI only needs file metadata; keep sorting by modified desc.
usort($list, function ($a, $b) {
    return strcmp($b['modified'], $a['modified']);
});

$indexes = array_values(array_unique(array_filter(array_column($list, 'index_number'))));
$grades = iasms_load_final_grades_for_indexes($conn, $indexes);
iasms_attach_grades_to_rows($list, $grades);

echo json_encode($list);
