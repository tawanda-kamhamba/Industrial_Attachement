<?php
require_once __DIR__ . '/grading_helpers.php';

$filter = isset($_GET['filter']) ? mysqli_real_escape_string($conn, $_GET['filter']) : '';
$search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';

$where = '1=1';
if ($filter && $search !== '') {
    $like = "'%" . $search . "%'";
    switch ($filter) {
        case 'first_name': $where = "first_name LIKE $like"; break;
        case 'last_name': $where = "last_name LIKE $like"; break;
        case 'index_number': $where = "index_number LIKE $like"; break;
        case 'programme': $where = "programme LIKE $like"; break;
        case 'level': $where = "level LIKE $like"; break;
        case 'session': $where = "session LIKE $like"; break;
    }
}

$q = "SELECT index_number, first_name, last_name, programme, level, session FROM industrial_registration WHERE $where ORDER BY index_number";
$res = mysqli_query($conn, $q);
$list = [];
while ($row = mysqli_fetch_assoc($res)) {
    $list[] = [
        'index_number' => $row['index_number'],
        'first_name' => $row['first_name'],
        'last_name' => $row['last_name'],
        'programme' => $row['programme'] ?? '',
        'level' => $row['level'] ?? '',
        'session' => $row['session'] ?? '',
    ];
}

$indexes = array_column($list, 'index_number');
$grades = iasms_load_final_grades_for_indexes($conn, $indexes);
iasms_attach_grades_to_rows($list, $grades);

echo json_encode($list);
