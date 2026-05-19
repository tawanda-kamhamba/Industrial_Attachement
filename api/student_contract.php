<?php
/**
 * Student contract: GET = current student's contract status from student_contracts;
 * POST = upload contract file (insert or replace when resubmission allowed).
 */
require_once __DIR__ . '/notification_helpers.php';
require_once __DIR__ . '/contract_helpers.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

$index_number = $_SESSION['index_number'] ?? '';
$student_name = $_SESSION['name'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}

$idx = mysqli_real_escape_string($conn, $index_number);
$student_name_esc = mysqli_real_escape_string($conn, $student_name);
iasms_ensure_student_contracts_columns($conn);

// GET: return contract status from student_contracts for this student
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = "SELECT id, contract_file, original_filename, status, submission_date, admin_comment, allow_resubmit
          FROM student_contracts WHERE index_number='$idx' ORDER BY submission_date DESC LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) === 0) {
        echo json_encode(['submitted' => false, 'can_resubmit' => false]);
        return;
    }
    $row = mysqli_fetch_assoc($res);
    $allow_resubmit = (int)($row['allow_resubmit'] ?? 0) === 1;
    echo json_encode([
        'submitted' => true,
        'id' => (int)$row['id'],
        'status' => $row['status'] ?? 'pending',
        'submission_date' => $row['submission_date'] ?? null,
        'original_filename' => $row['original_filename'] ?? '',
        'admin_comment' => $row['admin_comment'] ?? '',
        'can_resubmit' => $allow_resubmit,
    ]);
    return;
}

// POST: upload contract
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

if (!isset($_FILES['contract_file']) || $_FILES['contract_file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Please select a contract file to upload.']);
    return;
}

$file = $_FILES['contract_file'];
$tmp = $file['tmp_name'];
$name = $file['name'];
$size = $file['size'];
$type = $file['type'] ?? '';

$allowed_types = ['application/pdf'];
if (!in_array($type, $allowed_types, true)) {
    echo json_encode(['success' => false, 'error' => 'Only PDF files are allowed.']);
    return;
}
if ($size > 5242880) {
    echo json_encode(['success' => false, 'error' => 'File size must be less than 5MB.']);
    return;
}

$check = mysqli_query(
    $conn,
    "SELECT id, contract_file, allow_resubmit FROM student_contracts WHERE index_number='$idx' LIMIT 1"
);
$existing = ($check && mysqli_num_rows($check) === 1) ? mysqli_fetch_assoc($check) : null;

if ($existing && (int)($existing['allow_resubmit'] ?? 0) !== 1) {
    echo json_encode([
        'success' => false,
        'error' => 'You have already submitted your contract. Ask your supervisor or admin to allow resubmission if you need to upload again.',
    ]);
    return;
}

$base_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'contracts';
if (!is_dir($base_dir)) {
    @mkdir($base_dir, 0755, true);
}
$safe_index = str_replace(['/', '\\'], '_', $index_number);
$new_filename = 'contract_' . $safe_index . '_' . time() . '.pdf';
$relative_path = 'uploads/contracts/' . $new_filename;
$absolute_path = $base_dir . DIRECTORY_SEPARATOR . $new_filename;

if (!move_uploaded_file($tmp, $absolute_path)) {
    echo json_encode(['success' => false, 'error' => 'Error uploading file. Please try again.']);
    return;
}

$name_esc = mysqli_real_escape_string($conn, $name);
$path_esc = mysqli_real_escape_string($conn, $relative_path);

if ($existing) {
    $old_path = (string)($existing['contract_file'] ?? '');
    if ($old_path !== '') {
        $old_abs = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $old_path);
        if (is_file($old_abs)) {
            @unlink($old_abs);
        }
    }
    $contract_id = (int)($existing['id'] ?? 0);
    $upd = "UPDATE student_contracts SET
            student_name='$student_name_esc',
            contract_file='$path_esc',
            original_filename='$name_esc',
            status='pending',
            allow_resubmit=0,
            admin_comment='',
            submission_date=NOW()
            WHERE index_number='$idx'";
    if (!mysqli_query($conn, $upd)) {
        @unlink($absolute_path);
        echo json_encode(['success' => false, 'error' => 'Error saving contract to database.']);
        return;
    }
    iasms_notify_supervisors_contract_submitted($conn, $index_number, $student_name, $contract_id > 0 ? $contract_id : null);
    echo json_encode([
        'success' => true,
        'message' => 'Contract resubmitted successfully! Your new contract is pending approval.',
        'updated' => true,
    ]);
    return;
}

$insert = "INSERT INTO student_contracts (student_name, index_number, contract_file, original_filename, status, allow_resubmit)
           VALUES ('$student_name_esc', '$idx', '$path_esc', '$name_esc', 'pending', 0)";

if (!mysqli_query($conn, $insert)) {
    @unlink($absolute_path);
    echo json_encode(['success' => false, 'error' => 'Error saving contract to database.']);
    return;
}

$contract_id = (int)mysqli_insert_id($conn);
iasms_notify_supervisors_contract_submitted($conn, $index_number, $student_name, $contract_id > 0 ? $contract_id : null);

echo json_encode([
    'success' => true,
    'message' => 'Contract submitted successfully! Your contract is pending approval.',
]);
