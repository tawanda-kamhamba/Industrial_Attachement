<?php
require_once __DIR__ . '/supervisor_helpers.php';
require_once __DIR__ . '/grading_helpers.php';

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

$in_list = "'" . implode(
    "','",
    array_map(
        static function (string $idx) use ($conn): string {
            return mysqli_real_escape_string($conn, $idx);
        },
        $assigned
    )
) . "'";

$q = "SELECT student_name, index_number, COUNT(*) AS total_weeks, MIN(created_at) AS first_submission, MAX(updated_at) AS last_updated
      FROM elogbook_entries
      WHERE index_number IN ($in_list)
      GROUP BY index_number, student_name
      ORDER BY last_updated DESC
      LIMIT 200";
$res = mysqli_query($conn, $q);
$list = [];
while ($row = mysqli_fetch_assoc($res)) {
    $list[] = [
        'student_name' => $row['student_name'] ?? '',
        'index_number' => $row['index_number'] ?? '',
        'total_weeks' => (int)$row['total_weeks'],
        'first_submission' => $row['first_submission'] ?? null,
        'last_updated' => $row['last_updated'] ?? null,
    ];
}

$indexes = array_column($list, 'index_number');
$grades = iasms_load_final_grades_for_indexes(
    $conn,
    $indexes,
    str_replace(' ', '', (string)($_SESSION['name'] ?? '')) ?: null
);
iasms_attach_grades_to_rows($list, $grades);

echo json_encode($list);

