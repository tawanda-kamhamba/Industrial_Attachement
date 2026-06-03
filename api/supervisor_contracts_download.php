<?php
/**
 * GET /iasms/api/supervisor/contracts/download?id=123
 * Stream contract PDF for assigned students only (supervisor session).
 */
require_once __DIR__ . '/supervisor_helpers.php';

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not authorized']);
    exit;
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id < 1) {
    $reqUri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('~/contracts/download/(\d+)(?:\?|$)~', $reqUri, $m)) {
        $id = (int)$m[1];
    }
}
if ($id < 1) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid contract id']);
    exit;
}

$q = "SELECT contract_file, original_filename, index_number FROM student_contracts WHERE id=$id LIMIT 1";
$res = mysqli_query($conn, $q);
$row = $res ? mysqli_fetch_assoc($res) : null;
if (!$row || empty($row['contract_file'])) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Contract not found']);
    exit;
}

$studentIndex = trim((string)($row['index_number'] ?? ''));
if ($studentIndex === '' || !iasms_supervisor_can_access_student_index($conn, $studentIndex)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not allowed to view this contract']);
    exit;
}

$contract_file = $row['contract_file'];
$base = dirname(__DIR__);
$path = $base . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $contract_file);

if (!is_file($path)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'File not found']);
    exit;
}

$filename = !empty($row['original_filename']) ? $row['original_filename'] : basename($path);
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . str_replace('"', '\\"', $filename) . '"');
header('Content-Length: ' . filesize($path));
readfile($path);
exit;
