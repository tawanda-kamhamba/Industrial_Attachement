<?php
/**
 * Student: browse supervisors and request direct assignment.
 * GET  — eligibility, supervisors list, current/past requests
 * POST — submit request { lecturer_id, message? }
 */
require_once __DIR__ . '/supervisor_request_helpers.php';

if (($_SESSION['role'] ?? '') !== 'student') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    return;
}

$index_number = trim((string)($_SESSION['index_number'] ?? ''));
if ($index_number === '') {
    http_response_code(401);
    echo json_encode(['error' => 'Session invalid']);
    return;
}

iasms_ensure_supervisor_assignment_requests_table($conn);
$idx_esc = mysqli_real_escape_string($conn, $index_number);

$has_direct = iasms_student_has_direct_supervisor_assignment($conn, $index_number);
$eligibility = iasms_student_can_request_supervisor($conn, $index_number);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $supervisors = [];
    $lr = mysqli_query(
        $conn,
        "SELECT id, lecturer_name, lecturer_faculty, lecturer_department, lecturer_region_residence, staff_id
         FROM visiting_lecturers
         ORDER BY lecturer_name"
    );
    while ($lr && ($row = mysqli_fetch_assoc($lr))) {
        $supervisors[] = [
            'id' => (int)($row['id'] ?? 0),
            'lecturer_name' => $row['lecturer_name'] ?? '',
            'lecturer_faculty' => $row['lecturer_faculty'] ?? '',
            'lecturer_department' => $row['lecturer_department'] ?? '',
            'lecturer_region_residence' => $row['lecturer_region_residence'] ?? '',
            'staff_id' => $row['staff_id'] ?? null,
        ];
    }

    $requests = [];
    $rq = mysqli_query(
        $conn,
        "SELECT r.id, r.lecturer_id, r.student_message, r.status, r.response_reason,
                r.created_at, r.responded_at,
                vl.lecturer_name
         FROM supervisor_assignment_requests r
         JOIN visiting_lecturers vl ON vl.id = r.lecturer_id
         WHERE r.student_index_number='$idx_esc'
         ORDER BY r.created_at DESC
         LIMIT 10"
    );
    while ($rq && ($row = mysqli_fetch_assoc($rq))) {
        $requests[] = [
            'id' => (int)($row['id'] ?? 0),
            'lecturer_id' => (int)($row['lecturer_id'] ?? 0),
            'lecturer_name' => $row['lecturer_name'] ?? '',
            'student_message' => $row['student_message'] ?? null,
            'status' => $row['status'] ?? 'pending',
            'response_reason' => $row['response_reason'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'responded_at' => $row['responded_at'] ?? null,
        ];
    }

    $pending = null;
    foreach ($requests as $req) {
        if (($req['status'] ?? '') === 'pending') {
            $pending = $req;
            break;
        }
    }

    echo json_encode([
        'index_number' => $index_number,
        'has_direct_assignment' => $has_direct,
        'can_request' => !$has_direct && ($eligibility['can_request'] ?? false),
        'can_request_reason' => $has_direct
            ? 'You already have an assigned institutional supervisor.'
            : ($eligibility['reason'] ?? null),
        'supervisors' => $supervisors,
        'pending_request' => $pending,
        'requests' => $requests,
    ]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($has_direct) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'You already have an assigned supervisor.']);
        return;
    }

    if (!($eligibility['can_request'] ?? false)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $eligibility['reason'] ?? 'You cannot send a request right now.',
        ]);
        return;
    }

    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];
    $lecturer_id_raw = $body['lecturer_id'] ?? null;
    $student_message = trim((string)($body['message'] ?? ''));

    if ($lecturer_id_raw === null || $lecturer_id_raw === '' || !ctype_digit((string)$lecturer_id_raw)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Valid lecturer_id is required.']);
        return;
    }

    $lecturer_id = (int)$lecturer_id_raw;
    $check = mysqli_query($conn, "SELECT lecturer_name FROM visiting_lecturers WHERE id=$lecturer_id LIMIT 1");
    if (!$check || mysqli_num_rows($check) !== 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Supervisor not found.']);
        return;
    }
    $lecturer_row = mysqli_fetch_assoc($check);
    $lecturer_name = (string)($lecturer_row['lecturer_name'] ?? '');

    $dup = mysqli_query(
        $conn,
        "SELECT id FROM supervisor_assignment_requests
         WHERE student_index_number='$idx_esc' AND lecturer_id=$lecturer_id AND status='pending'
         LIMIT 1"
    );
    if ($dup && mysqli_num_rows($dup) > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'You already have a pending request to this supervisor.']);
        return;
    }

    $msg_sql = $student_message !== ''
        ? "'" . mysqli_real_escape_string($conn, $student_message) . "'"
        : 'NULL';

    $ins = "INSERT INTO supervisor_assignment_requests
                (student_index_number, lecturer_id, student_message, status)
            VALUES
                ('$idx_esc', $lecturer_id, $msg_sql, 'pending')";
    if (!mysqli_query($conn, $ins)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save request.']);
        return;
    }

    $request_id = (int)mysqli_insert_id($conn);
    $preview = iasms_get_student_request_preview($conn, $index_number);
    $student_name = (string)($preview['student_name'] ?? $index_number);

    iasms_notify_supervisor_assignment_request($conn, $lecturer_id, $index_number, $student_name, $request_id);

    echo json_encode([
        'success' => true,
        'request_id' => $request_id,
        'lecturer_name' => $lecturer_name,
    ]);
    return;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
