<?php
/**
 * GET: Full profile for one student. Only allowed if student is assigned to current supervisor.
 * Route: /supervisor/student-profile/{index_number}
 */

require_once __DIR__ . '/supervisor_helpers.php';

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

$index_number = isset($segments[2]) ? trim(urldecode($segments[2])) : '';
if ($index_number === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Index number required']);
    return;
}

$assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
if (!in_array($index_number, $assigned, true)) {
    // Fallback authorization for admin-specific per-student assignment.
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $sid = (int)($_SESSION['user_id'] ?? 0);
    $staff_id = (string)($_SESSION['staff_id'] ?? '');
    $name_esc = mysqli_real_escape_string($conn, (string)($_SESSION['name'] ?? ''));

    $directAllowed = false;
    // 1) Direct lecturer_id match (most common case).
    if ($sid > 0) {
        $directRes = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments
             WHERE index_number='$idx_esc'
               AND lecturer_id=$sid
             LIMIT 1"
        );
        $directAllowed = $directRes && mysqli_num_rows($directRes) > 0;
    }

    // 2) Direct match by lecturer name (covers potential lecturer_id/name storage inconsistencies).
    if (!$directAllowed && $name_esc !== '') {
        $directRes2 = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments ssa
             JOIN visiting_lecturers vl ON vl.id = ssa.lecturer_id
             WHERE ssa.index_number='$idx_esc'
               AND BINARY vl.lecturer_name='$name_esc'
             LIMIT 1"
        );
        $directAllowed = $directRes2 && mysqli_num_rows($directRes2) > 0;
    }

    // 3) Match by staff_id if stored in lecturer_id column.
    if (!$directAllowed && $staff_id !== '') {
        $staffEsc = mysqli_real_escape_string($conn, $staff_id);
        $directRes3 = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments
             WHERE index_number='$idx_esc'
               AND lecturer_id='$staffEsc'
             LIMIT 1"
        );
        $directAllowed = $directRes3 && mysqli_num_rows($directRes3) > 0;
    }

    if (!$directAllowed) {
        http_response_code(404);
        echo json_encode(['error' => 'Student not assigned to you']);
        return;
    }
}

$idx = mysqli_real_escape_string($conn, $index_number);

// Registration (industrial_registration)
$reg = null;
$rq = "SELECT first_name, last_name, other_name, index_number, programme, level, session, faculty, date,
       company_supervisor_name, company_supervisor_contact, attachment_region,
       visiting_supervisor_grade, company_supervisor_grade
       FROM industrial_registration WHERE index_number='$idx' LIMIT 1";
$rr = mysqli_query($conn, $rq);
if ($rr && mysqli_num_rows($rr) === 1) {
    $reg = mysqli_fetch_assoc($rr);
}

// Assumption (students_assumption)
$assump = null;
$aq = "SELECT company_name, supervisor_name, supervisor_contact, supervisor_email, company_region, company_address
       FROM students_assumption WHERE index_number='$idx' LIMIT 1";
$ar = mysqli_query($conn, $aq);
if ($ar && mysqli_num_rows($ar) === 1) {
    $assump = mysqli_fetch_assoc($ar);
}

// Contract (latest) — explicit shape so JSON always includes numeric `id`
$contract = null;
$cq = "SELECT id, original_filename, status, submission_date, admin_comment
       FROM student_contracts WHERE index_number='$idx' ORDER BY submission_date DESC LIMIT 1";
$cr = mysqli_query($conn, $cq);
if ($cr && mysqli_num_rows($cr) > 0) {
    $crow = mysqli_fetch_assoc($cr);
    if (is_array($crow)) {
        $rawId = $crow['id'] ?? $crow['ID'] ?? null;
        $cid = $rawId !== null && $rawId !== '' ? (int)$rawId : 0;
        if ($cid > 0) {
            $contract = [
                'id' => $cid,
                'original_filename' => $crow['original_filename'] ?? '',
                'status' => $crow['status'] ?? 'pending',
                'submission_date' => $crow['submission_date'] ?? null,
                'admin_comment' => $crow['admin_comment'] ?? null,
            ];
        }
    }
}

