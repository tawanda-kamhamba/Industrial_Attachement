<?php
/**
 * Student reports issues to assigned institutional supervisor(s).
 * GET  — eligibility, supervisors, recent reports
 * POST — submit { message, category? }
 */
require_once __DIR__ . '/supervisor_issue_helpers.php';

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

iasms_ensure_student_supervisor_issue_reports_table($conn);
$idx_esc = mysqli_real_escape_string($conn, $index_number);

$allowed_categories = ['general', 'company', 'logbook', 'assessment', 'supervisor_visit', 'other'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $has_supervisor = iasms_student_has_assigned_supervisor($conn, $index_number);
    $supervisor_ids = iasms_get_assigned_supervisor_ids_for_student($conn, $index_number);

    $supervisors = [];
    if (count($supervisor_ids) > 0) {
        $ids_sql = implode(',', array_map('intval', $supervisor_ids));
        $lr = mysqli_query(
            $conn,
            "SELECT id, lecturer_name, lecturer_faculty, lecturer_department, staff_id
             FROM visiting_lecturers WHERE id IN ($ids_sql)
             ORDER BY lecturer_name"
        );
        while ($lr && ($row = mysqli_fetch_assoc($lr))) {
            $supervisors[] = [
                'id' => (int)($row['id'] ?? 0),
                'lecturer_name' => $row['lecturer_name'] ?? '',
                'lecturer_faculty' => $row['lecturer_faculty'] ?? '',
                'lecturer_department' => $row['lecturer_department'] ?? '',
                'staff_id' => $row['staff_id'] ?? null,
            ];
        }
    }

    $reports = [];
    $rq = mysqli_query(
        $conn,
        "SELECT id, category, issue_message, status, created_at, acknowledged_at
         FROM student_supervisor_issue_reports
         WHERE student_index_number='$idx_esc'
         ORDER BY created_at DESC
         LIMIT 20"
    );
    while ($rq && ($row = mysqli_fetch_assoc($rq))) {
        $reports[] = [
            'id' => (int)($row['id'] ?? 0),
            'category' => $row['category'] ?? 'general',
            'issue_message' => $row['issue_message'] ?? '',
            'status' => $row['status'] ?? 'open',
            'created_at' => $row['created_at'] ?? null,
            'acknowledged_at' => $row['acknowledged_at'] ?? null,
        ];
    }

    echo json_encode([
        'has_assigned_supervisor' => $has_supervisor,
        'supervisors' => $supervisors,
        'reports' => $reports,
        'categories' => $allowed_categories,
    ]);
    return;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!iasms_student_has_assigned_supervisor($conn, $index_number)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'You do not have an assigned institutional supervisor yet. Request or wait for assignment first.',
        ]);
        return;
    }

    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];
    $message = trim((string)($body['message'] ?? ''));
    $category = strtolower(trim((string)($body['category'] ?? 'general')));

    if ($message === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Please describe the issue you are facing.']);
        return;
    }

    if (strlen($message) > 5000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Issue description is too long (max 5000 characters).']);
        return;
    }

    if (!in_array($category, $allowed_categories, true)) {
        $category = 'general';
    }

    $msg_esc = mysqli_real_escape_string($conn, $message);
    $cat_esc = mysqli_real_escape_string($conn, $category);

    $ins = "INSERT INTO student_supervisor_issue_reports
                (student_index_number, category, issue_message, status)
            VALUES
                ('$idx_esc', '$cat_esc', '$msg_esc', 'open')";
    if (!mysqli_query($conn, $ins)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to submit report.']);
        return;
    }

    $issue_id = (int)mysqli_insert_id($conn);
    $student_name = iasms_get_student_display_name($conn, $index_number);
    iasms_notify_supervisors_student_issue($conn, $index_number, $student_name, $issue_id, $category);

    echo json_encode(['success' => true, 'issue_id' => $issue_id]);
    return;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
