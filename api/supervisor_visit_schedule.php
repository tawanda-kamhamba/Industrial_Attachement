<?php
require_once __DIR__ . '/supervisor_helpers.php';
require_once __DIR__ . '/visit_schedule_helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$lecturer_id = iasms_visit_schedule_supervisor_lecturer_id();
if ($lecturer_id <= 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid supervisor session']);
    exit;
}

iasms_ensure_visit_schedule_tables($conn);

$supervisor_name = trim((string)($_SESSION['name'] ?? ''));

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $avail_q = "SELECT id, visit_date, published_at, created_at
                FROM supervisor_visit_availability
                WHERE lecturer_id=$lecturer_id
                ORDER BY visit_date ASC";
    $avail_res = mysqli_query($conn, $avail_q);

    $availability = [];
    $availability_ids = [];
    while ($avail_res && ($row = mysqli_fetch_assoc($avail_res))) {
        $id = (int)($row['id'] ?? 0);
        $date = (string)($row['visit_date'] ?? '');
        if ($id > 0 && $date !== '') {
            $availability[] = [
                'id' => $id,
                'date' => $date,
                'published_at' => $row['published_at'] ?? null,
                'created_at' => $row['created_at'] ?? null,
            ];
            $availability_ids[$id] = $date;
        }
    }

    $by_date = [];
    if (count($availability_ids) > 0) {
        $id_list = implode(',', array_map('intval', array_keys($availability_ids)));
        $sel_q = "SELECT svs.visit_date, svs.student_index_number,
                         TRIM(CONCAT(COALESCE(i.first_name,''), ' ', COALESCE(i.last_name,''))) AS student_name
                  FROM student_visit_selections svs
                  LEFT JOIN industrial_registration i ON i.index_number = svs.student_index_number
                  WHERE svs.availability_id IN ($id_list)
                  ORDER BY svs.visit_date ASC, student_name ASC";
        $sel_res = mysqli_query($conn, $sel_q);
        while ($sel_res && ($row = mysqli_fetch_assoc($sel_res))) {
            $date = (string)($row['visit_date'] ?? '');
            if ($date === '') {
                continue;
            }
            if (!isset($by_date[$date])) {
                $by_date[$date] = [];
            }
            $by_date[$date][] = [
                'student_index' => $row['student_index_number'] ?? '',
                'student_name' => trim((string)($row['student_name'] ?? '')) ?: ($row['student_index_number'] ?? ''),
            ];
        }
    }

    $selections = [];
    foreach ($by_date as $date => $students) {
        $selections[] = [
            'date' => $date,
            'students' => $students,
            'count' => count($students),
        ];
    }

    $assigned_count = count(iasms_visit_schedule_student_indexes_for_lecturer($conn, $lecturer_id));

    echo json_encode([
        'supervisor_name' => $supervisor_name,
        'assigned_students_count' => $assigned_count,
        'availability' => $availability,
        'selections_by_date' => $selections,
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

$action = trim((string)($body['action'] ?? 'save'));

if ($action === 'publish') {
    $pub_q = "UPDATE supervisor_visit_availability
              SET published_at = COALESCE(published_at, NOW())
              WHERE lecturer_id=$lecturer_id AND published_at IS NULL";
    mysqli_query($conn, $pub_q);

    $dates_q = "SELECT visit_date FROM supervisor_visit_availability
                WHERE lecturer_id=$lecturer_id AND published_at IS NOT NULL
                ORDER BY visit_date ASC";
    $dates_res = mysqli_query($conn, $dates_q);
    $dates = [];
    while ($dates_res && ($row = mysqli_fetch_assoc($dates_res))) {
        $d = (string)($row['visit_date'] ?? '');
        if ($d !== '') {
            $dates[] = $d;
        }
    }

    if (count($dates) > 0) {
        iasms_notify_students_visit_schedule_published($conn, $lecturer_id, $supervisor_name, $dates);
    }

    echo json_encode(['success' => true, 'notified' => count($dates) > 0, 'dates_count' => count($dates)]);
    exit;
}

$dates = iasms_visit_schedule_normalize_dates((array)($body['dates'] ?? []));
$sync = !empty($body['sync']);

if ($action === 'remove' && count($dates) > 0) {
    $in = [];
    foreach ($dates as $d) {
        $in[] = "'" . mysqli_real_escape_string($conn, $d) . "'";
    }
    $in_sql = implode(',', $in);
    $ids_q = "SELECT id FROM supervisor_visit_availability
              WHERE lecturer_id=$lecturer_id AND visit_date IN ($in_sql)";
    $ids_res = mysqli_query($conn, $ids_q);
    $ids = [];
    while ($ids_res && ($row = mysqli_fetch_assoc($ids_res))) {
        $ids[] = (int)($row['id'] ?? 0);
    }
    if (count($ids) > 0) {
        $id_in = implode(',', array_map('intval', $ids));
        @mysqli_query($conn, "DELETE FROM student_visit_selections WHERE availability_id IN ($id_in)");
        @mysqli_query(
            $conn,
            "DELETE FROM supervisor_visit_availability WHERE lecturer_id=$lecturer_id AND visit_date IN ($in_sql)"
        );
    }
    echo json_encode(['success' => true, 'removed' => count($dates)]);
    exit;
}

if ($sync && count($dates) >= 0) {
    $keep = [];
    foreach ($dates as $d) {
        $keep[] = "'" . mysqli_real_escape_string($conn, $d) . "'";
    }
    if (count($keep) > 0) {
        $keep_sql = implode(',', $keep);
        $stale_q = "SELECT id FROM supervisor_visit_availability
                    WHERE lecturer_id=$lecturer_id AND visit_date NOT IN ($keep_sql)";
    } else {
        $stale_q = "SELECT id FROM supervisor_visit_availability WHERE lecturer_id=$lecturer_id";
    }
    $stale_res = mysqli_query($conn, $stale_q);
    $stale_ids = [];
    while ($stale_res && ($row = mysqli_fetch_assoc($stale_res))) {
        $stale_ids[] = (int)($row['id'] ?? 0);
    }
    if (count($stale_ids) > 0) {
        $stale_in = implode(',', array_map('intval', $stale_ids));
        @mysqli_query($conn, "DELETE FROM student_visit_selections WHERE availability_id IN ($stale_in)");
        @mysqli_query($conn, "DELETE FROM supervisor_visit_availability WHERE id IN ($stale_in)");
    }
}

$added = 0;
foreach ($dates as $date) {
    $date_esc = mysqli_real_escape_string($conn, $date);
    $ins = "INSERT IGNORE INTO supervisor_visit_availability (lecturer_id, visit_date)
            VALUES ($lecturer_id, '$date_esc')";
    if (mysqli_query($conn, $ins) && mysqli_affected_rows($conn) > 0) {
        $added++;
    }
}

$notify = !empty($body['notify_students']);
if ($notify && count($dates) > 0) {
    mysqli_query(
        $conn,
        "UPDATE supervisor_visit_availability
         SET published_at = COALESCE(published_at, NOW())
         WHERE lecturer_id=$lecturer_id"
    );
    $all_dates_q = "SELECT visit_date FROM supervisor_visit_availability
                    WHERE lecturer_id=$lecturer_id ORDER BY visit_date ASC";
    $all_res = mysqli_query($conn, $all_dates_q);
    $all_dates = [];
    while ($all_res && ($row = mysqli_fetch_assoc($all_res))) {
        $d = (string)($row['visit_date'] ?? '');
        if ($d !== '') {
            $all_dates[] = $d;
        }
    }
    iasms_notify_students_visit_schedule_published($conn, $lecturer_id, $supervisor_name, $all_dates);
}

echo json_encode([
    'success' => true,
    'added' => $added,
    'dates' => $dates,
    'notified' => $notify,
]);
