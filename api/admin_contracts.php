<?php
/**
 * Admin contracts: list and approve/reject/allow resubmit. All data from student_contracts table only.
 */
require_once __DIR__ . '/contract_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? trim(strtolower((string)$_POST['action'])) : (isset($_GET['action']) ? trim(strtolower((string)$_GET['action'])) : '');
    $contract_id = isset($_POST['contract_id']) ? (int)$_POST['contract_id'] : (isset($_GET['contract_id']) ? (int)$_GET['contract_id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0));
    $admin_comment_raw = trim((string)($_POST['admin_comment'] ?? $_GET['admin_comment'] ?? ''));

    $result = iasms_apply_contract_status_action($conn, $contract_id, $action, $admin_comment_raw, null);
    if ($result['success']) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Update failed']);
    }
    return;
}

iasms_ensure_student_contracts_columns($conn);

$status = isset($_GET['status']) ? mysqli_real_escape_string($conn, $_GET['status']) : '';
$where = '1=1';
if ($status !== '') {
    $where .= " AND status = '$status'";
}

$q = "SELECT id, student_name, index_number, original_filename, contract_file, status, submission_date, admin_comment, allow_resubmit
      FROM student_contracts WHERE $where ORDER BY submission_date DESC LIMIT 200";
$res = mysqli_query($conn, $q);
$list = [];
while ($row = mysqli_fetch_assoc($res)) {
    $list[] = [
        'id' => (int)$row['id'],
        'student_name' => $row['student_name'] ?? '',
        'index_number' => $row['index_number'] ?? '',
        'original_filename' => $row['original_filename'] ?? '',
        'contract_file' => $row['contract_file'] ?? '',
        'status' => $row['status'] ?? 'pending',
        'submission_date' => $row['submission_date'] ?? null,
        'admin_comment' => $row['admin_comment'] ?? '',
        'allow_resubmit' => (int)($row['allow_resubmit'] ?? 0) === 1,
    ];
}
echo json_encode($list);
