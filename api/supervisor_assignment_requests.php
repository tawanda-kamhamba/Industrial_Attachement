<?php
/**
 * Supervisor: review and respond to student assignment requests.
 * GET  — list pending (+ recent) or single request detail by id
 * POST — approve or reject { request_id, action: approve|reject, reason? }
 */
require_once __DIR__ . '/supervisor_request_helpers.php';

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    return;
}

$lecturer_id = (int)($_SESSION['user_id'] ?? 0);
if ($lecturer_id <= 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Session invalid']);
    return;
}

iasms_ensure_supervisor_assignment_requests_table($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $request_id = isset($segments[2]) && ctype_digit((string)$segments[2]) ? (int)$segments[2] : 0;

    if ($request_id > 0) {
        $q = "SELECT r.id, r.student_index_number, r.student_message, r.status, r.response_reason,
                     r.created_at, r.responded_at,
                     vl.lecturer_name
              FROM supervisor_assignment_requests r
              JOIN visiting_lecturers vl ON vl.id = r.lecturer_id
              WHERE r.id=$request_id AND r.lecturer_id=$lecturer_id
              LIMIT 1";
        $res = mysqli_query($conn, $q);
        if (!$res || mysqli_num_rows($res) !== 1) {
            http_response_code(404);
            echo json_encode(['error' => 'Request not found']);
            return;
        }
        $row = mysqli_fetch_assoc($res);
        $idx = (string)($row['student_index_number'] ?? '');
        $preview = iasms_get_student_request_preview($conn, $idx);

        echo json_encode([
            'request' => [
                'id' => (int)($row['id'] ?? 0),
                'student_index_number' => $idx,
                'student_message' => $row['student_message'] ?? null,
                'status' => $row['status'] ?? 'pending',
                'response_reason' => $row['response_reason'] ?? null,
                'created_at' => $row['created_at'] ?? null,
                'responded_at' => $row['responded_at'] ?? null,
                'lecturer_name' => $row['lecturer_name'] ?? '',
            ],
            'student' => $preview,
        ]);
        return;
    }

    $list = [];
    $q = "SELECT r.id, r.student_index_number, r.student_message, r.status, r.response_reason,
                 r.created_at, r.responded_at
          FROM supervisor_assignment_requests r
          WHERE r.lecturer_id=$lecturer_id
          ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC
          LIMIT 50";
    $res = mysqli_query($conn, $q);
    while ($res && ($row = mysqli_fetch_assoc($res))) {
        $idx = (string)($row['student_index_number'] ?? '');
        $preview = iasms_get_student_request_preview($conn, $idx);
        $list[] = [
            'id' => (int)($row['id'] ?? 0),
            'student_index_number' => $idx,
            'student_name' => (string)($preview['student_name'] ?? $idx),
            'student_message' => $row['student_message'] ?? null,
            'status' => $row['status'] ?? 'pending',
            'response_reason' => $row['response_reason'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'responded_at' => $row['responded_at'] ?? null,
            'programme' => $preview['registration']['programme'] ?? null,
            'faculty' => $preview['registration']['faculty'] ?? null,
            'company_name' => $preview['assumption']['company_name'] ?? null,
            'company_region' => $preview['assumption']['company_region'] ?? null,
        ];
    }

    $pending_count = 0;
    foreach ($list as $item) {
        if (($item['status'] ?? '') === 'pending') {
            $pending_count++;
        }
    }

    echo json_encode([
        'pending_count' => $pending_count,
        'requests' => $list,
    ]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];
    $request_id = (int)($body['request_id'] ?? 0);
    $action = strtolower(trim((string)($body['action'] ?? '')));
    $reason = trim((string)($body['reason'] ?? ''));

    if ($request_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'request_id is required']);
        return;
    }

    if (!in_array($action, ['approve', 'reject'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'action must be approve or reject']);
        return;
    }

    if ($action === 'reject' && $reason === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A reason is required when rejecting a request.']);
        return;
    }

    $q = "SELECT r.id, r.student_index_number, r.status, vl.lecturer_name
          FROM supervisor_assignment_requests r
          JOIN visiting_lecturers vl ON vl.id = r.lecturer_id
          WHERE r.id=$request_id AND r.lecturer_id=$lecturer_id
          LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) !== 1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Request not found']);
        return;
    }

    $row = mysqli_fetch_assoc($res);
    if (($row['status'] ?? '') !== 'pending') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'This request has already been processed.']);
        return;
    }

    $idx = trim((string)($row['student_index_number'] ?? ''));
    $lecturer_name = (string)($row['lecturer_name'] ?? '');
    $idx_esc = mysqli_real_escape_string($conn, $idx);
    $reason_esc = mysqli_real_escape_string($conn, $reason);

    if ($action === 'approve') {
        if (iasms_student_has_direct_supervisor_assignment($conn, $idx)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'This student already has an assigned supervisor.',
            ]);
            return;
        }

        if (!iasms_assign_student_to_supervisor($conn, $idx, $lecturer_id)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to assign student.']);
            return;
        }

        mysqli_query(
            $conn,
            "UPDATE supervisor_assignment_requests
             SET status='approved', response_reason=NULL, responded_at=NOW()
             WHERE id=$request_id"
        );

        mysqli_query(
            $conn,
            "UPDATE supervisor_assignment_requests
             SET status='rejected',
                 response_reason='Student was assigned to another supervisor.',
                 responded_at=NOW()
             WHERE student_index_number='$idx_esc'
               AND status='pending'
               AND id<>$request_id"
        );

        iasms_notify_student_assignment_request_resolved($conn, $idx, true, $lecturer_name);

        echo json_encode(['success' => true, 'status' => 'approved']);
        return;
    }

    mysqli_query(
        $conn,
        "UPDATE supervisor_assignment_requests
         SET status='rejected', response_reason='$reason_esc', responded_at=NOW()
         WHERE id=$request_id"
    );

    iasms_notify_student_assignment_request_resolved($conn, $idx, false, $lecturer_name, $reason);

    echo json_encode(['success' => true, 'status' => 'rejected']);
    return;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
