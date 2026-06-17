<?php
/**
 * Supervisor: view and acknowledge student issue reports from assigned students.
 * GET  — list (or single by id in segment 2)
 * POST — acknowledge { issue_id }
 */
require_once __DIR__ . '/supervisor_issue_helpers.php';
require_once __DIR__ . '/supervisor_helpers.php';

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

iasms_ensure_student_supervisor_issue_reports_table($conn);
$assigned_indexes = iasms_get_assigned_indexes_for_current_supervisor($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $issue_id = isset($segments[2]) && ctype_digit((string)$segments[2]) ? (int)$segments[2] : 0;

    if (count($assigned_indexes) === 0) {
        echo json_encode(['open_count' => 0, 'issues' => []]);
        return;
    }

    $in_list = [];
    foreach ($assigned_indexes as $idx) {
        $in_list[] = "'" . mysqli_real_escape_string($conn, $idx) . "'";
    }
    $in_sql = implode(',', $in_list);

    if ($issue_id > 0) {
        $q = "SELECT r.id, r.student_index_number, r.category, r.issue_message, r.status,
                     r.created_at, r.acknowledged_at, r.acknowledged_by_lecturer_id
              FROM student_supervisor_issue_reports r
              WHERE r.id=$issue_id AND r.student_index_number IN ($in_sql)
              LIMIT 1";
        $res = mysqli_query($conn, $q);
        if (!$res || mysqli_num_rows($res) !== 1) {
            http_response_code(404);
            echo json_encode(['error' => 'Issue not found']);
            return;
        }
        $row = mysqli_fetch_assoc($res);
        $idx = (string)($row['student_index_number'] ?? '');
        echo json_encode([
            'issue' => [
                'id' => (int)($row['id'] ?? 0),
                'student_index_number' => $idx,
                'student_name' => iasms_get_student_display_name($conn, $idx),
                'category' => $row['category'] ?? 'general',
                'issue_message' => $row['issue_message'] ?? '',
                'status' => $row['status'] ?? 'open',
                'created_at' => $row['created_at'] ?? null,
                'acknowledged_at' => $row['acknowledged_at'] ?? null,
            ],
        ]);
        return;
    }

    $issues = [];
    $open_count = 0;
    $q = "SELECT r.id, r.student_index_number, r.category, r.issue_message, r.status,
                 r.created_at, r.acknowledged_at
          FROM student_supervisor_issue_reports r
          WHERE r.student_index_number IN ($in_sql)
          ORDER BY FIELD(r.status, 'open', 'acknowledged'), r.created_at DESC
          LIMIT 100";
    $res = mysqli_query($conn, $q);
    while ($res && ($row = mysqli_fetch_assoc($res))) {
        $idx = (string)($row['student_index_number'] ?? '');
        $status = $row['status'] ?? 'open';
        if ($status === 'open') {
            $open_count++;
        }
        $issues[] = [
            'id' => (int)($row['id'] ?? 0),
            'student_index_number' => $idx,
            'student_name' => iasms_get_student_display_name($conn, $idx),
            'category' => $row['category'] ?? 'general',
            'issue_message' => $row['issue_message'] ?? '',
            'status' => $status,
            'created_at' => $row['created_at'] ?? null,
            'acknowledged_at' => $row['acknowledged_at'] ?? null,
        ];
    }

    echo json_encode(['open_count' => $open_count, 'issues' => $issues]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];
    $issue_id = (int)($body['issue_id'] ?? 0);

    if ($issue_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'issue_id is required']);
        return;
    }

    if (count($assigned_indexes) === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Not authorized']);
        return;
    }

    $in_list = [];
    foreach ($assigned_indexes as $idx) {
        $in_list[] = "'" . mysqli_real_escape_string($conn, $idx) . "'";
    }
    $in_sql = implode(',', $in_list);

    $check = mysqli_query(
        $conn,
        "SELECT id, status FROM student_supervisor_issue_reports
         WHERE id=$issue_id AND student_index_number IN ($in_sql)
         LIMIT 1"
    );
    if (!$check || mysqli_num_rows($check) !== 1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Issue not found']);
        return;
    }

    $row = mysqli_fetch_assoc($check);
    if (($row['status'] ?? '') === 'acknowledged') {
        echo json_encode(['success' => true, 'status' => 'acknowledged']);
        return;
    }

    mysqli_query(
        $conn,
        "UPDATE student_supervisor_issue_reports
         SET status='acknowledged',
             acknowledged_by_lecturer_id=$lecturer_id,
             acknowledged_at=NOW()
         WHERE id=$issue_id"
    );

    echo json_encode(['success' => true, 'status' => 'acknowledged']);
    return;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