// Orientation (summary for this student)
$orientation = null;
$oq = "SELECT id, completed_at FROM orientation_checklist WHERE index_number='$idx' ORDER BY completed_at DESC LIMIT 1";
$or = mysqli_query($conn, $oq);
if ($or && mysqli_num_rows($or) === 1) {
    $row = mysqli_fetch_assoc($or);
    $orientation = ['id' => (int)$row['id'], 'completed_at' => $row['completed_at'] ?? null];
}

// Logbook: count and latest week
$logbook = ['count' => 0, 'latest_week' => null];
$lq = "SELECT COUNT(*) AS c, MAX(week_number) AS max_week FROM elogbook_entries WHERE index_number='$idx'";
$lr = mysqli_query($conn, $lq);
if ($lr && ($row = mysqli_fetch_assoc($lr))) {
    $logbook['count'] = (int)($row['c'] ?? 0);
    $logbook['latest_week'] = $row['max_week'] !== null ? (int)$row['max_week'] : null;
}

// Report: submitted flag + viewable filenames
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

$report_files = [];
$report_original_filenames = [];

// Table-driven (new) submissions
$r = @mysqli_query(
    $conn,
    "SELECT report_files_json, original_filenames_json
     FROM student_reports
     WHERE index_number='$idx'
     LIMIT 1"
);
if ($r && mysqli_num_rows($r) > 0) {
    $row = mysqli_fetch_assoc($r);
    $filesJson = $row['report_files_json'] ?? '[]';
    $origJson = $row['original_filenames_json'] ?? '[]';

    $decodedFiles = json_decode($filesJson, true);
    if (is_array($decodedFiles)) $report_files = array_values(array_filter(array_map('strval', $decodedFiles)));

    $decodedOrig = json_decode($origJson, true);
    if (is_array($decodedOrig)) $report_original_filenames = array_values(array_filter(array_map('strval', $decodedOrig)));
}

// Legacy fallback (older uploads before the table existed)
if (empty($report_files)) {
    $uploads_dir = dirname(__DIR__) . '/submit_report/uploads';
    if (is_dir($uploads_dir)) {
        $files = array_diff(scandir($uploads_dir), ['.', '..']);
        $base_want = $index_number;
        $base_alt = str_replace(['/', '\\'], ['_', '_'], $index_number);
        foreach ($files as $f) {
            $path = $uploads_dir . DIRECTORY_SEPARATOR . $f;
            if (!is_file($path)) continue;
            $base = pathinfo($f, PATHINFO_FILENAME);
            if ($base === $base_want || $base === $base_alt) {
                $report_files[] = $f;
                $report_original_filenames[] = $f;
                break; // only need the first match for "single submission"
            }
        }
    }
}

$report_submitted = !empty($report_files);

// Current supervisor's own visit scores (so they can see and update only their scores)
$my_visit_scores = ['first_visit_grade' => null, 'second_visit_grade' => null];
$supervisor_name = (string)($_SESSION['name'] ?? '');
if ($supervisor_name !== '') {
    $vsg_user = mysqli_real_escape_string($conn, str_replace(' ', '', $supervisor_name));
    $colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
    if ($colCheck && mysqli_num_rows($colCheck) > 0) {
        $vq = "SELECT visit_number, grade FROM visiting_supervisor_grade WHERE user_index='$idx' AND username='$vsg_user'";
        $vr = mysqli_query($conn, $vq);
        if ($vr) {
            while ($vrow = mysqli_fetch_assoc($vr)) {
                $vn = (int)($vrow['visit_number'] ?? 1);
                $g = $vrow['grade'] !== null && $vrow['grade'] !== '' ? (int)$vrow['grade'] : null;
                if ($vn === 1) {
                    $my_visit_scores['first_visit_grade'] = $g;
                } elseif ($vn === 2) {
                    $my_visit_scores['second_visit_grade'] = $g;
                }
            }
        }
    }
}

$out = [
    'index_number' => $index_number,
    'registration' => $reg,
    'assumption' => $assump,
    'contract' => $contract,
    'orientation' => $orientation,
    'logbook' => $logbook,
    'report_submitted' => $report_submitted,
    'report_files' => $report_files,
    'report_original_filenames' => $report_original_filenames,
    'my_visit_scores' => $my_visit_scores,
];

echo json_encode($out);
