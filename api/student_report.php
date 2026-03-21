<?php
/**
 * Student report upload.
 * POST = upload one or more .doc/.docx files for current student.
 * Reports are stored as files in submit_report/uploads/.
 * Supervisor/admin report lists match by the filename base, so students should name the file using their index number.
 */

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

$index_number = $_SESSION['index_number'] ?? '';
if ($index_number === '') {
    echo json_encode(['success' => false, 'error' => 'Session invalid']);
    http_response_code(401);
    return;
}

// Create DB table on demand.
// Policy: students can submit (and effectively "edit") the report only once.
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

// Only POST for uploads (no report status endpoint for now).
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    return;
}

if (!isset($_FILES['file']) || empty($_FILES['file']['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please select report files to upload.']);
    return;
}

$allowed_ext = ['doc', 'docx', 'pdf'];

$baseDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'submit_report' . DIRECTORY_SEPARATOR . 'uploads';
if (!is_dir($baseDir)) {
    @mkdir($baseDir, 0755, true);
}

$files = $_FILES['file'];

// Normalize to arrays.
$names = is_array($files['name']) ? $files['name'] : [$files['name']];
$tmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
$errors = is_array($files['error']) ? $files['error'] : [$files['error']];

$uploaded = [];
$skipped = [];
$originalBases = [];

// Enforce "only submit once" (DB row OR any existing file whose base name matches the index number).
$idxEsc = mysqli_real_escape_string($conn, $index_number);
$alreadySubmitted = false;
$checkRes = @mysqli_query($conn, "SELECT id FROM student_reports WHERE index_number='$idxEsc' LIMIT 1");
if ($checkRes && mysqli_num_rows($checkRes) > 0) {
    $alreadySubmitted = true;
} else {
    if (is_dir($baseDir)) {
        $entries = array_diff(scandir($baseDir), ['.', '..']);
        foreach ($entries as $entry) {
            $fullPath = $baseDir . DIRECTORY_SEPARATOR . $entry;
            if (!is_file($fullPath)) continue;
            $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
            if (!in_array($ext, $allowed_ext, true)) continue;
            $basename = pathinfo($entry, PATHINFO_FILENAME);
            if ($basename === $index_number) {
                $alreadySubmitted = true;
                break;
            }
        }
    }
}

if ($alreadySubmitted) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'You have already submitted your report. Report submissions are final.']);
    return;
}

for ($i = 0; $i < count($names); $i++) {
    if (!isset($tmpNames[$i]) || !isset($errors[$i]) || (int)$errors[$i] !== UPLOAD_ERR_OK) {
        $skipped[] = $names[$i] ?? 'unknown';
        continue;
    }

    $origName = (string)($names[$i] ?? '');
    $origBase = basename($origName); // prevent any path traversal
    $ext = strtolower(pathinfo($origBase, PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed_ext, true)) {
        $skipped[] = $origName;
        continue;
    }

    // Preserve student-provided base name (legacy behavior).
    // Admin/supervisor filtering relies on the filename base matching the student index number.
    $newFilename = $origBase;
    $absolutePath = $baseDir . DIRECTORY_SEPARATOR . $newFilename;

    // Prevent overwriting with weird filenames; overwrite is fine for same index/ext.
    if (!move_uploaded_file($tmpNames[$i], $absolutePath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error uploading one of the report files.']);
        return;
    }

    $uploaded[] = $newFilename;
    $originalBases[] = $origBase;
}

if (count($uploaded) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No valid report files were uploaded.']);
    return;
}

// Store submission record (for "submit once" enforcement).
$studentName = $_SESSION['name'] ?? '';
$studentNameEsc = mysqli_real_escape_string($conn, $studentName);
$reportFilesJsonEsc = mysqli_real_escape_string($conn, json_encode($uploaded));
$originalFilenamesJsonEsc = mysqli_real_escape_string($conn, json_encode($originalBases));

@mysqli_query(
    $conn,
    "INSERT INTO student_reports (student_name, index_number, report_files_json, original_filenames_json, status)
     VALUES ('$studentNameEsc', '$idxEsc', '$reportFilesJsonEsc', '$originalFilenamesJsonEsc', 'pending')"
);

echo json_encode([
    'success' => true,
    'message' => 'Report uploaded successfully.',
    'uploaded' => $uploaded,
    'skipped' => $skipped,
]);
exit;

