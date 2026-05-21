<?php
require_once __DIR__ . '/visit_schedule_helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SESSION['role'] ?? '') !== 'student') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$index_number = trim((string)($_SESSION['index_number'] ?? ''));
if ($index_number === '') {
    http_response_code(401);
    echo json_encode(['error' => 'Session invalid']);
    exit;
}

iasms_ensure_visit_schedule_tables($conn);

$lecturer_id = iasms_visit_schedule_lecturer_id_for_student($conn, $index_number);
if ($lecturer_id <= 0) {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode([
            'supervisor' => null,
            'availability' => [],
            'my_selections' => [],
            'message' => 'No institutional supervisor assigned yet.',
        ]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'No institutional supervisor assigned yet']);
    exit;
}

$idx_esc = mysqli_real_escape_string($conn, $index_number);

$sup_q = "SELECT lecturer_name, lecturer_department, staff_id
          FROM visiting_lecturers WHERE id=$lecturer_id LIMIT 1";
$sup_res = mysqli_query($conn, $sup_q);
$supervisor = null;
if ($sup_res && mysqli_num_rows($sup_res) === 1) {
    $row = mysqli_fetch_assoc($sup_res);
    $supervisor = [
        'lecturer_id' => $lecturer_id,
        'lecturer_name' => $row['lecturer_name'] ?? '',
        'lecturer_department' => $row['lecturer_department'] ?? '',
        'staff_id' => $row['staff_id'] ?? null,
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $avail_q = "SELECT id, DATE_FORMAT(visit_date, '%Y-%m-%d') AS visit_date, published_at
                FROM supervisor_visit_availability
                WHERE lecturer_id=$lecturer_id AND published_at IS NOT NULL
                ORDER BY visit_date ASC";
    $avail_res = mysqli_query($conn, $avail_q);

    $availability = [];
    while ($avail_res && ($row = mysqli_fetch_assoc($avail_res))) {
        $availability[] = [
            'id' => (int)($row['id'] ?? 0),
            'date' => (string)($row['visit_date'] ?? ''),
            'published_at' => $row['published_at'] ?? null,
        ];
    }

    $my_q = "SELECT DATE_FORMAT(svs.visit_date, '%Y-%m-%d') AS visit_date, svs.availability_id, svs.selected_at
             FROM student_visit_selections svs
             INNER JOIN supervisor_visit_availability sva ON sva.id = svs.availability_id
             WHERE svs.student_index_number='$idx_esc' AND sva.lecturer_id=$lecturer_id
             ORDER BY svs.visit_date ASC";
    $my_res = mysqli_query($conn, $my_q);
    $my_selections = [];
    while ($my_res && ($row = mysqli_fetch_assoc($my_res))) {
        $my_selections[] = [
            'availability_id' => (int)($row['availability_id'] ?? 0),
            'date' => (string)($row['visit_date'] ?? ''),
            'selected_at' => $row['selected_at'] ?? null,
        ];
    }

    echo json_encode([
        'supervisor' => $supervisor,
        'availability' => $availability,
        'my_selections' => $my_selections,
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$dates = iasms_visit_schedule_normalize_dates((array)($body['dates'] ?? []));

$allowed_map = [];
$allow_q = "SELECT id, visit_date FROM supervisor_visit_availability
            WHERE lecturer_id=$lecturer_id AND published_at IS NOT NULL";
$allow_res = mysqli_query($conn, $allow_q);
while ($allow_res && ($row = mysqli_fetch_assoc($allow_res))) {
    $d = (string)($row['visit_date'] ?? '');
    $id = (int)($row['id'] ?? 0);
    if ($d !== '' && $id > 0) {
        $allowed_map[$d] = $id;
    }
}

foreach ($dates as $d) {
    if (!isset($allowed_map[$d])) {
        http_response_code(400);
        echo json_encode(['error' => 'One or more dates are not available for booking', 'invalid_date' => $d]);
        exit;
    }
}

@mysqli_query(
    $conn,
    "DELETE svs FROM student_visit_selections svs
     INNER JOIN supervisor_visit_availability sva ON sva.id = svs.availability_id
     WHERE svs.student_index_number='$idx_esc' AND sva.lecturer_id=$lecturer_id"
);

foreach ($dates as $d) {
    $avail_id = (int)$allowed_map[$d];
    $date_esc = mysqli_real_escape_string($conn, $d);
    @mysqli_query(
        $conn,
        "INSERT INTO student_visit_selections (availability_id, student_index_number, visit_date)
         VALUES ($avail_id, '$idx_esc', '$date_esc')"
    );
}

$student_name = '';
$name_q = "SELECT TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))) AS full_name
           FROM industrial_registration WHERE index_number='$idx_esc' LIMIT 1";
$name_res = mysqli_query($conn, $name_q);
if ($name_res && mysqli_num_rows($name_res) === 1) {
    $student_name = trim((string)(mysqli_fetch_assoc($name_res)['full_name'] ?? ''));
}

if (count($dates) > 0) {
    iasms_notify_supervisor_visit_selection($conn, $lecturer_id, $index_number, $student_name, $dates);
}

echo json_encode([
    'success' => true,
    'dates' => $dates,
    'my_selections' => array_map(static function (string $d) use ($allowed_map): array {
        return [
            'availability_id' => $allowed_map[$d],
            'date' => $d,
        ];
    }, $dates),
]);
