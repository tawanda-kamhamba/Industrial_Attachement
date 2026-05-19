<?php
require_once __DIR__ . '/supervisor_helpers.php';
require_once __DIR__ . '/contract_helpers.php';

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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];
    $action = (string)($body['action'] ?? '');
    $contract_id = (int)($body['contract_id'] ?? 0);
    $comment_raw = trim((string)($body['comment'] ?? $body['admin_comment'] ?? ''));

    $result = iasms_apply_contract_status_action($conn, $contract_id, $action, $comment_raw, $in_list);
    if ($result['success']) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Update failed']);
    }
    return;
}

iasms_ensure_student_contracts_columns($conn);

$status = isset($_GET['status']) ? mysqli_real_escape_string($conn, (string)$_GET['status']) : '';
$where = "index_number IN ($in_list)";
if ($status !== '') {
    $where .= " AND status = '$status'";
}

$q = "SELECT id, student_name, index_number, original_filename, status, submission_date, admin_comment, allow_resubmit
      FROM student_contracts
      WHERE $where
      ORDER BY submission_date DESC
      LIMIT 200";
$res = mysqli_query($conn, $q);
$list = [];
while ($row = mysqli_fetch_assoc($res)) {
    $list[] = [
        'id' => (int)$row['id'],
        'student_name' => $row['student_name'] ?? '',
        'index_number' => $row['index_number'] ?? '',
        'original_filename' => $row['original_filename'] ?? '',
        'status' => $row['status'] ?? 'pending',
        'submission_date' => $row['submission_date'] ?? null,
        'admin_comment' => $row['admin_comment'] ?? '',
        'allow_resubmit' => (int)($row['allow_resubmit'] ?? 0) === 1,
    ];
}

echo json_encode($list);
