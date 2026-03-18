<?php
/**
 * GET: All scores for assigned students — company supervisor score + current supervisor's visit scores.
 * Route: /supervisor/scores
 */

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

require_once __DIR__ . '/supervisor_helpers.php';

$assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
if (empty($assigned)) {
    echo json_encode([]);
    return;
}

$supervisor_name = (string)($_SESSION['name'] ?? '');
$vsg_user = $supervisor_name !== '' ? mysqli_real_escape_string($conn, str_replace(' ', '', $supervisor_name)) : '';

// Ensure visit_number exists on visiting_supervisor_grade
$colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
    @mysqli_query($conn, "ALTER TABLE visiting_supervisor_grade ADD COLUMN visit_number TINYINT(1) NOT NULL DEFAULT 1 AFTER user_index");
}

$in_list = "'" . implode("','", array_map(function ($idx) use ($conn) {
    return mysqli_real_escape_string($conn, $idx);
}, $assigned)) . "'";

// Student details + company score from industrial_registration + students_assumption
$q = "SELECT i.index_number AS student_index,
       i.first_name,
       i.last_name,
       i.company_supervisor_grade,
       COALESCE(sa.company_name,'') AS company_name,
       COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS company_region
FROM industrial_registration i
LEFT JOIN students_assumption sa ON sa.index_number = i.index_number
WHERE i.index_number IN ($in_list)
ORDER BY i.index_number";
$res = mysqli_query($conn, $q);
$by_index = [];
while ($row = mysqli_fetch_assoc($res)) {
    $idx = $row['student_index'] ?? '';
    if ($idx === '') continue;
    $by_index[$idx] = [
        'student_index' => $idx,
        'first_name' => $row['first_name'] ?? '',
        'last_name' => $row['last_name'] ?? '',
        'company_name' => $row['company_name'] ?? '',
        'company_region' => $row['company_region'] ?? '',
        'company_supervisor_grade' => $row['company_supervisor_grade'] !== null && $row['company_supervisor_grade'] !== '' ? (int)$row['company_supervisor_grade'] : null,
        'my_first_visit_grade' => null,
        'my_second_visit_grade' => null,
    ];
}

// Current supervisor's visit scores from visiting_supervisor_grade
if ($vsg_user !== '') {
    $vq = "SELECT user_index, visit_number, grade FROM visiting_supervisor_grade WHERE username='$vsg_user' AND user_index IN ($in_list)";
    $vr = mysqli_query($conn, $vq);
    if ($vr) {
        while ($vrow = mysqli_fetch_assoc($vr)) {
            $idx = $vrow['user_index'] ?? '';
            if ($idx === '' || !isset($by_index[$idx])) continue;
            $vn = (int)($vrow['visit_number'] ?? 1);
            $g = $vrow['grade'] !== null && $vrow['grade'] !== '' ? (int)$vrow['grade'] : null;
            if ($vn === 1) {
                $by_index[$idx]['my_first_visit_grade'] = $g;
            } elseif ($vn === 2) {
                $by_index[$idx]['my_second_visit_grade'] = $g;
            }
        }
    }
}

echo json_encode(array_values($by_index));
