<?php
require_once __DIR__ . '/grading_helpers.php';

$filter = isset($_GET['filter']) ? mysqli_real_escape_string($conn, $_GET['filter']) : '';
$search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';

$where = '1=1';
if ($filter && $search !== '') {
    $like = "'%" . $search . "%'";
    if ($filter === 'Student Name') $where = "student_name LIKE $like";
    elseif ($filter === 'Index Number') $where = "index_number LIKE $like";
}

$q = "SELECT student_name, index_number, COUNT(*) AS total_weeks, MIN(created_at) AS first_submission, MAX(updated_at) AS last_updated
      FROM elogbook_entries WHERE $where GROUP BY index_number, student_name ORDER BY last_updated DESC LIMIT 200";
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
$grades = iasms_load_final_grades_for_indexes($conn, $indexes);
iasms_attach_grades_to_rows($list, $grades);

echo json_encode($list);
