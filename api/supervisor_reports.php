<?php
require_once __DIR__ . '/supervisor_helpers.php';

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

$assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
if (empty($assigned)) {
    echo json_encode([]);
    return;
}

// Ensure report table exists (same schema as upload endpoint).
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

// Build index_number IN (...) query.
$inList = array_map(
    static function (string $idx) use ($conn): string {
        return "'" . mysqli_real_escape_string($conn, $idx) . "'";
    },
    $assigned
);
$inSql = implode(',', $inList);

$list = [];
$res = mysqli_query(
    $conn,
    "SELECT index_number, report_files_json
     FROM student_reports
     WHERE index_number IN ($inSql)
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
            if (!is_file($path)) continue;

            $list[] = [
                'name' => $filename,
                'size' => filesize($path),
                'modified' => date('Y-m-d H:i:s', filemtime($path)),
                'index_number' => $idx,
            ];
        }
    }
}

// Backward compatibility: if no DB-backed reports are available yet,
// fall back to scanning legacy uploads directory.
if (empty($list) && is_dir($uploadsDir)) {
    $assignedMap = [];
    foreach ($assigned as $idx) $assignedMap[$idx] = true;

    $files = array_diff(scandir($uploadsDir), ['.', '..']);
    foreach ($files as $f) {
        $path = $uploadsDir . DIRECTORY_SEPARATOR . $f;
        if (!is_file($path)) continue;
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, ['doc', 'docx', 'pdf'], true)) continue;
        $basename = pathinfo($f, PATHINFO_FILENAME);
        if (!isset($assignedMap[$basename])) continue;

        $list[] = [
            'name' => $f,
            'size' => filesize($path),
            'modified' => date('Y-m-d H:i:s', filemtime($path)),
            'index_number' => $basename,
        ];
    }
}

usort($list, static function (array $a, array $b): int {
    return strcmp($b['modified'], $a['modified']);
});

echo json_encode($list);

